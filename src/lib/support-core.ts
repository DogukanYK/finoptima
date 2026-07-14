// Müşteri destek çekirdeği — userId parametreli; web server action'ları ve mobil
// API route'ları BURADAN çağırır (iş mantığı tek yerde). queries.ts konvansiyonu:
// Plain serializable objeler döner (Date → ISO). Rate limitler ve audit çağrıları
// çekirdekte — hangi yüzeyden gelirse gelsin atlanamaz.

import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { toDateKey } from "@/lib/format";
import { getDashboard } from "@/lib/queries";
import { sendEmail, notifyAdmins } from "@/lib/email/resend";
import { ticketCreatedUser, ticketCreatedAdmin } from "@/lib/email/templates";
import {
  runSupportAssistant,
  SUPPORT_CATEGORIES,
  type SupportAIResult,
  type SupportContext,
} from "@/lib/ai/support";
import {
  getActiveConsent,
  CONSENT_SCOPES,
  CONSENT_HOURS,
  type ActiveConsent,
} from "@/lib/support/consent";
import type { AssistantMessage } from "@/lib/assistant-types";

/* ===================== Tipler ===================== */

export type PlainSupportMessage = {
  id: string;
  author: string; // USER | AGENT | AI | SYSTEM
  body: string;
  createdAt: string;
};

export type PlainSupportTicket = {
  id: string;
  shortId: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  channel: string;
  lastMessageAt: string;
  lastMessageAuthor: string;
  unread: boolean; // kullanıcı için: son mesaj okunmamış mı
  createdAt: string;
};

export type PlainTicketDetail = PlainSupportTicket & {
  messages: PlainSupportMessage[];
  consent: ActiveConsent | null;
};

export type SupportOpResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

const CATEGORY_SET = new Set<string>(SUPPORT_CATEGORIES);

function plainTicket(t: {
  id: string;
  shortId: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  channel: string;
  lastMessageAt: Date;
  lastMessageAuthor: string;
  userLastReadAt: Date | null;
  createdAt: Date;
}): PlainSupportTicket {
  return {
    id: t.id,
    shortId: t.shortId,
    subject: t.subject,
    category: t.category,
    priority: t.priority,
    status: t.status,
    channel: t.channel,
    lastMessageAt: t.lastMessageAt.toISOString(),
    lastMessageAuthor: t.lastMessageAuthor,
    unread:
      t.lastMessageAuthor !== "USER" &&
      (!t.userLastReadAt || t.userLastReadAt < t.lastMessageAt),
    createdAt: t.createdAt.toISOString(),
  };
}

/* ===================== E-posta bildirimi ===================== */

// Yeni talep (APP ya da AI-eskale) → sahibine onay + adminlere kuyruk bildirimi.
// KVKK: gövdede yalnız talep meta'sı gider, finansal veri ASLA.
// Hiçbir koşulda throw etmez — e-posta hatası talep açmayı bloklamamalı.
async function emailTicketCreated(
  userId: string,
  ticket: { id: string; shortId: number },
  meta: { subject: string; category: string },
): Promise<void> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    const forUser = ticketCreatedUser({
      shortId: ticket.shortId,
      subject: meta.subject,
      ticketId: ticket.id,
    });
    const forAdmin = ticketCreatedAdmin({
      shortId: ticket.shortId,
      subject: meta.subject,
      ticketId: ticket.id,
      customerName: user?.name ?? "Müşteri",
      category: meta.category,
    });

    await Promise.allSettled([
      user?.email
        ? sendEmail({ to: user.email, subject: forUser.subject, html: forUser.html })
        : Promise.resolve(false),
      notifyAdmins(forAdmin.subject, forAdmin.html),
    ]);

    await logAudit({
      userId,
      action: "support.email_sent",
      entityType: "SupportTicket",
      entityId: ticket.id,
      metadata: { kind: "ticket_created" },
    });
  } catch (err) {
    console.error("[support] talep e-postası gönderilemedi:", err);
  }
}

