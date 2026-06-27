import Anthropic from "@anthropic-ai/sdk";

// Anthropic istemcisi — YALNIZCA sunucuda kullanılır (server action / server component).
// API anahtarı asla client bundle'a girmez; .env (lokal) ve Vercel project env'inden okunur.
let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY tanımlı değil. .env (lokal) ve Vercel project env'ine ekleyin.",
    );
  }
  _client ??= new Anthropic({ apiKey });
  return _client;
}

// Kredi koçu için varsayılan model. Hacim artınca maliyet için
// "claude-sonnet-4-6" veya "claude-haiku-4-5"e düşürülebilir.
export const CREDIT_COACH_MODEL = "claude-opus-4-8";

// Belge okuma (vision/PDF) modeli — mekanik çıkarım + HIZ için Sonnet
// (çok işlemli ekstrede Opus ~85s sürüp Vercel zaman aşımına takılıyor).
// Maksimum doğruluk istenirse "claude-opus-4-8"e çekilebilir.
export const EXTRACT_MODEL = "claude-sonnet-4-6";

// Demo modu: AI_DEMO=true ise API ÇAĞRILMAZ, açıkça "[DEMO]" etiketli örnek
// sonuç döner. Anahtarsız akışı 0$ ile test etmek için (gerçek veri DEĞİL).
export const AI_DEMO = process.env.AI_DEMO === "true";
