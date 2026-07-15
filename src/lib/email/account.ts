// Hesap & güvenlik (işlemsel) e-posta gönderim yardımcısı.
//
// MUTLAK KURAL: E-posta gönderimi HİÇBİR kimlik/güvenlik akışını bloklamaz.
// Buradaki fonksiyonlar ASLA throw etmez — hata yutulur (console.error) ve
// çağıran akış (giriş, kayıt, 2FA, silme…) kesintisiz devam eder.
//
// Başarılı her gönderim AuditLog'a "account.email_sent" + metadata.kind olarak
// yazılır; sendAccountEmailOnce bu kaydı okuyup aynı türden e-posta bombardımanını
// engeller (özellikle failedLoginBurst için şart).

import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/resend";
import type { EmailContent } from "@/lib/email/templates";

/** Audit'te bu e-postaları temsil eden aksiyon adı. */
export const ACCOUNT_EMAIL_ACTION = "account.email_sent";

export type SendAccountEmailInput = {
  userId?: string;
  to: string;
  /** Alıcının adı — şablonda zaten kullanılır; burada yalnız log/okunabilirlik için. */
  name: string;
  content: EmailContent;
  /** "welcome" | "new_device_login" | "2fa_enabled" | … — dedupe anahtarı. */
  kind: string;
};

/**
 * İşlemsel hesap e-postası gönderir. Başarılıysa denetim kaydı düşer.
 * Hata olursa sessizce geçer — ASLA throw etmez, ASLA çağıran akışı bozmaz.
 */
export async function sendAccountEmail(input: SendAccountEmailInput): Promise<void> {
  try {
    const to = (input.to ?? "").trim();
    if (!to) return;

    const ok = await sendEmail({
      to,
      subject: input.content.subject,
      html: input.content.html,
    });
    if (!ok) return; // NO-OP (anahtar yok) veya sağlayıcı hatası — sendEmail zaten logladı.

    await logAudit({
      userId: input.userId ?? null,
      action: ACCOUNT_EMAIL_ACTION,
      metadata: { kind: input.kind },
    });
  } catch (err) {
    console.error("[account-email] gönderim başarısız:", input.kind, err);
  }
}

/**
 * Aynı `kind` için son `dedupeMinutes` dakikada bir e-posta gönderilmişse
 * tekrar göndermez (e-posta bombardımanı koruması).
 *
 * Dedupe yalnızca `userId` verildiğinde uygulanabilir; kullanıcı bilinmiyorsa
 * (audit kaydı kullanıcıya bağlanamaz) doğrudan gönderilir.
 * Hata durumunda dedupe atlanır ve e-posta yine de gönderilir — güvenlik
 * bildirimini kaybetmektense mükerrer göndermek yeğdir. ASLA throw etmez.
 */
export async function sendAccountEmailOnce(
  input: SendAccountEmailInput & { dedupeMinutes: number },
): Promise<void> {
  try {
    if (await recentlySent(input.userId, input.kind, input.dedupeMinutes)) return;
  } catch (err) {
    console.error("[account-email] dedupe kontrolü başarısız:", input.kind, err);
  }
  await sendAccountEmail(input);
}

/** Son N dakikada aynı kind için "account.email_sent" kaydı var mı? */
async function recentlySent(
  userId: string | undefined,
  kind: string,
  dedupeMinutes: number,
): Promise<boolean> {
  if (!userId || !(dedupeMinutes > 0)) return false;

  const since = new Date(Date.now() - dedupeMinutes * 60_000);
  const rows = await db.auditLog.findMany({
    where: { userId, action: ACCOUNT_EMAIL_ACTION, createdAt: { gte: since } },
    select: { metadata: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows.some((r) => {
    const meta = r.metadata as { kind?: unknown } | null;
    return typeof meta?.kind === "string" && meta.kind === kind;
  });
}
