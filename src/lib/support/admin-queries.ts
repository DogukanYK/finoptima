// Admin destek sorguları — KVKK kademeli erişim burada uygulanır.
// KURAL 1: Her müşteri-verisi okuması logAudit ile BU DOSYANIN İÇİNDE loglanır
//          (çağıran atlayamaz).
// KURAL 2: Tier2 fonksiyonu consent objesini ZORUNLU parametre alır — izinsiz
//          kod yolu detay veriyi üretemez.
// KURAL 3: FinanceProfile'ın şifreli kimlik alanları (taxOrIdNumber, fullAddress,
//          aiIdentityText) admin için HİÇBİR tier'da decrypt edilmez — decryptField
//          yalnız verinin sahibi olan kullanıcı akışlarında kullanılır.

import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  getDashboard,
  getDebts,
  getLatestFindeksReport,
  getTransactions,
} from "@/lib/queries";
import { hasScope, type ActiveConsent } from "@/lib/support/consent";
import { runDraftSuggestion } from "@/lib/ai/support";
import { rateLimit } from "@/lib/rate-limit";

/* ===================== Kuyruk ===================== */

export type AdminTicketRow = {
  id: string;
  shortId: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  channel: string;
  customerName: string;
  customerEmail: string;
  customerId: string;
  lastMessageAt: string;
  lastMessageAuthor: string; // USER ise "müşteri bekliyor"
  firstAgentReplyAt: string | null;
  createdAt: string;
};

