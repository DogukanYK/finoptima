// Evrensel belge okuyucu — yönlendirici.
// Önce offline (ücretsiz, internetsiz). Güven düşük VE bulut açıksa Claude'a yükselt.
// Hata olursa offline çıktısına düşer (asla patlamaz).

import type { ExtractInput, ExtractResult } from "@/lib/extract/types";
import { offlineExtract } from "@/lib/extract/offline";
import { claudeExtract } from "@/lib/extract/claude";

export type { ExtractInput, ExtractResult, ExtractedRow, DocKind, ExtractEngine } from "@/lib/extract/types";

// Offline güveni bunun altındaysa (ve bulut açıksa) buluta yükseltilir.
const CLOUD_THRESHOLD = 0.6;

export async function extractDocument(
  input: ExtractInput,
  opts: { allowCloud?: boolean } = {},
): Promise<ExtractResult> {
  const offline = offlineExtract(input);

  // Yeterli güven ya da bulut kapalı → offline.
  if (offline.confidence >= CLOUD_THRESHOLD || !opts.allowCloud) {
    return offline;
  }

  // Düşük güven + bulut açık → Claude'a yükselt; hata/boşsa offline'a düş.
  try {
    const cloud = await claudeExtract(input);
    if (cloud.rows.length === 0 && offline.rows.length > 0) return offline;
    return cloud;
  } catch {
    return offline;
  }
}
