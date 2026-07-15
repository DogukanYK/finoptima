"use server";

// Admin destek action'ları. GÜVENLİK: layout'taki requireAdmin server action'ları
// KORUMAZ (action'lar doğrudan çağrılabilir POST'lardır) — bu yüzden HER action
// kendi içinde requireAdminId() ile rol kontrolü yapar.

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminId } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { draftAgentReplyForTicket } from "@/lib/support/admin-queries";
import { sendEmail } from "@/lib/email/resend";
import {
  agentReplied,
  ticketResolved,
  consentRequested,
  type EmailContent,
} from "@/lib/email/templates";

export type AdminSupportResult = { ok: true } | { ok: false; error: string };

// E-posta gönderimi admin işlemini ASLA bloklamaz/bozmaz.
async function emailOwner(
  email: string | null | undefined,
  content: EmailContent,
  audit: { userId: string; ticketId: string; kind: string },
): Promise<void> {
  try {
    if (!email) return;
    await sendEmail({
      to: email,
      subject: content.subject,
      html: content.html,
      // Müşterinin cevabı doğru talebe geri dönsün (tanımlıysa); yoksa From adresine.
      replyTo: process.env.SUPPORT_INBOUND_ADDRESS ?? undefined,
    });
    await logAudit({
      userId: audit.userId,
      action: "support.email_sent",
      entityType: "SupportTicket",
      entityId: audit.ticketId,
      metadata: { kind: audit.kind },
    });
  } catch (err) {
    console.error("[support] admin e-postası gönderilemedi:", err);
  }
}

const VALID_STATUS = new Set([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_USER",
  "RESOLVED",
  "CLOSED",
]);

function revalidateAdmin(ticketId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/talepler");
  if (ticketId) revalidatePath(`/admin/talepler/${ticketId}`);
}

// Müşteriye yanıt gönder (AGENT mesajı). İlk yanıtsa SLA damgası atılır;
// durum WAITING_USER'a çekilir.
export async function adminReplyTicket(
  ticketId: string,
  body: string,
): Promise<AdminSupportResult> {
  const adminId = await requireAdminId();
  const text = body.trim().slice(0, 8000);
  if (text.length < 1) return { ok: false, error: "Boş yanıt gönderilemez." };

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      shortId: true,
      subject: true,
      firstAgentReplyAt: true,
      status: true,
      user: { select: { email: true, name: true } },
    },
  });
  if (!ticket) return { ok: false, error: "Talep bulunamadı." };

  await db.$transaction([
    db.supportMessage.create({
      data: { ticketId, author: "AGENT", authorUserId: adminId, body: text },
    }),
    db.supportTicket.update({
      where: { id: ticketId },
      data: {
        lastMessageAt: new Date(),
        lastMessageAuthor: "AGENT",
        firstAgentReplyAt: ticket.firstAgentReplyAt ?? new Date(),
        status: ticket.status === "CLOSED" ? undefined : "WAITING_USER",
        assignedToId: adminId,
      },
    }),
  ]);

  await logAudit({
    userId: adminId,
    action: "support.admin_reply",
    entityType: "SupportTicket",
    entityId: ticketId,
  });

  // Talep sahibine "yanıt geldi" e-postası (yalnız ilk 200 karakter önizleme).
  await emailOwner(
    ticket.user?.email,
    agentReplied({
      shortId: ticket.shortId,
      subject: ticket.subject,
      ticketId,
      replyPreview: text,
    }),
    { userId: adminId, ticketId, kind: "agent_replied" },
  );

  revalidateAdmin(ticketId);
  revalidatePath(`/destek/${ticketId}`);
  return { ok: true };
}

// İç not — müşteri ASLA görmez (internal: true; kullanıcı sorguları filtreler).
export async function adminAddInternalNote(
  ticketId: string,
  body: string,
): Promise<AdminSupportResult> {
  const adminId = await requireAdminId();
  const text = body.trim().slice(0, 8000);
  if (text.length < 1) return { ok: false, error: "Boş not eklenemez." };

  const exists = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!exists) return { ok: false, error: "Talep bulunamadı." };

  await db.supportMessage.create({
    data: {
      ticketId,
      author: "AGENT",
      authorUserId: adminId,
      body: text,
      internal: true,
    },
  });

  await logAudit({
    userId: adminId,
    action: "support.admin_note",
    entityType: "SupportTicket",
    entityId: ticketId,
  });

  revalidateAdmin(ticketId);
  return { ok: true };
}

export async function adminSetStatus(
  ticketId: string,
  status: string,
): Promise<AdminSupportResult> {
  const adminId = await requireAdminId();
  if (!VALID_STATUS.has(status)) return { ok: false, error: "Geçersiz durum." };

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      shortId: true,
      subject: true,
      user: { select: { email: true } },
    },
  });
  if (!ticket) return { ok: false, error: "Talep bulunamadı." };

  const now = new Date();
  await db.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: status as never,
      resolvedAt: status === "RESOLVED" ? now : undefined,
      closedAt: status === "CLOSED" ? now : undefined,
    },
  });

  await logAudit({
    userId: adminId,
    action: "support.admin_status",
    entityType: "SupportTicket",
    entityId: ticketId,
    metadata: { status },
  });

  if (status === "RESOLVED") {
    await emailOwner(
      ticket.user?.email,
      ticketResolved({
        shortId: ticket.shortId,
        subject: ticket.subject,
        ticketId,
      }),
      { userId: adminId, ticketId, kind: "ticket_resolved" },
    );
  }

  revalidateAdmin(ticketId);
  revalidatePath(`/destek/${ticketId}`);
  return { ok: true };
}

// Müşteriden finansal veriye süreli erişim izni ister. İZNİ KENDİSİ VERMEZ —
// yalnız talebe bir SYSTEM mesajı düşer; izni her zaman kullanıcı verir/geri alır.
export async function adminRequestConsent(
  ticketId: string,
): Promise<AdminSupportResult> {
  const adminId = await requireAdminId();

  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      shortId: true,
      subject: true,
      status: true,
      user: { select: { email: true } },
    },
  });
  if (!ticket) return { ok: false, error: "Talep bulunamadı." };
  if (ticket.status === "CLOSED")
    return { ok: false, error: "Kapalı talepte izin istenemez." };

  const now = new Date();
  await db.$transaction([
    db.supportMessage.create({
      data: {
        ticketId,
        author: "SYSTEM",
        body:
          "Destek ekibi, talebini çözebilmek için finansal verilerine süreli erişim izni istedi. " +
          "Aşağıdaki karttan süre ve kapsam seçerek izin verebilir, dilediğin an geri alabilirsin.",
      },
    }),
    db.supportTicket.update({
      where: { id: ticketId },
      data: { lastMessageAt: now, lastMessageAuthor: "SYSTEM" },
    }),
  ]);

  await logAudit({
    userId: adminId,
    action: "support.admin_request_consent",
    entityType: "SupportTicket",
    entityId: ticketId,
  });

  await emailOwner(
    ticket.user?.email,
    consentRequested({
      shortId: ticket.shortId,
      subject: ticket.subject,
      ticketId,
    }),
    { userId: adminId, ticketId, kind: "consent_requested" },
  );

  revalidateAdmin(ticketId);
  revalidatePath(`/destek/${ticketId}`);
  return { ok: true };
}

// AI yanıt taslağı — asla otomatik göndermez; taslağı textarea'ya doldurur.
export async function adminSuggestDraft(
  ticketId: string,
): Promise<{ ok: true; draft: string } | { ok: false; error: string }> {
  const adminId = await requireAdminId();
  return draftAgentReplyForTicket(adminId, ticketId);
}
