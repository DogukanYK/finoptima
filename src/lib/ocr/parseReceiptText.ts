// Fiş OCR ham metnini yapılandırılmış veriye çevirir — saf fonksiyon.
// İstemci ve sunucu tarafından paylaşılabilir (yalnız @/lib/format'a bağlı).

import { parseStatementAmount } from "@/lib/bankProfiles";

export type ParsedReceipt = {
  amount: number | null; // çıkarılan toplam tutar
  date: string | null; // yyyy-mm-dd
  merchant: string | null; // satıcı / işletme adı
};

// Çok-para-birimli tutar belirteci: 1.234,56 · 1,234.56 · 45,00 · 45.00
const AMOUNT_TOKEN =
  /\d{1,3}(?:[.,\s]\d{3})*[.,]\d{1,2}|\d+[.,]\d{1,2}/g;

// "TOPLAM" türü satırlar (en güvenilir tutar kaynağı) — TR + EN
const TOTAL_LINE =
  /(genel\s*toplam|toplam|tutar|ödenecek|odenecek|grand\s*total|amount\s*due|balance\s*due|total\s*due|\btotal\b)/i;
// Toplam olarak sayılmaması gereken satırlar — TR + EN
const NOT_TOTAL =
  /(ara\s*toplam|kdv|iskonto|indirim|para\s*üstü|nakit|kredi|sub\s*total|subtotal|\btax\b|\bvat\b|discount|change|\bcash\b|\bcard\b)/i;

function amountsIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(AMOUNT_TOKEN)) {
    const n = Math.abs(parseStatementAmount(m[0]));
    if (Number.isFinite(n) && n > 0) out.push(n);
  }
  return out;
}

function findAmount(lines: string[]): number | null {
  // 1) "GENEL TOPLAM / TOPLAM" satırındaki tutar.
  for (const line of lines) {
    if (TOTAL_LINE.test(line) && !NOT_TOTAL.test(line)) {
      const found = amountsIn(line);
      if (found.length) return Math.max(...found);
    }
  }
  // 2) Yedek: tüm metindeki en büyük makul tutar.
  const all = amountsIn(lines.join("\n"));
  return all.length ? Math.max(...all) : null;
}

function findDate(raw: string): string | null {
  const m = raw.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
  if (!m) return null;
  let [, d, mo, y] = m;
  const day = Number(d);
  const month = Number(mo);
  let year = Number(y);
  if (year < 100) year += 2000;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;
  if (year < 2000 || year > 2100) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const SKIP_MERCHANT =
  /(fiş|fis|fatura|tarih|saat|no:|vergi|tckn|date|time|invoice|receipt|^\W*$)/i;

function findMerchant(lines: string[]): string | null {
  for (const line of lines.slice(0, 6)) {
    const letters = line.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, "");
    if (letters.length >= 3 && !SKIP_MERCHANT.test(line)) {
      return line.slice(0, 60);
    }
  }
  return null;
}

export function parseReceiptText(raw: string): ParsedReceipt {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return {
    amount: findAmount(lines),
    date: findDate(raw),
    merchant: findMerchant(lines),
  };
}
