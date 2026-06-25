// Banka dökümü ayrıştırma — başlık anahtar kelimelerine göre kolon algılama.
// Enpara, Garanti, Yapı Kredi, Ziraat ve Nays dökümleri farklı kolon adları
// kullanır; bu yüzden sabit eşleme yerine esnek algılama yapılır.

export const SUPPORTED_BANKS = [
  "Enpara",
  "Garanti BBVA",
  "Yapı Kredi",
  "Ziraat Bankası",
  "Nays",
  "Diğer",
] as const;

const DATE_HINTS = ["işlem tarihi", "tarih", "valör", "date", "tarihi"];
const DESC_HINTS = [
  "açıklama",
  "aciklama",
  "işlem açıklaması",
  "detay",
  "description",
  "işlem",
  "etiket",
];
const AMOUNT_HINTS = [
  "işlem tutarı",
  "tutar",
  "miktar",
  "amount",
  "tutar (tl)",
];
const DEBIT_HINTS = ["borç", "borc", "çıkan", "cikan", "gider", "harcama"];
const CREDIT_HINTS = ["alacak", "giren", "gelir", "yatan"];
const BALANCE_HINTS = ["bakiye", "balance", "kalan"];
const LABEL_HINTS = ["etiket", "hareket tipi", "işlem tipi", "işlem türü", "tür"];

export type DetectedColumns = {
  date: number;
  desc: number;
  amount: number | null;
  debit: number | null;
  credit: number | null;
  label: number | null;
};

function norm(s: unknown): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr-TR")
    .replace(/i̇/g, "i")
    .trim();
}

function findCol(headers: string[], hints: string[], exclude: number[] = []) {
  for (const hint of hints) {
    for (let i = 0; i < headers.length; i++) {
      if (exclude.includes(i)) continue;
      if (norm(headers[i]).includes(hint)) return i;
    }
  }
  return -1;
}

export function detectColumns(headers: string[]): DetectedColumns | null {
  const date = findCol(headers, DATE_HINTS);
  const desc = findCol(headers, DESC_HINTS, date >= 0 ? [date] : []);
  if (date < 0 || desc < 0) return null;

  const used = [date, desc];
  const debit = findCol(headers, DEBIT_HINTS, used);
  const credit = findCol(headers, CREDIT_HINTS, [...used, debit].filter((i) => i >= 0));
  // tutar kolonu: bakiye olmayan, kullanılmamış sayısal kolon
  let amount = -1;
  for (const hint of AMOUNT_HINTS) {
    for (let i = 0; i < headers.length; i++) {
      if (used.includes(i) || i === debit || i === credit) continue;
      const h = norm(headers[i]);
      if (BALANCE_HINTS.some((b) => h.includes(b))) continue;
      if (h.includes(hint)) {
        amount = i;
        break;
      }
    }
    if (amount >= 0) break;
  }

  if (amount < 0 && debit < 0 && credit < 0) return null;

  const label = findCol(
    headers,
    LABEL_HINTS,
    [date, desc, amount, debit, credit].filter((i) => i >= 0),
  );

  return {
    date,
    desc,
    amount: amount >= 0 ? amount : null,
    debit: debit >= 0 ? debit : null,
    credit: credit >= 0 ? credit : null,
    label: label >= 0 ? label : null,
  };
}

export type TxKind = "INCOME" | "EXPENSE" | "TRANSFER";

const TRANSFER_PATTERNS = [
  "kart ödeme",
  "kart odeme",
  "k.kartı öde",
  "k.karti ode",
  "kredi kart",
  "kredi kartı öde",
  "virman",
  "hesaplar aras",
  "kendi hesab",
  "cüzdan hesab",
  "debit karttan",
];

// Bir işlem satırının türünü (gelir/gider/transfer) akıllıca tahmin eder.
export function classifyKind(
  description: string,
  label: string,
  signedAmount: number,
  ownerName?: string,
): TxKind {
  const t = norm(`${description} ${label}`);

  if (TRANSFER_PATTERNS.some((p) => t.includes(p))) return "TRANSFER";

  // kendine yapılan transfer (FAST/EFT/havale) -> transfer
  if (ownerName) {
    const parts = norm(ownerName)
      .split(/\s+/)
      .filter((p) => p.length > 2);
    const selfMatch =
      parts.length > 0 && parts.every((p) => t.includes(p));
    if (selfMatch && /(transfer|fast|havale|eft)/.test(t)) return "TRANSFER";
  }

  return signedAmount >= 0 ? "INCOME" : "EXPENSE";
}

// Döküm hücresindeki tarihi Date'e çevirir.
export function parseStatementDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const s = String(value ?? "").trim();
  if (!s) return null;

  // dd/mm/yyyy, dd.mm.yyyy, dd-mm-yyyy
  let m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (m) {
    const d = Number(m[1]);
    const mo = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += 2000;
    const date = new Date(y, mo - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  // yyyy-mm-dd
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

// Döküm hücresindeki tutarı sayıya çevirir.
export function parseStatementAmount(value: unknown): number {
  if (typeof value === "number") return value;
  let s = String(value ?? "").trim();
  if (!s) return NaN;
  s = s.replace(/[₺tl\s]/gi, "");
  const neg = s.includes("-") || /\(.*\)/.test(s);
  s = s.replace(/[()-]/g, "");
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    s = s.replace(/,/g, ".");
  }
  const n = Number(s);
  if (Number.isNaN(n)) return NaN;
  return neg ? -Math.abs(n) : n;
}
