// Belge metninden bankayı/kurumu tahmin eder (offline + Claude fallback).
// Yalnız görüntüleme etiketi + hesap otomatik-eşleme için. Sıralı anahtar kelime
// tablosu (ilk ~2500 karakter) + TR IBAN banka kodu yedeği.

function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(/i̇/g, "i")
    .replace(/[ıİ]/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

// Sıra önemli: iştirak/markalı program eşleşmeleri temiz kalsın (Enpara → QNB'den
// önce). Belirsiz tek-kelime markalar (bonus, world, maximum) yerine daha spesifik
// kalıplar kullanıldı ki yanlış eşleşme olmasın.
const BANKS: { name: string; keys: string[] }[] = [
  { name: "Enpara", keys: ["enpara"] },
  { name: "Garanti BBVA", keys: ["garanti bbva", "garanti bankasi", "garantibank", "t. garanti"] },
  { name: "Yapı Kredi", keys: ["yapi kredi", "yapikredi", "worldcard", "world kart"] },
  { name: "Türkiye İş Bankası", keys: ["is bankasi", "isbank", "turkiye is bankasi", "maximum kart", "maximum card"] },
  { name: "Akbank", keys: ["akbank", "axess", "wings kart"] },
  { name: "Ziraat Bankası", keys: ["ziraat bankasi", "ziraat kati", "bankkart"] },
  { name: "Halkbank", keys: ["halkbank", "halk bankasi", "paraf kart"] },
  { name: "VakıfBank", keys: ["vakifbank", "vakif bank", "vakif kati"] },
  { name: "QNB", keys: ["qnb", "finansbank", "cardfinans"] },
  { name: "DenizBank", keys: ["denizbank", "bonus trink"] },
  { name: "TEB", keys: ["turk ekonomi bankasi", "teb bank"] },
  { name: "ING", keys: ["ing bank"] },
  { name: "Kuveyt Türk", keys: ["kuveyt turk"] },
  { name: "Albaraka", keys: ["albaraka"] },
  { name: "Fibabanka", keys: ["fibabanka"] },
  { name: "Şekerbank", keys: ["sekerbank"] },
  { name: "Papara", keys: ["papara"] },
  { name: "Nays", keys: ["nays"] },
  { name: "Tosla", keys: ["tosla"] },
];

const IBAN_CODES: Record<string, string> = {
  "00010": "Ziraat Bankası",
  "00012": "Halkbank",
  "00015": "VakıfBank",
  "00032": "TEB",
  "00046": "Akbank",
  "00059": "Şekerbank",
  "00062": "Garanti BBVA",
  "00064": "Türkiye İş Bankası",
  "00067": "Yapı Kredi",
  "00099": "ING",
  "00103": "Fibabanka",
  "00111": "QNB",
  "00134": "DenizBank",
  "00203": "Albaraka",
  "00205": "Kuveyt Türk",
};

export function detectBankName(text: string): string | null {
  if (!text) return null;
  const head = fold(text.slice(0, 2500));
  for (const b of BANKS) {
    if (b.keys.some((k) => head.includes(k))) return b.name;
  }
  const m = text.match(/TR\d{2}\s?(\d{5})/i);
  if (m && IBAN_CODES[m[1]]) return IBAN_CODES[m[1]];
  return null;
}