/* ===================== Ticket CRUD (kullanıcı) ===================== */

export async function listTicketsForUser(
  userId: string,
): Promise<PlainSupportTicket[]> {
  const tickets = await db.supportTicket.findMany({
    where: { userId },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });
  return tickets.map(plainTicket);
}

export async function createTicketForUser(
  userId: string,
  input: { subject: string; category?: string; body: string; channel?: "APP" | "AI" },
): Promise<SupportOpResult> {
  const subject = input.subject.trim().slice(0, 160);
  const body = input.body.trim().slice(0, 5000);
  if (subject.length < 3) return { ok: false, error: "Konu en az 3 karakter olmalı." };
  if (body.length < 5) return { ok: false, error: "Mesaj en az 5 karakter olmalı." };

  const rl = await rateLimit(`support:create:${userId}`, 10, 24 * 60 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: "Çok fazla talep açtın. Lütfen daha sonra dene." };

  const category = CATEGORY_SET.has(input.category ?? "") ? input.category! : "OTHER";

  const ticket = await db.supportTicket.create({
    data: {
      userId,
      subject,
      category: category as never,
      channel: (input.channel ?? "APP") as never,
      lastMessageAuthor: "USER",
      messages: {
        create: { author: "USER", authorUserId: userId, body },
      },
    },
    select: { id: true, shortId: true },
  });

  await logAudit({
    userId,
    action: "support.ticket_create",
    entityType: "SupportTicket",
    entityId: ticket.id,
    metadata: { shortId: ticket.shortId, category },
  });

  await emailTicketCreated(userId, ticket, { subject, category });

  return { ok: true, id: ticket.id };
}

