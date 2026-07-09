// Claude belge motoru (bulut tier) — yüksek doğruluk, her banka/dil/belge tipi.
// Vision (görüntü/taranmış PDF) + metin → yapısal işlem satırları.
// ai/client.ts'i yeniden kullanır; çıktı zod ile doğrulanır (creditCoach kalıbı).
//
// GİZLİLİK: yalnız kullanıcı "yüksek doğruluk (bulut)" seçtiğinde çağrılır.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, EXTRACT_MODEL, AI_DEMO } from "@/lib/ai/client";
import type { ExtractInput, ExtractResult, ExtractedRow } from "@/lib/extract/types";
import { SEED_CATEGORY_KEYS } from "@/lib/seed-data";
import { detectBankName } from "@/lib/extract/bankDetect";

const CATEGORY_KEYS = SEED_CATEGORY_KEYS as [string, ...string[]];

const rowSchema = z.object({
  date: z.string(), // ISO yyyy-mm-dd
  description: z.string(),
  amount: z.number(), // pozitif
  direction: z.enum(["in", "out"]), // in = gelir/alacak, out = gider/borç
  merchant: z.string().nullable(), // işyeri/kurum adı
  categoryHint: z.enum(CATEGORY_KEYS).nullable(), // açıklamadan çıkan kategori anahtarı
});

const docSchema = z.object({
  docKind: z.enum(["receipt", "statement", "card_statement", "invoice", "unknown"]),
  currency: z.string().nullable(),
  bank: z.string().nullable(), // belgeyi düzenleyen banka/kurum
  rows: z.array(rowSchema),
});

const SYSTEM_PROMPT = `Sen bir finansal belge çıkarıcısısın. Verilen belgeyi (hesap dökümü, kredi kartı ekstresi, fatura, e-dekont ya da fiş — HER banka, HER dil) oku ve içindeki işlem satırlarını çıkar.

KURALLAR:
1. Her işlem satırı: date (ISO yyyy-mm-dd), description (kısa açıklama), amount (POZİTİF sayı), direction ("in"=gelir/alacak/iade, "out"=gider/borç/ödeme).
2. BAKİYE satırlarını dahil etme — yalnızca gerçek işlemler. Toplam/ara toplam satırlarını da atla.
3. Tarihi belgedeki formattan doğru çöz (dd/mm vs mm/dd ayrımına dikkat); belirsizse en mantıklısını seç.
4. Tutarda binlik/ondalık ayıracını doğru yorumla (1.234,56 ve 1,234.56 ikisi de 1234.56'dır).
5. Para birimini belirle (TRY, USD, EUR, GBP...); belirsizse null.
6. docKind'i belge tipine göre seç. Belgede gerçekten olan veriyi çıkar, ASLA uydurma.
7. bank: Belgeyi düzenleyen banka/kurumu belirle (ör. "Garanti BBVA", "Enpara", "Yapı Kredi"); başlık/logo/IBAN'dan çöz, emin değilsen null.
8. merchant: Her satırda işyeri/kurum adını çıkar (ör. "Migros", "Netflix", "Elektrik Dağıtım"); yoksa null.
9. categoryHint: Açıklamadan işlemin ne olduğu anlaşılıyorsa listeden EN UYGUN anahtarı seç; emin değilsen null. Örnekler: elektrik/su/doğalgaz faturası→faturalar, market/Migros/BIM→market, maaş/bordro→maas, Netflix/Spotify→abonelikler, benzin/akaryakıt→akaryakit, kira→kira, restoran/yemek→yeme-icme. Geçerli anahtarlar: ${SEED_CATEGORY_KEYS.join(", ")}.`;

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

// Demo: gerçek AI yokken, belge türüne göre değişen gerçekçi sonuç üretir.
// 3 senaryo — fiş/görüntü · kredi kartı ekstresi · banka hesap dökümü.
function demoExtract(input: ExtractInput): ExtractResult {
  const t = new Date();
  const d = (n: number) =>
    new Date(t.getFullYear(), t.getMonth(), Math.max(1, t.getDate() - n));
  const text = (input.text ?? "").toLowerCase();
  const name = input.fileName.toLowerCase();
  const isImage =
    /^image\//.test(input.mimeType) || /\.(png|jpe?g|webp|heic)$/.test(name);
  const isCard =
    /kredi kart|ekstre|miles|world|bonus|maximum|axess|wing/.test(text) ||
    /ekstre|kart|card/.test(name);

  // Senaryo 1 — Fiş / ekran görüntüsü (tek harcama).
  if (isImage) {
    const rows: ExtractedRow[] = [
      { date: d(0), description: "Migros — market alışverişi", amount: 487.65, direction: "out", currency: "TRY" },
    ];
    return { rows, docKind: "receipt", currency: "TRY", confidence: 0.96, engine: "claude" };
  }

  // Senaryo 2 — Kredi kartı ekstresi.
  if (isCard) {
    const rows: ExtractedRow[] = [
      { date: d(2), description: "Trendyol", amount: 1240.5, direction: "out", currency: "TRY" },
      { date: d(4), description: "Migros", amount: 380.2, direction: "out", currency: "TRY" },
      { date: d(6), description: "Shell akaryakıt", amount: 1100, direction: "out", currency: "TRY" },
      { date: d(9), description: "Yemeksepeti", amount: 245.9, direction: "out", currency: "TRY" },
      { date: d(12), description: "Apple.com/bill", amount: 99, direction: "out", currency: "TRY" },
      { date: d(15), description: "Taksitli alışveriş (1/6)", amount: 520, direction: "out", currency: "TRY" },
      { date: d(18), description: "Asgari ödeme", amount: 1500, direction: "in", currency: "TRY" },
    ];
    return { rows, docKind: "card_statement", currency: "TRY", confidence: 0.95, engine: "claude", meta: { bank: "Yapı Kredi" } };
  }

  // Senaryo 3 — Banka hesap dökümü.
  const rows: ExtractedRow[] = [
    { date: d(1), description: "Maaş ödemesi", amount: 32000, direction: "in", currency: "TRY" },
    { date: d(2), description: "Konut kirası", amount: 12500, direction: "out", currency: "TRY" },
    { date: d(4), description: "Migros market", amount: 642.3, direction: "out", currency: "TRY" },
    { date: d(7), description: "Elektrik faturası", amount: 487.1, direction: "out", currency: "TRY" },
    { date: d(9), description: "Kredi kartı ödemesi", amount: 3500, direction: "out", currency: "TRY" },
    { date: d(12), description: "Spotify aboneliği", amount: 57.99, direction: "out", currency: "TRY" },
    { date: d(14), description: "Gelen havale", amount: 1500, direction: "in", currency: "TRY" },
    { date: d(18), description: "Akaryakıt", amount: 850, direction: "out", currency: "TRY" },
  ];
  return { rows, docKind: "statement", currency: "TRY", confidence: 0.94, engine: "claude", meta: { bank: "Garanti BBVA" } };
}

export async function claudeExtract(input: ExtractInput): Promise<ExtractResult> {
  if (AI_DEMO) return demoExtract(input);
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
    max_tokens: 16000, // uzun dökümler (çok işlemli ekstre) için headroom
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
      merchant: r.merchant ?? null,
      categoryHint: r.categoryHint ?? null,
    }))
    .filter((r) => !Number.isNaN(r.date.getTime()) && r.amount > 0);

  return {
    rows,
    docKind: out.docKind,
    currency: out.currency,
    confidence: 0.97,
    engine: "claude",
    meta: { bank: out.bank ?? detectBankName(input.text ?? "") ?? undefined },
  };
}
