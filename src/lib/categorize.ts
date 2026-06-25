// Kural tabanlı kategorizasyon motoru.
// Gerçek AI'ya geçişte sadece bu modül değiştirilir; arayüz aynı kalır.

export type Rule = {
  pattern: string;
  categoryId: string;
  priority: number;
};

// Eşleştirme için Türkçe karakterleri ASCII'ye katlar. Banka dökümlerindeki
// büyük harfli ("MIGROS") veya Türkçe karaktersiz ("ZEKERIYAKOY") yazımları
// kural kalıplarıyla aynı tabana indirger.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/i̇/g, "i")
    .replace(/[ıİ]/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

// Açıklama metnine en uygun kategoriyi döndürür (yoksa null).
export function categorize(description: string, rules: Rule[]): string | null {
  const text = normalize(description);
  if (!text) return null;

  let best: { categoryId: string; priority: number; length: number } | null =
    null;

  for (const rule of rules) {
    const pattern = normalize(rule.pattern);
    if (!pattern) continue;
    if (text.includes(pattern)) {
      const candidate = {
        categoryId: rule.categoryId,
        priority: rule.priority,
        length: pattern.length,
      };
      if (
        !best ||
        candidate.priority > best.priority ||
        (candidate.priority === best.priority &&
          candidate.length > best.length)
      ) {
        best = candidate;
      }
    }
  }

  return best?.categoryId ?? null;
}
