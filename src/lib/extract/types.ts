// Evrensel belge okuyucu — ortak tipler ve arayüz.
// Tüm motorlar (offline / Claude) bu normalize çıktıyı üretir; çıktı mevcut
// `ParsedRow → commitStatement` akışına eşlenir (DB yazma yolu değişmez).

export type ExtractDirection = "in" | "out"; // in = gelir/alacak, out = gider/borç

export type ExtractedRow = {
  date: Date;
  description: string;
  amount: number; // her zaman pozitif
  direction: ExtractDirection;
  currency: string | null;
  merchant?: string | null; // işyeri/kurum adı (varsa)
  categoryHint?: string | null; // seed kategori anahtarı (açıklamadan anlaşıldıysa)
};

export type DocKind =
  | "receipt" // fiş
  | "statement" // hesap dökümü
  | "card_statement" // kredi kartı ekstresi
  | "invoice" // fatura / e-dekont
  | "unknown";

export type ExtractEngine = "offline" | "claude";

export type ExtractResult = {
  rows: ExtractedRow[];
  docKind: DocKind;
  currency: string | null;
  confidence: number; // 0-1 — düşükse yönlendirici buluta yükseltebilir
  engine: ExtractEngine;
  meta?: { bank?: string; language?: string };
};

export type ExtractInput = {
  fileName: string;
  mimeType: string;
  /** PDF/Excel/CSV ham bytes (sunucu tarafı). */
  buffer?: ArrayBuffer;
  /** Önceden çıkarılmış metin (ör. tarayıcıda yapılan OCR ya da PDF metni). */
  text?: string;
};

export interface DocumentExtractor {
  readonly engine: ExtractEngine;
  extract(input: ExtractInput): Promise<ExtractResult>;
}
