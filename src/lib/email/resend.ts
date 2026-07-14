// Outbound e-posta (Resend). KURAL: e-posta gönderimi ASLA kullanıcı işlemini
// bloklamaz — her hata yutulur, sonuç boolean döner. Anahtar yoksa sessiz NO-OP.
// KVKK: e-posta gövdesine ASLA finansal/Tier2 veri konmaz (bkz. templates.ts).

import { Resend } from "resend";
import { db } from "@/lib/db";

const FROM = process.env.SUPPORT_EMAIL_FROM ?? "FinOptima Destek <destek@finoptima.dev>";

/** Uygulama kök URL'i — şablonlardaki linkler için (sondaki / temizlenir). */
export function appUrl(): string {
  const raw = process.env.APP_URL ?? "https://www.finoptima.dev";
  return raw.replace(/\/+$/, "");
}

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

/**
 * Tek e-posta gönderir. Başarılıysa true, aksi halde false.
 * Anahtar yoksa → console.warn + false (NO-OP). ASLA throw etmez.
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendEmailInput): Promise<boolean> {
  try {
    const resend = getClient();
    if (!resend) {
      console.warn("[email] RESEND_API_KEY yok — e-posta gönderilmedi:", subject);
      return false;
    }

    const recipients = (Array.isArray(to) ? to : [to])
      .map((e) => e.trim())
      .filter(Boolean);
    if (recipients.length === 0) return false;

    const { error } = await resend.emails.send({
      from: FROM,
      to: recipients,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error("[email] Resend hatası:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Gönderim başarısız:", err);
    return false;
  }
}

/**
 * Tüm ADMIN kullanıcılara bildirim yollar. Admin yoksa / hata olursa sessizce geçer.
 * ASLA throw etmez.
 */
export async function notifyAdmins(subject: string, html: string): Promise<boolean> {
  try {
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    });
    const emails = admins.map((a) => a.email).filter((e): e is string => Boolean(e));
    if (emails.length === 0) return false;
    return await sendEmail({ to: emails, subject, html });
  } catch (err) {
    console.error("[email] notifyAdmins başarısız:", err);
    return false;
  }
}
