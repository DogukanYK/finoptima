// Offline motor sarmalayıcı — metni jenerik parser'a verir, ExtractResult üretir.
// Ücretsiz, internetsiz. Görüntü OCR'ı tarayıcıda yapılır; bu motor metin/PDF-metni üzerinde çalışır.

import { parseGenericStatement } from "@/lib/extract/genericText";
import type { ExtractInput, ExtractResult, DocKind } from "@/lib/extract/types";

function guessDocKind(text: string, rowCount: number): DocKind {
  const f = text.toLowerCase();
  if (/kredi kart|credit card|ekstre|kart ekstresi|miles/.test(f))
    return "card_statement";
  if (/fatura|invoice|dekont/.test(f)) return "invoice";
  if (/fi[şs]|receipt|adisyon/.test(f) && rowCount <= 1) return "receipt";
  return rowCount > 1 ? "statement" : "unknown";
}

export function offlineExtract(input: ExtractInput): ExtractResult {
  const text = input.text ?? "";
  const { rows, currency, confidence } = parseGenericStatement(text);
  return {
    rows,
    docKind: guessDocKind(text, rows.length),
    currency,
    confidence,
    engine: "offline",
  };
}
