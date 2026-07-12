"use server";

// Admin destek action'ları. GÜVENLİK: layout'taki requireAdmin server action'ları
// KORUMAZ (action'lar doğrudan çağrılabilir POST'lardır) — bu yüzden HER action
// kendi içinde requireAdminId() ile rol kontrolü yapar.

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminId } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { draftAgentReplyForTicket } from "@/lib/support/admin-queries";

export type AdminSupportResult = { ok: true } | { ok: false; error: string };

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
    select: { id: true, firstAgentReplyAt: true, status: true },
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

  // Faz 2: burada e-posta bildirimi tetiklenecek (try/catch ile, yanıtı bloklamadan).

  revalidateAdmin(ticketId);
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

  const now = new Date();
  const updated = await db.supportTicket.updateMany({
    where: { id: ticketId },
    data: {
      status: status as never,
      resolvedAt: status === "RESOLVED" ? now : undefined,
      closedAt: status === "CLOSED" ? now : undefined,
    },
  });
  if (updated.count === 0) return { ok: false, error: "Talep bulunamadı." };

  await logAudit({
    userId: adminId,
    action: "support.admin_status",
    entityType: "SupportTicket",
    entityId: ticketId,
    metadata: { status },
  });

  revalidateAdmin(ticketId);
  return { ok: true };
}

// AI yanıt taslağı — asla otomatik göndermez; taslağı textarea'ya doldurur.
export async function adminSuggestDraft(
  ticketId: string,
): Promise<{ ok: true; draft: string } | { ok: false; error: string }> {
  const adminId = await requireAdminId();
  return draftAgentReplyForTicket(adminId, ticketId);
}