// Kullanıcı görünümü: internal (iç not) mesajlar ASLA dönmez.
// after verilirse yalnız o andan sonraki mesajlar (polling).
export async function getTicketForUser(
  userId: string,
  ticketId: string,
  opts: { after?: string } = {},
): Promise<PlainTicketDetail | null> {
  const after = opts.after ? new Date(opts.after) : null;
  const ticket = await db.supportTicket.findFirst({
    where: { id: ticketId, userId },
    include: {
      messages: {
        where: {
          internal: false,
          ...(after && !Number.isNaN(after.getTime())
            ? { createdAt: { gt: after } }
            : {}),
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ticket) return null;

  // Okundu işareti (yalnız tam yüklemede — polling'de de zararsız).
  await db.supportTicket.updateMany({
    where: { id: ticketId, userId },
    data: { userLastReadAt: new Date() },
  });

  const consent = await getActiveConsent(ticketId);
  return {
    ...plainTicket(ticket),
    unread: false,
    messages: ticket.messages.map((m) => ({
      id: m.id,
      author: m.author,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    })),
    consent,
  };
}

export async function addMessageForUser(
  userId: string,
  ticketId: string,
  body: string,
): Promise<SupportOpResult> {
  const text = body.trim().slice(0, 5000);
  if (text.length < 1) return { ok: false, error: "Boş mesaj gönderilemez." };

  const rl = await rateLimit(`support:msg:${userId}`, 30, 10 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: "Çok hızlı mesaj gönderiyorsun. Biraz bekle." };

  const ticket = await db.supportTicket.findFirst({
    where: { id: ticketId, userId },
    select: { id: true, status: true },
  });
  if (!ticket) return { ok: false, error: "Talep bulunamadı." };
  if (ticket.status === "CLOSED")
    return { ok: false, error: "Kapalı talebe mesaj eklenemez. Yeni talep aç." };

  await db.$transaction([
    db.supportMessage.create({
      data: { ticketId, author: "USER", authorUserId: userId, body: text },
    }),
    db.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastMessageAt: new Date(),
        lastMessageAuthor: "USER",
        // Kullanıcı yazınca: çözüldü sanılan talep yeniden açılır.
        status: ticket.status === "RESOLVED" ? "OPEN" : undefined,
      },
    }),
  ]);

  await logAudit({
    userId,
    action: "support.message_send",
    entityType: "SupportTicket",
    entityId: ticketId,
  });

  return { ok: true };
}

export async function closeTicketForUser(
  userId: string,
  ticketId: string,
): Promise<SupportOpResult> {
  const updated = await db.supportTicket.updateMany({
    where: { id: ticketId, userId, status: { not: "CLOSED" } },
    data: { status: "CLOSED", closedAt: new Date() },
  });
  if (updated.count === 0) return { ok: false, error: "Talep bulunamadı." };
  await logAudit({
    userId,
    action: "support.ticket_close_user",
    entityType: "SupportTicket",
    entityId: ticketId,
  });
  return { ok: true };
}

/* ===================== Consent (izin) ===================== */

export async function grantConsentForUser(
  userId: string,
  ticketId: string,
  input: { hours: number; scopes: string[] },
): Promise<SupportOpResult> {
  const rl = await rateLimit(`support:consent:${userId}`, 5, 60 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: "Çok sık izin işlemi. Biraz bekle." };

  const ticket = await db.supportTicket.findFirst({
    where: { id: ticketId, userId },
    select: { id: true },
  });
  if (!ticket) return { ok: false, error: "Talep bulunamadı." };

  const hours = (CONSENT_HOURS as readonly number[]).includes(input.hours)
    ? input.hours
    : 24;
  const scopes = input.scopes.filter((s) =>
    (CONSENT_SCOPES as readonly string[]).includes(s),
  );
  if (scopes.length === 0) return { ok: false, error: "En az bir kapsam seç." };

  const scopeLabels: Record<string, string> = {
    transactions: "İşlemler",
    debts: "Borçlar",
    findeks: "Findeks",
    dashboard: "Panel özeti",
  };

  await db.$transaction([
    // Önceki aktif izinleri iptal et (tek aktif izin kuralı).
    db.supportConsent.updateMany({
      where: { ticketId, userId, status: "ACTIVE" },
      data: { status: "REVOKED", revokedAt: new Date() },
    }),
    db.supportConsent.create({
      data: {
        ticketId,
        userId,
        scopes,
        expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000),
      },
    }),
    db.supportMessage.create({
      data: {
        ticketId,
        author: "SYSTEM",
        body: `Kullanıcı ${hours} saatliğine detaylı veri erişim izni verdi: ${scopes
          .map((s) => scopeLabels[s] ?? s)
          .join(", ")}.`,
      },
    }),
    db.supportTicket.update({
      where: { id: ticketId },
      data: { lastMessageAt: new Date(), lastMessageAuthor: "SYSTEM" },
    }),
  ]);

  await logAudit({
    userId,
    action: "support.consent_grant",
    entityType: "SupportTicket",
    entityId: ticketId,
    metadata: { hours, scopes },
  });

  return { ok: true };
}

export async function revokeConsentForUser(
  userId: string,
  ticketId: string,
): Promise<SupportOpResult> {
  const updated = await db.supportConsent.updateMany({
    where: { ticketId, userId, status: "ACTIVE" },
    data: { status: "REVOKED", revokedAt: new Date() },
  });
  if (updated.count > 0) {
    await db.supportMessage.create({
      data: {
        ticketId,
        author: "SYSTEM",
        body: "Kullanıcı detaylı veri erişim iznini iptal etti.",
      },
    });
    await db.supportTicket.update({
      where: { id: ticketId },
      data: { lastMessageAt: new Date(), lastMessageAuthor: "SYSTEM" },
    });
    await logAudit({
      userId,
      action: "support.consent_revoke",
      entityType: "SupportTicket",
      entityId: ticketId,
    });
  }
  return { ok: true };
}

/* ===================== AI ön-yanıt ===================== */

export type SupportAIResponse =
  | (SupportAIResult & { ok: true })
  | { ok: false; error: string };

