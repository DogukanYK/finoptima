export type NavItem = {
  href: string;
  label: string;
  icon: string; // lucide ikon adı (kebab-case)
};

// Masaüstü kenar çubuğu — kredi-notu MVP'si
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: "layout-dashboard" },
  { href: "/findeks", label: "Findeks", icon: "gauge" },
  { href: "/borclar", label: "Borçlar", icon: "credit-card" },
  { href: "/transactions", label: "İşlemler", icon: "arrow-left-right" },
  { href: "/add", label: "Harcama Ekle", icon: "plus" },
  { href: "/calendar", label: "Takvim", icon: "calendar-days" },
];

export const SECONDARY_NAV: NavItem[] = [
  { href: "/import", label: "Banka Dökümü", icon: "upload" },
  { href: "/receipts", label: "Fişler", icon: "receipt-text" },
  { href: "/destek", label: "Destek", icon: "life-buoy" },
  { href: "/profil", label: "Profil", icon: "user-round" },
  { href: "/settings", label: "Ayarlar", icon: "settings" },
];

// Yalnız ADMIN görür (app-shell isAdmin ile filtreler).
export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Yönetim", icon: "shield" },
];

// Mobil alt gezinme — en sık 3 + orta FAB (Harcama Ekle)
export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Panel", icon: "layout-dashboard" },
  { href: "/findeks", label: "Findeks", icon: "gauge" },
  { href: "/transactions", label: "İşlemler", icon: "arrow-left-right" },
];

// Mobil "Daha" menüsü
export const MOBILE_MORE: NavItem[] = [
  { href: "/borclar", label: "Borçlar", icon: "credit-card" },
  { href: "/calendar", label: "Takvim", icon: "calendar-days" },
  { href: "/import", label: "Banka Dökümü", icon: "upload" },
  { href: "/receipts", label: "Fişler", icon: "receipt-text" },
  { href: "/destek", label: "Destek", icon: "life-buoy" },
  { href: "/profil", label: "Profil", icon: "user-round" },
  { href: "/settings", label: "Ayarlar", icon: "settings" },
];
