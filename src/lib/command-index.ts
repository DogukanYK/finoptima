// Komut paleti (⌘K) statik indeksi + arama yardımcıları.
// Buradaki rotalar uygulamadaki HER gidilebilir yeri kapsar (ayar alt sekmeleri
// dahil), böylece kullanıcı yazınca gerçekten oraya götürebiliriz.

export type CommandRoute = {
  href: string;
  label: string;
  group: string;
  keywords: string; // TR-katlanmış eşleşme için ek anahtar kelimeler
  icon: string; // command-palette'teki ICONS haritası anahtarı
};

export const COMMAND_ROUTES: CommandRoute[] = [
  // Sayfalar
  { href: "/dashboard", label: "Panel", group: "Sayfalar", keywords: "ana sayfa anasayfa ozet dashboard bakiye genel", icon: "dashboard" },
  { href: "/transactions", label: "İşlemler", group: "Sayfalar", keywords: "hareketler gelir gider liste islem", icon: "transactions" },
  { href: "/findeks", label: "Findeks · Kredi Notu", group: "Sayfalar", keywords: "kredi notu skor findeks puan koc", icon: "gauge" },
  { href: "/borclar", label: "Borçlar", group: "Sayfalar", keywords: "kredi kart borc taksit odeme", icon: "credit-card" },
  { href: "/calendar", label: "Takvim", group: "Sayfalar", keywords: "takvim odeme plani hatirlatma etkinlik", icon: "calendar" },
  { href: "/receipts", label: "Fişler", group: "Sayfalar", keywords: "fis fiş makbuz dekont", icon: "receipt" },
  { href: "/profil", label: "Profil", group: "Sayfalar", keywords: "profil hesabim kisisel bilgi ai profil", icon: "user" },

  // Hızlı işlemler
  { href: "/add", label: "Harcama / Gelir Ekle", group: "Hızlı İşlem", keywords: "yeni islem ekle harcama gelir gider gir", icon: "plus" },
  { href: "/import", label: "Banka Dökümü / Ekstre Yükle", group: "Hızlı İşlem", keywords: "ice aktar import ekstre dokum banka pdf yukle", icon: "upload" },

  // Ayar alt sekmeleri (deep-link)
  { href: "/settings?tab=appearance", label: "Ayarlar · Görünüm (Tema & Renk)", group: "Ayarlar", keywords: "tema renk dark light koyu acik palet gorunum mod", icon: "palette" },
  { href: "/settings?tab=categories", label: "Ayarlar · Kategoriler", group: "Ayarlar", keywords: "kategori etiket duzenle", icon: "tag" },
  { href: "/settings?tab=accounts", label: "Ayarlar · Hesaplar & Kartlar", group: "Ayarlar", keywords: "hesap banka kart iban ekle", icon: "bank" },
  { href: "/settings?tab=security", label: "Ayarlar · Güvenlik (2FA)", group: "Ayarlar", keywords: "guvenlik sifre iki adimli 2fa dogrulama", icon: "shield" },
  { href: "/settings?tab=data", label: "Ayarlar · Veri & Gizlilik", group: "Ayarlar", keywords: "veri gizlilik disa aktar sil yedek", icon: "database" },
];

// Türkçe karakterleri ASCII'ye katlar (categorize.ts normalize ile aynı taban).
export function foldTr(text: string): string {
  return (text ?? "")
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

// Basit çok-kelimeli skorlama: sorgunun her kelimesi hedefte geçmeli.
// Etikette baştan eşleşme > içeride eşleşme > yalnız anahtar kelimede eşleşme.
// Eşleşme yoksa -1 döner.
export function scoreRoute(query: string, route: CommandRoute): number {
  const q = foldTr(query);
  if (!q) return 0;
  const label = foldTr(route.label);
  const hay = `${label} ${foldTr(route.keywords)}`;
  const tokens = q.split(/\s+/).filter(Boolean);
  let score = 0;
  for (const tok of tokens) {
    if (!hay.includes(tok)) return -1;
    if (label.startsWith(tok)) score += 3;
    else if (label.includes(tok)) score += 2;
    else score += 1;
  }
  return score;
}
