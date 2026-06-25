// Claude belge motoru (bulut tier) — yüksek doğruluk, her banka/dil/belge tipi.
// Vision (görüntü/taranmış PDF) + metin → yapısal işlem satırları.
// ai/client.ts'i yeniden kullanır; çıktı zod ile doğrulanır (creditCoach kalıbı).
//
// GİZLİLİK: yalnız kullanıcı "yüksek doğruluk (bulut)" seçtiğinde çağrılır.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, EXTRACT_MODEL } from "@/lib/ai/client";
import type { ExtractInput, ExtractResult, ExtractedRow } from "@/lib/extract/types";

const rowSchema = z.object({
  date: z.string(), // ISO yyyy-mm-dd
  description: z.string(),
  amount: z.number(), // pozitif
  direction: z.enum(["in", "out"]), // in = gelir/alacak, out = gider/borç
});

const docSchema = z.object({
  docKind: z.enum(["receipt", "statement", "card_statement", "invoice", "unknown"]),
  currency: z.string().nullable(),
  rows: z.array(rowSchema),
});

const SYSTEM_PROMPT = `Sen bir finansal belge çıkarıcısısın. Verilen belgeyi (hesap dökümü, kredi kartı ekstresi, fatura, e-dekont ya da fiş — HER banka, HER dil) oku ve içindeki işlem satırlarını çıkar.

KURALLAR:
1. Her işlem satırı: date (ISO yyyy-mm-dd), description (kısa açıklama), amount (POZİTİF sayı), direction ("in"=gelir/alacak/iade, "out"=gider/borç/ödeme).
2. BAKİYE satırlarını dahil etme — yalnızca gerçek işlemler. Toplam/ara toplam satırlarını da atla.
3. Tarihi belgedeki formattan doğru çöz (dd/mm vs mm/dd ayrımına dikkat); belirsizse en mantıklısını seç.
4. Tutarda binlik/ondalık ayıracını doğru yorumla (1.234,56 ve 1,234.56 ikisi de 1234.56'dır).
5. Para birimini belirle (TRY, USD, EUR, GBP...); belirsizse null.
6. docKind'i belge tipine göre seç. Belgede gerçekten olan veriyi çıkar, ASLA uydurma.`;

// MIME → izinli görüntü medya tipi (SDK union'ı).
type ImageMedia = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
const IMAGE_MEDIA: Record<string, ImageMedia> = {
  "image/jpeg": "image/jpeg",
  "image/jpg": "image/jpeg",
  "image/png": "image/png",
  "image/gif": "image/gif",
  "image/webp": "image/webp",
};

function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

export async function claudeExtract(input: ExtractInput): Promise<ExtractResult> {
  const client = getAnthropic();
  const content: Anthropic.ContentBlockParam[] = [];

  const imageMedia = IMAGE_MEDIA[input.mimeType.toLowerCase()];
  if (input.buffer && imageMedia) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: imageMedia, data: toBase64(input.buffer) },
    });
  } else if (input.buffer && input.mimeType === "application/pdf") {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: toBase64(input.buffer) },
    });
  }
  content.push({
    type: "text",
    text: input.text
      ? `Belge metni:\n${input.text}\n\nBu metindeki işlemleri çıkar.`
      : "Bu belgedeki işlemleri çıkar.",
  });

  const message = await client.messages.parse({
    model: EXTRACT_MODEL,
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    output_config: { format: zodOutputFormat(docSchema) },
    messages: [{ role: "user", content }],
  });

  const out = message.parsed_output;
  if (!out) throw new Error("Belge okunamadı (boş yanıt).");

  const rows: ExtractedRow[] = out.rows
    .map((r) => ({
      date: new Date(r.date),
      description: r.description.slice(0, 120),
      amount: Math.abs(r.amount),
      direction: r.direction,
      currency: out.currency,
    }))
    .filter((r) => !Number.isNaN(r.date.getTime()) && r.amount > 0);

  return {
    rows,
    docKind: out.docKind,
    currency: out.currency,
    confidence: 0.97,
    engine: "claude",
  };
}