export async function listTicketsAdmin(filters: {
  status?: string;
  category?: string;
} = {}): Promise<AdminTicketRow[]> {
  const VALID_STATUS = ["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"];
  const where: Record<string, unknown> = {};
  if (filters.status && VALID_STATUS.includes(filters.status)) where.status = filters.status;
  else if (!filters.status) where.status = { in: ["OPEN", "IN_PROGRESS", "WAITING_USER"] };
  else if (filters.status === "ALL") delete where.status;
  if (filters.category) where.category = filters.category;

  const tickets = await db.supportTicket.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
  });

  return tickets.map((t) => ({
    id: t.id,
    shortId: t.shortId,
    subject: t.subject,
    category: t.category,
    priority: t.priority,
    status: t.status,
    channel: t.channel,
    customerName: t.user.name,
    customerEmail: t.user.email,
    customerId: t.user.id,
    lastMessageAt: t.lastMessageAt.toISOString(),
    lastMessageAuthor: t.lastMessageAuthor,
    firstAgentReplyAt: t.firstAgentReplyAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function getAdminKpis() {
  const [open, waitingFirstReply, resolvedToday, aiEscalated, total] =
    await Promise.all([
      db.supportTicket.count({
        where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_USER"] } },
      }),
      db.supportTicket.count({
        where: {
          status: { in: ["OPEN", "IN_PROGRESS"] },
          firstAgentReplyAt: null,
        },
      }),
      db.supportTicket.count({
        where: {
          resolvedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.supportTicket.count({ where: { channel: "AI" } }),
      db.supportTicket.count(),
    ]);
  return { open, waitingFirstReply, resolvedToday, aiEscalated, total };
}

/* ===================== Admin ticket görünümü ===================== */

export type AdminTicketDetail = AdminTicketRow & {
  messages: {
    id: string;
    author: string;
    body: string;
    internal: boolean;
    createdAt: string;
  }[];
  consent: ActiveConsent | null;
  assignedToId: string | null;
};

export async function getTicketAdmin(
  adminId: string,
  ticketId: string,
): Promise<AdminTicketDetail | null> {
  const t = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
      consents: {
        where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
        orderBy: { grantedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!t) return null;

  await logAudit({
    userId: adminId,
    action: "support.admin_view_ticket",
    entityType: "SupportTicket",
    entityId: ticketId,
    metadata: { shortId: t.shortId, customerId: t.user.id },
  });

  const c = t.consents[0] ?? null;
  return {
    id: t.id,
    shortId: t.shortId,
    subject: t.subject,
    category: t.category,
    priority: t.priority,
    status: t.status,
    channel: t.channel,
    customerName: t.user.name,
    customerEmail: t.user.email,
    customerId: t.user.id,
    lastMessageAt: t.lastMessageAt.toISOString(),
    lastMessageAuthor: t.lastMessageAuthor,
    firstAgentReplyAt: t.firstAgentReplyAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    assignedToId: t.assignedToId,
    messages: t.messages.map((m) => ({
      id: m.id,
      author: m.author,
      body: m.body,
      internal: m.internal,
      createdAt: m.createdAt.toISOString(),
    })),
    consent: c
      ? {
          id: c.id,
          ticketId: c.ticketId,
          userId: c.userId,
          scopes: c.scopes,
          grantedAt: c.grantedAt.toISOString(),
          expiresAt: c.expiresAt.toISOString(),
        }
      : null,
  };
}

/* ===================== Müşteri listesi ===================== */

export async function listCustomers(
  adminId: string,
  q?: string,
): Promise<
  { id: string; name: string; email: string; role: string; createdAt: string; ticketCount: number }[]
> {
  const query = (q ?? "").trim();
  if (query) {
    await logAudit({
      userId: adminId,
      action: "support.customer_search",
      metadata: { q: query.slice(0, 100) },
    });
  }
  const users = await db.user.findMany({
    where: query
      ? {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { supportTickets: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    ticketCount: u._count.supportTickets,
  }));
}

/* ===================== Müşteri 360° — Tier 1 (HEP maskeli) ===================== */

export type Customer360Tier1 = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  onboardedAt: string | null;
  consentedAt: string | null;
  twoFactorEnabled: boolean;
  counts: {
    transactions: number;
    categories: number;
    accounts: number;
    debts: number;
    findeksReports: number;
    statementImports: number;
  };
  lastActivityAt: string | null;
  recentAuditEvents: { action: string; createdAt: string }[];
  tickets: {
    id: string;
    shortId: number;
    subject: string;
    status: string;
    createdAt: string;
  }[];
};

export async function getCustomer360Tier1(
  adminId: string,
  customerId: string,
  opts: { ticketId?: string } = {},
): Promise<Customer360Tier1 | null> {
  const user = await db.user.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      onboardedAt: true,
      consentedAt: true,
      twoFactorEnabled: true,
    },
  });
  if (!user) return null;

  // Her admin bakışı loglanır (KVKK erişim kaydı).
  await logAudit({
    userId: adminId,
    action: "support.customer_view",
    entityType: "User",
    entityId: customerId,
    metadata: { tier: 1, ticketId: opts.ticketId ?? null },
  });

  const [tx, cats, accs, debts, findeks, imports, lastAudit, recentAudit, tickets] =
    await Promise.all([
      db.transaction.count({ where: { userId: customerId } }),
      db.category.count({ where: { userId: customerId } }),
      db.account.count({ where: { userId: customerId } }),
      db.debt.count({ where: { userId: customerId } }),
      db.findeksReport.count({ where: { userId: customerId } }),
      db.statementImport.count({ where: { userId: customerId } }),
      db.auditLog.findFirst({
        where: { userId: customerId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      db.auditLog.findMany({
        where: { userId: customerId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { action: true, createdAt: true }, // metadata/ip verilmez — maskeli
      }),
      db.supportTicket.findMany({
        where: { userId: customerId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, shortId: true, subject: true, status: true, createdAt: true },
      }),
    ]);

  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    onboardedAt: user.onboardedAt?.toISOString() ?? null,
    consentedAt: user.consentedAt?.toISOString() ?? null,
    counts: {
      transactions: tx,
      categories: cats,
      accounts: accs,
      debts,
      findeksReports: findeks,
      statementImports: imports,
    },
    lastActivityAt: lastAudit?.createdAt.toISOString() ?? null,
    recentAuditEvents: recentAudit.map((a) => ({
      action: a.action,
      createdAt: a.createdAt.toISOString(),
    })),
    tickets: tickets.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
  };
}

/* ============ Müşteri 360° — Tier 2 (consent ZORUNLU parametre) ============ */

export type Customer360Tier2 = {
  scopes: string[];
  expiresAt: string;
  dashboard: { balance: number; income: number; expense: number; net: number } | null;
  transactions:
    | { date: string; description: string; amount: number; kind: string; category: string | null }[]
    | null;
  debts: { name: string; kind: string; balance: number; apr: number }[] | null;
  findeks: { score: number; band: string; reportDate: string | null } | null;
};

export async function getCustomer360Tier2Panels(
  adminId: string,
  customerId: string,
  consent: ActiveConsent, // zorunlu — izinsiz çağrı derlenemez
): Promise<Customer360Tier2> {
  // Consent müşteriye ait mi? (yanlış müşteri id'siyle sızıntıyı engelle)
  if (consent.userId !== customerId) {
    return { scopes: [], expiresAt: consent.expiresAt, dashboard: null, transactions: null, debts: null, findeks: null };
  }

  await logAudit({
    userId: adminId,
    action: "support.customer_view",
    entityType: "User",
    entityId: customerId,
    metadata: { tier: 2, ticketId: consent.ticketId, scopes: consent.scopes },
  });

  const [dashboard, txPage, debts, findeksReport] = await Promise.all([
    hasScope(consent, "dashboard") ? getDashboard(customerId) : null,
    hasScope(consent, "transactions")
      ? getTransactions(customerId, {}, undefined)
      : null,
    hasScope(consent, "debts") ? getDebts(customerId) : null,
    hasScope(consent, "findeks") ? getLatestFindeksReport(customerId) : null,
  ]);

  return {
    scopes: consent.scopes,
    expiresAt: consent.expiresAt,
    dashboard: dashboard
      ? {
          balance: dashboard.balance,
          income: dashboard.income,
          expense: dashboard.expense,
          net: dashboard.net,
        }
      : null,
    transactions: txPage
      ? txPage.items.slice(0, 50).map((t) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          kind: t.kind,
          category: t.category?.name ?? null,
        }))
      : null,
    debts: debts
      ? debts.map((d) => ({
          name: d.name,
          kind: d.kind,
          balance: d.balance,
          apr: d.apr,
        }))
      : null,
    findeks: findeksReport
      ? {
          score: findeksReport.score,
          band: findeksReport.band,
          reportDate: findeksReport.reportDate ?? null,
        }
      : null,
  };
}

/* ===================== AI yanıt taslağı (admin) ===================== */

export async function draftAgentReplyForTicket(
  adminId: string,
  ticketId: string,
): Promise<{ ok: true; draft: string } | { ok: false; error: string }> {
  const rl = await rateLimit(`support:draft:${adminId}`, 30, 60 * 60 * 1000);
  if (!rl.ok) return { ok: false, error: "Taslak limiti doldu. Biraz bekle." };

  const t = await db.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true } },
      messages: { where: { internal: false }, orderBy: { createdAt: "asc" }, take: 30 },
      consents: {
        where: { status: "ACTIVE", expiresAt: { gt: new Date() } },
        take: 1,
      },
    },
  });
  if (!t) return { ok: false, error: "Talep bulunamadı." };

  // Tier1 özeti (maskeli) — sayımlar.
  const [txCount, debtCount] = await Promise.all([
    db.transaction.count({ where: { userId: t.user.id } }),
    db.debt.count({ where: { userId: t.user.id } }),
  ]);
  const tier1Summary = `Üye; ${txCount} işlem, ${debtCount} borç kaydı var.`;

  // Tier2 özeti yalnız aktif consent varsa (kapsamlara saygıyla).
  let tier2Summary: string | null = null;
  const c = t.consents[0];
  if (c) {
    const parts: string[] = [];
    if (c.scopes.includes("dashboard")) {
      const d = await getDashboard(t.user.id);
      parts.push(`bakiye ${d.balance}₺, bu ay net ${d.net}₺`);
    }
    if (c.scopes.includes("debts")) {
      const debts = await getDebts(t.user.id);
      parts.push(`${debts.length} borç (toplam ${debts.reduce((s, x) => s + x.balance, 0)}₺)`);
    }
    tier2Summary = parts.length ? parts.join("; ") : null;
  }

  await logAudit({
    userId: adminId,
    action: "support.admin_ai_draft",
    entityType: "SupportTicket",
    entityId: ticketId,
    metadata: { withTier2: Boolean(tier2Summary) },
  });

  try {
    const draft = await runDraftSuggestion({
      ticketSubject: t.subject,
      ticketCategory: t.category,
      customerName: t.user.name,
      thread: t.messages.map((m) => ({ author: m.author, body: m.body })),
      tier1Summary,
      tier2Summary,
    });
    return { ok: true, draft };
  } catch {
    return { ok: false, error: "Taslak üretilemedi." };
  }
}
