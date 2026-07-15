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

/* ===================================================================== */
/* ============ HESAP & GÜVENLİK (işlemsel) e-posta şablonları ========= */
/* ===================================================================== */
//
// Bunlar İŞLEMSEL e-postalardır (6563 sayılı kanun: ticari ileti DEĞİL) —
// hesap/güvenlik bildirimi oldukları için onay gerektirmez ve kapatılamaz.
// ⚠️ Aynı KVKK kuralı burada da geçerli: HİÇBİRİNDE finansal veri
// (tutar, bakiye, işlem, skor, borç) yer almaz.

const AMBER = "#B45309"; // dikkat
const AMBER_BG = "#FFFBEB";
const AMBER_LINE = "#FDE68A";
const DANGER = "#DC2626"; // kritik
const DANGER_BG = "#FEF2F2";
const DANGER_LINE = "#FECACA";
const BRAND_BG = "#EFF6FF";

/** Üst şerit tonu: bilgilendirme (mavi) · dikkat (amber) · kritik (kırmızı). */
type Tone = "info" | "warn" | "critical";

const TONES: Record<Tone, { stripe: string; bg: string; line: string; ink: string }> = {
  info: { stripe: BRAND, bg: BRAND_BG, line: "#BFDBFE", ink: BRAND },
  warn: { stripe: "#F59E0B", bg: AMBER_BG, line: AMBER_LINE, ink: AMBER },
  critical: { stripe: DANGER, bg: DANGER_BG, line: DANGER_LINE, ink: DANGER },
};

/** Tam yuvarlak marka butonu (hesap/güvenlik e-postaları). */
function pillButton(href: string, label: string): string {
  return `<a href="${esc(href)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:999px;">${esc(label)}</a>`;
}

function greet(name: string): string {
  const n = (name ?? "").trim();
  return n ? `Merhaba ${n},` : "Merhaba,";
}

