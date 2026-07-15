// Gelen e-posta → talebe düşürme çekirdeği (Resend inbound webhook'undan çağrılır).
// GÜVENLİK: gönderen, talebin sahibi DEĞİLSE mesaj enjekte edilemez. KVKK: adminlere
// giden bilgilendirmede finansal veri ASLA yer almaz. Bu modül throw etmemeli —
// webhook her zaman 200 dönebilsin diye sonuç {ok,reason} olarak taşınır.

import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notifyAdmins, appUrl } from "@/lib/email/resend";

/** "[#108]" veya "Re: [#108] ..." konusundan 108'i çeker. Yoksa null. */
export function parseShortId(subject: string): number | null {
  if (!subject) return null;
  const m = subject.match(/\[#(\d+)\]/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/**
 * E-posta cevabından alıntılanmış geçmişi kırpar; yalnız kullanıcının YENİ yazdığı
 * kalır. "On ... wrote:", "-----Original Message-----", "________" ayraçları ve
 * "> " ile başlayan satırlar ve sonrası atılır. Sonuç boşsa "" döner.
 */
export function stripQuotedReply(text: string): string {
  if (!text) return "";
  let s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Çok satırlı olabilen ayraçlar — en erken eşleşmeden itibaren her şeyi at.
  const cutPatterns: RegExp[] = [
    /^On\b[\s\S]*?\bwrote:[ \t]*$/m, // Gmail / Apple Mail: "On <tarih>, <ad> wrote:"
    /^[^\n]*\btarihinde\b[\s\S]*?\byazdı:[ \t]*$/m, // TR: "... tarihinde ... yazdı:"
    /^[ \t]*-{2,}[ \t]*Original Message[ \t]*-{2,}/im, // Outlook
    /^[ \t]*-{2,}[ \t]*Forwarded message[ \t]*-{2,}/im, // iletildi
    /^_{5,}[ \t]*$/m, // Outlook / Apple uzun alt çizgi ayracı
  ];
  let cut = s.length;
  for (const re of cutPatterns) {
    const m = re.exec(s);
    if (m && m.index < cut) cut = m.index;
  }
  s = s.slice(0, cut);

  // Alıntı satırları ("> ...") — ilk alıntı satırından itibaren kes.
  const kept: string[] = [];
  for (const line of s.split("\n")) {
    if (/^\s*>/.test(line)) break;
    kept.push(line);
  }
  return kept.join("\n").trim();
}

export type InboundResult = { ok: boolean; reason?: string };

/**
 * Gelen bir e-postayı doğru talebe USER mesajı olarak düşürür.
 * Adım adım güvenlik/idempotency kontrolleri; başarısızlıkta {ok:false, reason}.
 */
export async function ingestInboundEmail(input: {
  fromEmail: string;
  subject: string;
  text: string;
  messageId?: string | null;
}): Promise<InboundResult> {
  const shortId = parseShortId(input.subject ?? "");
  if (shortId == null) return { ok: false, reason: "no_ticket_ref" };

  const ticket = await db.supportTicket.findUnique({
    where: { shortId },
    select: {
      id: true,
      userId: true,
      status: true,
      channel: true,
      user: { select: { email: true } },
    },
  });
  if (!ticket) return { ok: false, reason: "ticket_not_found" };

  // GÜVENLİK: gönderen adresi, talebin sahibinin adresiyle birebir eşleşmeli.
  // Aksi halde BAŞKASI müşteri adına mesaj enjekte edebilir.
  const from = (input.fromEmail ?? "").trim().toLowerCase();
  const owner = (ticket.user?.email ?? "").trim().toLowerCase();
  if (!from || !owner || from !== owner) {
    await logAudit({
      action: "support.email_inbound_rejected",
      entityType: "SupportTicket",
      entityId: ticket.id,
      metadata: { shortId, reason: "sender_mismatch" },
    });
    return { ok: false, reason: "sender_mismatch" };
  }

  const body = stripQuotedReply(input.text ?? "");
  if (!body) return { ok: false, reason: "empty" };

  // Idempotency: aynı Message-ID ikinci kez gelirse (webhook retry) yok say.
  const messageId = input.messageId?.trim() || null;
  if (messageId) {
    const dup = await db.supportMessage.findFirst({
      where: { emailMessageId: messageId },
      select: { id: true },
    });
    if (dup) return { ok: false, reason: "duplicate" };
  }

  const now = new Date();
  await db.$transaction([
    db.supportMessage.create({
      data: {
        ticketId: ticket.id,
        author: "USER",
        authorUserId: ticket.userId,
        body: body.slice(0, 5000),
        emailMessageId: messageId,
      },
    }),
    db.supportTicket.update({
      where: { id: ticket.id },
      data: {
        lastMessageAt: now,
        lastMessageAuthor: "USER",
        // channel korunur (dokunma). Çözülmüş sanılan talep yeniden açılır.
        status: ticket.status === "RESOLVED" ? "OPEN" : undefined,
      },
    }),
  ]);

  await logAudit({
    userId: ticket.userId,
    action: "support.email_inbound",
    entityType: "SupportTicket",
    entityId: ticket.id,
    metadata: { shortId },
  });

  // Adminlere bilgi ver (inline HTML — yeni şablon gerekmez). FİNANSAL VERİ YOK.
  const link = `${appUrl()}/admin/talepler/${ticket.id}`;
  await notifyAdmins(
    `#${shortId} talebine e-posta yanıtı geldi`,
    `<p>#${shortId} numaralı talebe müşteri e-posta ile yanıt verdi.</p>` +
      `<p><a href="${link}">Talebi aç</a></p>`,
  );

  return { ok: true };
}
