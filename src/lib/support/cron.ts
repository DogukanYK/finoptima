// Günlük destek hijyeni cron çekirdeği — üç saf, izole fonksiyon.
// Her biri kendi try/catch'inde: hata durumunda 0 döner, ASLA throw etmez —
// böylece biri patlasa da route diğerlerini çağırabilir. Tarihler UTC.
// Vercel cron /api/cron/support-daily üzerinden günde bir kez çağırır.

import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { notifyAdmins } from "@/lib/email/resend";
import { unansweredDigest as unansweredDigestEmail } from "@/lib/email/templates";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const AUTO_CLOSE_BODY =
  "Bu talep 7 gün yanıt gelmediği için otomatik kapatıldı. " +
  "Yeni bir sorunda tekrar yazabilirsin.";

/**
 * ACTIVE + süresi geçmiş (expiresAt < now) izinleri EXPIRED yapar.
 * Not: okuma-anı kontrolü güvenliği zaten sağlıyor; bu yalnız HİJYEN + iz.
 * Etkilenen kayıt sayısını döner (hata → 0).
 */
export async function expireConsents(): Promise<number> {
  try {
    const now = new Date();
    const { count } = await db.supportConsent.updateMany({
      where: { status: "ACTIVE", expiresAt: { lt: now } },
      data: { status: "EXPIRED" },
    });
    if (count > 0) {
      await logAudit({ action: "support.consent_expire", metadata: { count } });
    }
    return count;
  } catch (err) {
    console.error("[cron:support] expireConsents başarısız:", err);
    return 0;
  }
}

/**
 * RESOLVED + 7 günden uzun süredir yanıtsız (resolvedAt < now-7g) talepleri
 * CLOSED yapar (closedAt=now). Her biri için SYSTEM mesajı + lastMessage* günceller.
 * Talep sahibine e-posta GÖNDERİLMEZ (gürültü olmasın). Kapatılan sayıyı döner (hata → 0).
 */
export async function autoCloseResolved(): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - 7 * DAY_MS);
    const tickets = await db.supportTicket.findMany({
      where: { status: "RESOLVED", resolvedAt: { lt: cutoff } },
      select: { id: true },
    });

    let count = 0;
    for (const t of tickets) {
      try {
        const now = new Date();
        await db.$transaction([
          db.supportTicket.update({
            where: { id: t.id },
            data: {
              status: "CLOSED",
              closedAt: now,
              lastMessageAt: now,
              lastMessageAuthor: "SYSTEM",
            },
          }),
          db.supportMessage.create({
            data: { ticketId: t.id, author: "SYSTEM", body: AUTO_CLOSE_BODY },
          }),
        ]);
        count++;
      } catch (err) {
        console.error("[cron:support] autoClose ticket başarısız:", t.id, err);
      }
    }

    if (count > 0) {
      await logAudit({ action: "support.auto_close", metadata: { count } });
    }
    return count;
  } catch (err) {
    console.error("[cron:support] autoCloseResolved başarısız:", err);
    return 0;
  }
}

/**
 * Son mesajı müşteriden gelen, açık (OPEN/IN_PROGRESS/WAITING_USER) ve 24 saatten
 * uzun süredir yanıtsız talepleri (ilk 50) bulur; varsa admin'lere özet e-posta yollar.
 * Talep yoksa hiçbir şey yapmaz. Özetteki talep sayısını döner (hata → 0).
 */
export async function unansweredDigest(): Promise<number> {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * HOUR_MS);
    const tickets = await db.supportTicket.findMany({
      where: {
        lastMessageAuthor: "USER",
        status: { in: ["OPEN", "IN_PROGRESS", "WAITING_USER"] },
        lastMessageAt: { lt: cutoff },
      },
      select: { shortId: true, subject: true, lastMessageAt: true },
      orderBy: { lastMessageAt: "asc" }, // en uzun bekleyen en üstte
      take: 50,
    });

    const count = tickets.length;
    if (count === 0) return 0;

    const rows = tickets.map((t) => ({
      shortId: t.shortId,
      subject: t.subject,
      hoursWaiting: Math.floor((now.getTime() - t.lastMessageAt.getTime()) / HOUR_MS),
    }));

    const { subject, html } = unansweredDigestEmail({ tickets: rows });
    await notifyAdmins(subject, html);
    await logAudit({ action: "support.unanswered_digest", metadata: { count } });
    return count;
  } catch (err) {
    console.error("[cron:support] unansweredDigest başarısız:", err);
    return 0;
  }
}