/** Hesap/güvenlik e-postaları için ortak kabuk. CTA opsiyoneldir. */
function accountLayout(opts: {
  tone: Tone;
  heading: string;
  greeting: string;
  intro: string;
  meta?: Array<[string, string]>;
  bullets?: string[];
  callout?: string;
  extraHtml?: string;
  cta?: { href: string; label: string };
}): string {
  const t = TONES[opts.tone];

  const metaRows = (opts.meta ?? [])
    .map(
      ([k, v]) =>
        `<tr><td style="padding:5px 0;color:${MUTED};font-size:14px;width:120px;">${esc(k)}</td><td style="padding:5px 0;color:${INK};font-size:14px;font-weight:600;">${esc(v)}</td></tr>`,
    )
    .join("");

  const bulletRows = (opts.bullets ?? [])
    .map(
      (b) =>
        `<tr><td style="padding:6px 10px 6px 0;color:${BRAND};font-size:15px;font-weight:700;vertical-align:top;">•</td><td style="padding:6px 0;color:#334155;font-size:15px;line-height:1.55;">${esc(b)}</td></tr>`,
    )
    .join("");

  const callout = opts.callout
    ? `<div style="margin:20px 0 0;padding:14px 16px;background:${t.bg};border:1px solid ${t.line};border-radius:8px;color:${t.ink};font-size:14px;line-height:1.6;font-weight:500;">${esc(opts.callout)}</div>`
    : "";

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1F5F9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${LINE};font-family:${FONTS};">
        <tr><td style="background:${t.stripe};height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
        <tr><td style="background:${INK};padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">FinOptima</span>
          <span style="color:#94A3B8;font-size:14px;"> · Hesap &amp; Güvenlik</span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 14px;color:${INK};font-size:20px;font-weight:700;line-height:1.35;">${esc(opts.heading)}</h1>
          <p style="margin:0 0 12px;color:#334155;font-size:15px;line-height:1.6;">${esc(opts.greeting)}</p>
          <p style="margin:0 0 20px;color:#334155;font-size:15px;line-height:1.6;">${esc(opts.intro)}</p>
          ${metaRows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">${metaRows}</table>` : ""}
          ${bulletRows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">${bulletRows}</table>` : ""}
          ${opts.extraHtml ?? ""}
          ${callout}
          ${opts.cta ? `<div style="margin:24px 0 4px;">${pillButton(opts.cta.href, opts.cta.label)}</div>` : ""}
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid ${LINE};">
          <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6;">
            Bu bir işlemsel hesap &amp; güvenlik bildirimidir — pazarlama e-postası değildir,
            bu yüzden aboneliği kapatılamaz. Güvenliğin için finansal verilerin bu e-postada paylaşılmaz;
            tüm detaylar yalnızca uygulama içinde görüntülenir.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const securityLink = (): string => `${appUrl()}/settings?tab=security`;
const supportLink = (): string => `${appUrl()}/destek`;

/** Kayıt sonrası karşılama. */
export function welcome(input: { name: string }): EmailContent {
  return {
    subject: "FinOptima'ya hoş geldin",
    html: accountLayout({
      tone: "info",
      heading: "FinOptima'ya hoş geldin",
      greeting: greet(input.name),
      intro:
        "Hesabın hazır. FinOptima, finansal durumunu tek panelde toplayıp ne yapman gerektiğini net biçimde söylemek için var. Başlamak için üç adım:",
      bullets: [
        "Banka ekstreni yükle — yapay zekâ işlemlerini okuyup senin yerine kategorilere ayırsın.",
        "Findeks kredi notunu ekle ve zaman içindeki değişimini takip et.",
        "Kredi koçundan bu ay tam olarak ne yapman gerektiğini öğren.",
      ],
      cta: { href: `${appUrl()}/dashboard`, label: "Panele git" },
    }),
  };
}

/** Yeni/tanınmayan cihazdan giriş — dikkat (amber). */
export function newDeviceLogin(input: {
  name: string;
  deviceLabel: string;
  ip: string;
  whenText: string;
  platform: "web" | "iOS";
}): EmailContent {
  return {
    subject: "Yeni bir cihazdan giriş yapıldı",
    html: accountLayout({
      tone: "warn",
      heading: "Yeni bir cihazdan giriş yapıldı",
      greeting: greet(input.name),
      intro:
        "Hesabına daha önce görmediğimiz bir cihazdan giriş yapıldı. Bu sendin ise yapman gereken bir şey yok.",
      meta: [
        ["Cihaz", input.deviceLabel],
        ["Platform", input.platform === "iOS" ? "iOS uygulaması" : "Web"],
        ["IP adresi", input.ip],
        ["Tarih", input.whenText],
      ],
      callout:
        "Bu sen değilsen: şifreni hemen değiştir ve tüm oturumları kapat. Güvenlik ayarlarından ikisini de tek sayfadan yapabilirsin.",
      cta: { href: securityLink(), label: "Güvenlik ayarlarına git" },
    }),
  };
}

/** 2FA açıldı — olumlu (mavi). */
export function twoFactorEnabled(input: { name: string }): EmailContent {
  return {
    subject: "İki adımlı doğrulama açıldı",
    html: accountLayout({
      tone: "info",
      heading: "İki adımlı doğrulama açıldı",
      greeting: greet(input.name),
      intro:
        "Hesabında iki adımlı doğrulama (2FA) açıldı. Bundan sonra girişlerde şifrenin yanında doğrulama kodun da istenecek — hesabın artık çok daha güvende.",
      callout:
        "Bunu sen yapmadıysan güvenlik ayarlarından şifreni değiştir ve tüm oturumları kapat.",
      cta: { href: securityLink(), label: "Güvenlik ayarları" },
    }),
  };
}

/** 2FA kapatıldı — KRİTİK (kırmızı). */
export function twoFactorDisabled(input: { name: string }): EmailContent {
  return {
    subject: "İki adımlı doğrulama KAPATILDI",
    html: accountLayout({
      tone: "critical",
      heading: "İki adımlı doğrulama kapatıldı",
      greeting: greet(input.name),
      intro:
        "Hesabındaki iki adımlı doğrulama (2FA) kapatıldı. Artık girişlerde yalnızca şifren isteniyor.",
      callout:
        "Bunu sen yapmadıysan hesabın risk altında olabilir: şifreni hemen değiştir, tüm oturumları kapat ve 2FA'yı tekrar aç.",
      cta: { href: securityLink(), label: "Güvenlik ayarlarına git" },
    }),
  };
}

/** Tüm oturumlar kapatıldı — bilgilendirme (mavi). */
export function sessionsRevoked(input: { name: string }): EmailContent {
  return {
    subject: "Tüm oturumların kapatıldı",
    html: accountLayout({
      tone: "info",
      heading: "Tüm oturumların kapatıldı",
      greeting: greet(input.name),
      intro:
        "Hesabındaki tüm aktif oturumlar sonlandırıldı. Kullandığın her cihazda yeniden giriş yapman gerekecek.",
      callout:
        "Bu işlemi sen başlatmadıysan şifreni değiştir ve iki adımlı doğrulamayı aç.",
      cta: { href: securityLink(), label: "Güvenlik ayarları" },
    }),
  };
}

/** Veri dışa aktarımı — KVKK izi (mavi). */
export function dataExported(input: { name: string }): EmailContent {
  return {
    subject: "Verilerin dışa aktarıldı",
    html: accountLayout({
      tone: "info",
      heading: "Verilerin dışa aktarıldı",
      greeting: greet(input.name),
      intro:
        "Hesabındaki verilerin dışa aktarılması için bir talep işlendi. KVKK kapsamındaki bu hakkın kaydı için sana bu bildirimi gönderiyoruz.",
      callout:
        "Bu talebi sen yapmadıysan lütfen vakit kaybetmeden bizimle iletişime geç.",
      cta: { href: supportLink(), label: "Destek ekibine yaz" },
    }),
  };
}

/** Hesap silindi — veda, CTA yok (hesap artık yok). */
export function accountDeleted(input: { name: string }): EmailContent {
  return {
    subject: "Hesabın silindi",
    html: accountLayout({
      tone: "info",
      heading: "Hesabın silindi",
      greeting: greet(input.name),
      intro:
        "FinOptima hesabın ve hesabına bağlı tüm verilerin kalıcı olarak silindi. Bu işlemin geri dönüşü yok; silinen veriler kurtarılamaz.",
      extraHtml: `<p style="margin:0 0 4px;color:#334155;font-size:15px;line-height:1.6;">Bize güvendiğin için teşekkür ederiz. Yolun bir gün yeniden FinOptima'ya düşerse seni sıfırdan, tertemiz bir hesapla karşılamaktan mutlu oluruz.</p>`,
    }),
  };
}

/** Ard arda başarısız giriş denemeleri — dikkat/kritik (amber). */
export function failedLoginBurst(input: {
  name: string;
  attempts: number;
  whenText: string;
}): EmailContent {
  return {
    subject: "Hesabında başarısız giriş denemeleri",
    html: accountLayout({
      tone: "warn",
      heading: "Hesabında başarısız giriş denemeleri",
      greeting: greet(input.name),
      intro: `Hesabına kısa süre içinde ${input.attempts} kez hatalı şifreyle giriş denendi. Bu denemeler sana aitse (şifreni unuttuysan) endişelenmene gerek yok — şifreni sıfırlaman yeterli.`,
      meta: [
        ["Deneme sayısı", String(input.attempts)],
        ["Son deneme", input.whenText],
      ],
      callout:
        "Bu denemeler sana ait değilse birileri hesabına girmeye çalışıyor olabilir: şifreni hemen değiştir ve iki adımlı doğrulamayı aç.",
      cta: { href: securityLink(), label: "Güvenlik ayarlarına git" },
    }),
  };
}