export async function askSupportAIForUser(
  userId: string,
  history: AssistantMessage[],
  text: string,
): Promise<SupportAIResponse> {
  const trimmed = text.trim().slice(0, 1000);
  if (!trimmed) return { ok: false, error: "Bir şey yazmadın." };

  const rl = await rateLimit(`support:ai:${userId}`, 20, 60 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: "AI destek limiti doldu. Birazdan tekrar dene ya da talep aç." };

  const [dash, user, cats, accounts, recentTx, openTickets] = await Promise.all([
    getDashboard(userId),
    db.user.findUnique({
      where: { id: userId },
      select: { name: true, twoFactorEnabled: true },
    }),
    db.category.findMany({ where: { userId }, select: { name: true } }),
    db.account.findMany({
      where: { userId },
      select: { label: true, bankName: true },
    }),
    db.transaction.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 15,
    }),
    db.supportTicket.findMany({
      where: { userId, status: { in: ["OPEN", "IN_PROGRESS", "WAITING_USER"] } },
      select: { shortId: true, subject: true, status: true },
      take: 5,
    }),
  ]);

  const ctx: SupportContext = {
    todayISO: toDateKey(new Date()),
    userName: user?.name ?? "Kullanıcı",
    finance: {
      balance: dash.balance,
      monthIncome: dash.income,
      monthExpense: dash.expense,
      monthNet: dash.net,
    },
    categories: cats.map((c) => c.name),
    accounts: accounts.map((a) => a.label || a.bankName),
    recent: recentTx.map((t) => ({
      date: toDateKey(new Date(t.date)),
      description: t.description,
      amount: Number(t.amount),
      kind: t.kind,
    })),
    openTickets,
    twoFactorEnabled: Boolean(user?.twoFactorEnabled),
  };

  // Oturum başlangıcında bir kez logla (her mesajda değil).
  if (history.length === 0) {
    await logAudit({ userId, action: "support.ai_session" });
  }

  try {
    const result = await runSupportAssistant(history.slice(-10), trimmed, ctx);
    return { ok: true, ...result };
  } catch {
    return {
      ok: false,
      error: "Asistan şu an yanıt veremiyor. İstersen talebini insan desteğe ilet.",
    };
  }
}

// AI sohbeti insana aktarır: transcript SYSTEM mesajı olarak gömülür.
export async function escalateSupportChatForUser(
  userId: string,
  input: {
    transcript: AssistantMessage[];
    subject: string;
    category?: string;
    summary?: string;
  },
): Promise<SupportOpResult> {
  const subject = input.subject.trim().slice(0, 160) || "Destek talebi";
  const rl = await rateLimit(`support:create:${userId}`, 10, 24 * 60 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: "Çok fazla talep açtın. Lütfen daha sonra dene." };

  const category = CATEGORY_SET.has(input.category ?? "") ? input.category! : "OTHER";
  const transcriptText = input.transcript
    .slice(-20)
    .map((m) => `${m.role === "user" ? "Kullanıcı" : "AI"}: ${m.content}`)
    .join("\n\n")
    .slice(0, 15000);

  const ticket = await db.supportTicket.create({
    data: {
      userId,
      subject,
      category: category as never,
      channel: "AI",
      escalatedAt: new Date(),
      lastMessageAuthor: "USER",
      messages: {
        create: [
          {
            author: "SYSTEM",
            body: `AI destek sohbetinden aktarıldı. Sohbet dökümü:\n\n${transcriptText}`,
          },
          {
            author: "USER",
            authorUserId: userId,
            body: (input.summary ?? "").trim().slice(0, 5000) || "Sorunum çözülmedi, yardım rica ediyorum.",
          },
        ],
      },
    },
    select: { id: true, shortId: true },
  });

  await logAudit({
    userId,
    action: "support.ai_escalate",
    entityType: "SupportTicket",
    entityId: ticket.id,
    metadata: { shortId: ticket.shortId, category },
  });

  await emailTicketCreated(userId, ticket, { subject, category });

  return { ok: true, id: ticket.id };
}
