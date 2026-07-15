// POST /api/webhooks/resend-inbound — Resend "gelen e-posta" webhook'u (svix imzalı).
//
// DORMANT: RESEND_WEBHOOK_SECRET tanımlı değilse 503 döner — kullanıcı Resend'de
// "Enable Receiving" açıp webhook URL'ini kaydedip secret'ı env'e ekleyene kadar
// güvenli biçimde kapalı kalır. Geçerli imzadan SONRA her zaman 200 döneriz ki
// Resend başarısız sanıp retry etmesin; sonuç JSON gövdesinde {ok,reason} taşınır.

import { type NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { rateLimit } from "@/lib/rate-limit";
import { ingestInboundEmail } from "@/lib/support/inbound";

export const runtime = "nodejs";

function firstString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** "Ad Soyad <mail@x.com>" ya da düz "mail@x.com" ya da {email}/{address} objesi. */
function extractEmail(v: unknown): string {
  if (typeof v === "string") {
    const m = v.match(/<([^>]+)>/);
    return (m ? m[1] : v).trim();
  }
  if (Array.isArray(v)) return extractEmail(v[0]);
  if (v && typeof v === "object") {
    const o = v as { email?: unknown; address?: unknown };
    return firstString(o.email) ?? firstString(o.address) ?? "";
  }
  return "";
}

function extractText(data: Record<string, unknown>): string {
  return firstString(data.text) ?? firstString(data.plain) ?? firstString(data.body) ?? "";
}

/** Doğrudan alanlardan ya da headers (dizi/obje) içindeki Message-ID'den. */
function extractMessageId(data: Record<string, unknown>): string | null {
  const direct =
    firstString(data.message_id) ??
    firstString(data.messageId) ??
    firstString(data.email_id) ??
    firstString(data.id);
  if (direct) return direct;

  const h = data.headers;
  if (Array.isArray(h)) {
    for (const entry of h) {
      if (entry && typeof entry === "object") {
        const name = (entry as { name?: unknown }).name;
        const value = (entry as { value?: unknown }).value;
        if (
          typeof name === "string" &&
          name.toLowerCase() === "message-id" &&
          typeof value === "string"
        ) {
          return value.trim();
        }
      }
    }
  } else if (h && typeof h === "object") {
    for (const [k, val] of Object.entries(h as Record<string, unknown>)) {
      if (k.toLowerCase() === "message-id" && typeof val === "string") return val.trim();
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  // Hız sınırı — IP başına 60/dk.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = await rateLimit(`support:inbound:${ip}`, 60, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  // İmza doğrulaması HAM gövde ister — parse ETMEDEN önce oku.
  const raw = await req.text();

  let payload: unknown;
  try {
    const wh = new Webhook(secret);
    payload = wh.verify(raw, {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_signature" }, { status: 400 });
  }

  // Resend inbound event alanlarını savunmacı biçimde çıkar (type "email.received").
  const evt = (payload ?? {}) as { data?: unknown };
  const data: Record<string, unknown> =
    evt.data && typeof evt.data === "object" ? (evt.data as Record<string, unknown>) : {};

  const fromEmail = extractEmail(data.from);
  const subject = firstString(data.subject) ?? "";
  const text = extractText(data);
  const messageId = extractMessageId(data);

  const result = await ingestInboundEmail({ fromEmail, subject, text, messageId });

  // Geçerli imzadan sonra HER ZAMAN 200 — retry döngüsünü engelle.
  return NextResponse.json(result, { status: 200 });
}
