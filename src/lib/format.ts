// Türkçe yerel biçimlendirme yardımcıları

const tl = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const tlCompact = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatTL(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return tl.format(Number.isFinite(n) ? n : 0);
}

export function formatTLCompact(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return tlCompact.format(Number.isFinite(n) ? n : 0);
}

const dateFull = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateShort = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dayMonth = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
});

export function formatDate(d: Date | string): string {
  return dateFull.format(new Date(d));
}

export function formatDateShort(d: Date | string): string {
  return dateShort.format(new Date(d));
}

export function formatDayMonth(d: Date | string): string {
  return dayMonth.format(new Date(d));
}

export const TR_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export const TR_WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

export function monthLabel(month: string): string {
  // "2026-05" -> "Mayıs 2026"
  const [y, m] = month.split("-");
  return `${TR_MONTHS[Number(m) - 1] ?? ""} ${y}`;
}

// "yyyy-mm-dd" form girdisini yerel saat dilimine göre Date'e çevirir.
export function dateFromInput(s: string): Date {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(s);
}

// Türkçe/karışık biçimli tutar metnini sayıya çevirir ("1.234,56" -> 1234.56)
export function parseAmount(raw: string): number {
  let s = (raw ?? "").trim();
  if (!s) return NaN;
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
  return Number(s);
}

export function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
