// Transfer sınıflandırma köprüsü — AI (Claude) çıkarım yolunu CSV/Excel yoluyla
// aynı hizaya getirir. Kural motoru TEK yerde: bankProfiles.classifyKind.
// Buradaki tek ek, Claude'un satır bazında verdiği açık "isTransfer" işareti.

import { classifyKind, type TxKind } from "@/lib/bankProfiles";
import type { ExtractedRow, ExtractResult } from "@/lib/extract/types";

/** Claude'un "bu satır hesaplar arası transfer" işaretini taşıyan çıkarım satırı. */
export type TransferAwareRow = ExtractedRow & { isTransfer?: boolean };

/** rows'u transfer işaretli satırlarla daraltılmış çıkarım sonucu. */
export type TransferAwareResult = ExtractResult & { rows: TransferAwareRow[] };

/**
 * Çıkarılan bir satırın işlem türünü çözer.
 * Transfer ise (Claude işaretledi VEYA açıklama kalıbı tuttu) TRANSFER;
 * değilse yön bilgisine göre INCOME/EXPENSE.
 */
export function resolveExtractedKind(
  row: TransferAwareRow,
  ownerName?: string,
): TxKind {
  const signed = row.direction === "in" ? row.amount : -row.amount;
  // CSV/Excel yolundaki kalıplar + kendi adına havale tespiti burada da geçerli.
  const byRules = classifyKind(row.description, row.merchant ?? "", signed, ownerName);
  if (byRules === "TRANSFER" || row.isTransfer) return "TRANSFER";
  return byRules;
}
