import { toDateKey } from "@/lib/format";

// Mükerrer (aynı) işlem tespiti için istikrarlı hash.
// FORMAT DONUK — değişirse mevcut kayıtlı hash'ler artık eşleşmez.
// Bileşen: gün(YYYY-MM-DD) | tutar(2 ondalık) | açıklama ilk 60 küçük-harf.
export function makeDedupHash(
  date: Date,
  amount: number,
  description: string,
): string {
  return `${toDateKey(date)}|${amount.toFixed(2)}|${description.slice(0, 60).toLowerCase()}`;
}
