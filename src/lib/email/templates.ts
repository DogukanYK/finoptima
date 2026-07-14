// Destek e-posta şablonları — Türkçe, inline-CSS (e-posta istemcileri <style> yemez).
//
// ⚠️ KVKK KURALI: Bu şablonların HİÇBİRİNDE finansal veri (tutar, bakiye, işlem,
// skor, borç) YER ALMAZ. Yalnızca talep meta'sı (numara, konu, kategori) ve link.
// Finansal detay yalnızca uygulama içinde, süreli izinle görülür.

import { appUrl } from "@/lib/email/resend";

const INK = "#0F172A"; // koyu lacivert
const BRAND = "#2563EB"; // marka mavisi
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const FONTS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export type EmailContent = { subject: string; html: string };

/** HTML enjeksiyonuna karşı: kullanıcı/admin kaynaklı her metin bundan geçer. */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const CATEGORY_LABELS: Record<string, string> = {
  ACCOUNT: "Hesap",
  TRANSACTIONS: "İşlemler",
  IMPORT: "Banka Dökümü",
  FINDEKS: "Findeks",
  DEBTS: "Borçlar",
  SECURITY: "Güvenlik",
  BUG: "Hata",
  OTHER: "Diğer",
};

function button(href: string, label: string): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">${esc(label)}</a>`;
}

/** Ortak kabuk: başlık şeridi + gövde + alt bilgi. */
function layout(opts: {
  heading: string;
  intro: string;
  meta?: Array<[string, string]>;
  extraHtml?: string;
  cta: { href: string; label: string };
}): string {
  const metaRows = (opts.meta ?? [])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 0;color:${MUTED};font-size:14px;width:110px;">${esc(k)}</td><td style="padding:4px 0;color:${INK};font-size:14px;font-weight:600;">${esc(v)}</td></tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${LINE};font-family:${FONTS};">
        <tr><td style="background:${INK};padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">FinOptima</span>
          <span style="color:#94A3B8;font-size:14px;"> · Destek</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;color:${INK};font-size:20px;font-weight:700;line-height:1.35;">${esc(opts.heading)}</h1>
          <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">${esc(opts.intro)}</p>
          ${metaRows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${metaRows}</table>` : ""}
          ${opts.extraHtml ?? ""}
          <div style="margin:24px 0 4px;">${button(opts.cta.href, opts.cta.label)}</div>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid ${LINE};">
          <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">
            Bu e-posta yalnızca talebinle ilgili bilgilendirmedir; finansal verilerin burada paylaşılmaz.
            Güvenliğin için tüm detaylar yalnızca uygulama içinde görüntülenir.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function ticketLink(ticketId: string): string {
  return `${appUrl()}/destek/${ticketId}`;
}

function adminTicketLink(ticketId: string): string {
  return `${appUrl()}/admin/talepler/${ticketId}`;
}

/* ===================== Şablonlar ===================== */

export function ticketCreatedUser(input: {
  shortId: number;
  subject: string;
  ticketId: string;
}): EmailContent {
  return {
    subject: `[#${input.shortId}] Talebin bize ulaştı`,
    html: layout({
      heading: "Talebin bize ulaştı",
      intro:
        "Destek talebini aldık. Ekibimiz en kısa sürede inceleyip yanıtlayacak. Yanıt geldiğinde e-posta ile haber vereceğiz.",
      meta: [
        ["Talep no", `#${input.shortId}`],
        ["Konu", input.subject],
      ],
      cta: { href: ticketLink(input.ticketId), label: "Talebi görüntüle" },
    }),
  };
}

export function ticketCreatedAdmin(input: {
  shortId: number;
  subject: string;
  ticketId: string;
  customerName: string;
  category: string;
}): EmailContent {
  return {
    subject: `[#${input.shortId}] Yeni destek talebi — ${input.subject}`,
    html: layout({
      heading: "Yeni destek talebi",
      intro: "Kuyruğa yeni bir müşteri talebi düştü.",
      meta: [
        ["Talep no", `#${input.shortId}`],
        ["Müşteri", input.customerName],
        ["Kategori", CATEGORY_LABELS[input.category] ?? input.category],
        ["Konu", input.subject],
      ],
      cta: { href: adminTicketLink(input.ticketId), label: "Talebi aç" },
    }),
  };
}

export function agentReplied(input: {
  shortId: number;
  subject: string;
  ticketId: string;
  replyPreview: string;
}): EmailContent {
  const preview = input.replyPreview.trim().slice(0, 200);
  const truncated = input.replyPreview.trim().length > 200;
  const quote = preview
    ? `<div style="margin:0 0 4px;padding:14px 16px;background:#F8FAFC;border-left:3px solid ${BRAND};border-radius:6px;color:#334155;font-size:14px;line-height:1.6;white-space:pre-wrap;">${esc(preview)}${truncated ? "…" : ""}</div>`
    : "";

  return {
    subject: `[#${input.shortId}] Destek ekibi yanıtladı`,
    html: layout({
      heading: "Destek ekibi talebini yanıtladı",
      intro: "Talebine yeni bir yanıt geldi. Yanıtın tamamını uygulamadan okuyabilirsin.",
      meta: [
        ["Talep no", `#${input.shortId}`],
        ["Konu", input.subject],
      ],
      extraHtml: quote,
      cta: { href: ticketLink(input.ticketId), label: "Yanıtı oku" },
    }),
  };
}

export function ticketResolved(input: {
  shortId: number;
  subject: string;
  ticketId: string;
}): EmailContent {
  return {
    subject: `[#${input.shortId}] Talebin çözüldü olarak işaretlendi`,
    html: layout({
      heading: "Talebin çözüldü olarak işaretlendi",
      intro:
        "Destek ekibi bu talebi çözüldü olarak işaretledi. Sorunun devam ediyorsa talebe yanıt yazman yeterli — talep otomatik olarak yeniden açılır.",
      meta: [
        ["Talep no", `#${input.shortId}`],
        ["Konu", input.subject],
      ],
      cta: { href: ticketLink(input.ticketId), label: "Talebi görüntüle" },
    }),
  };
}

export function consentRequested(input: {
  shortId: number;
  subject: string;
  ticketId: string;
}): EmailContent {
  return {
    subject: `[#${input.shortId}] Destek ekibi veri erişim izni istedi`,
    html: layout({
      heading: "Destek ekibi veri erişim izni istedi",
      intro:
        "Talebini çözebilmek için destek ekibi finansal verilerine süreli erişim izni istedi. İzni uygulamadaki talep sayfasından, süre ve kapsam seçerek verebilir; dilediğin an geri alabilirsin. İzin vermeden de talebin işleme devam eder.",
      meta: [
        ["Talep no", `#${input.shortId}`],
        ["Konu", input.subject],
      ],
      cta: { href: ticketLink(input.ticketId), label: "İzni incele" },
    }),
  };
}
