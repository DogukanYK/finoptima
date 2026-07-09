// Yeni kullanıcı için varsayılan kategoriler, kategori kuralları ve hesaplar.

export type SeedCategory = {
  key: string;
  name: string;
  icon: string;
  color: string;
  kind: "INCOME" | "EXPENSE";
  rules: string[];
};

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    key: "market",
    name: "Market",
    icon: "shopping-cart",
    color: "#16A34A",
    kind: "EXPENSE",
    rules: ["migros", "bim", "a101", "şok", "sok", "carrefour", "market", "tarım kredi", "file", "hakmar", "macrocenter", "macro center", "gıda", "gida", "tekel", "bakkal", "manav", "kasap", "şarküteri", "sarkuteri", "metro market", "onur market", "tarihi", "kuruyemiş", "kuruyemis"],
  },
  {
    key: "yeme-icme",
    name: "Yeme-İçme",
    icon: "utensils",
    color: "#EA580C",
    kind: "EXPENSE",
    rules: ["restoran", "restaurant", "cafe", "kafe", "caffe", "yemeksepeti", "getir yemek", "trendyol - yemek", "trendyol yemek", "migrosone yemek", "starbucks", "sbx", "burger", "pizza", "kahve", "büfe", "bufe", "lokanta", "pastane", "pastacılık", "pastacilik", "çorba", "corba", "döner", "doner", "dürüm", "durum", "çiğköfte", "cigkofte", "kebap", "kebab", "bistro", "brasserie", "fırın", "firin", "tatlı", "waffle", "mc donald", "mcdonald", "kfc", "dominos", "antilop", "godiva", "egg", "nero", "pelit", "simit"],
  },
  {
    key: "ulasim",
    name: "Ulaşım",
    icon: "bus",
    color: "#0EA5E9",
    kind: "EXPENSE",
    rules: ["istanbulkart", "metro", "otobüs", "taksi", "uber", "bitaksi", "marti", "martı", "hgs", "ogs", "köprü", "ispark", "otopark", "marmaray", "metrobüs", "tcdd", "ido", "bilet"],
  },
  {
    key: "akaryakit",
    name: "Akaryakıt",
    icon: "fuel",
    color: "#B45309",
    kind: "EXPENSE",
    rules: ["opet", "shell", "bp", "petrol", "po petrol", "total", "akaryakıt", "benzin", "lukoil"],
  },
  {
    key: "faturalar",
    name: "Faturalar",
    icon: "receipt",
    color: "#DC2626",
    kind: "EXPENSE",
    rules: ["elektrik", "su faturası", "doğalgaz", "igdaş", "iski", "bedaş", "fatura", "aidat", "belediye", "paycell/fatura", "masterpass fatur"],
  },
  {
    key: "abonelikler",
    name: "Abonelikler",
    icon: "repeat",
    color: "#7C3AED",
    kind: "EXPENSE",
    rules: ["netflix", "spotify", "youtube premium", "disney", "exxen", "blutv", "icloud", "google one", "abonelik", "turkcell", "vodafone", "türk telekom", "superonline"],
  },
  {
    key: "kira",
    name: "Kira",
    icon: "home",
    color: "#0F766E",
    kind: "EXPENSE",
    rules: ["kira", "ev kirası"],
  },
  {
    key: "saglik",
    name: "Sağlık",
    icon: "heart-pulse",
    color: "#DB2777",
    kind: "EXPENSE",
    rules: ["eczane", "hastane", "doktor", "medikal", "diş", "sağlık", "laboratuvar", "klinik", "pet shop", "petshop", "veteriner"],
  },
  {
    key: "giyim",
    name: "Giyim",
    icon: "shirt",
    color: "#9333EA",
    kind: "EXPENSE",
    rules: ["lc waikiki", "lcw", "zara", "mavi", "koton", "defacto", "boyner", "giyim", "ayakkabı", "h&m"],
  },
  {
    key: "eglence",
    name: "Eğlence",
    icon: "party-popper",
    color: "#C026D3",
    kind: "EXPENSE",
    rules: ["sinema", "tiyatro", "konser", "oyun", "steam", "playstation", "eğlence", "biletix", "bilet"],
  },
  {
    key: "alisveris",
    name: "Alışveriş",
    icon: "shopping-bag",
    color: "#2563EB",
    kind: "EXPENSE",
    rules: ["trendyol", "hepsiburada", "hepsipay", "amazon", "n11", "gittigidiyor", "teknosa", "mediamarkt", "ikea", "kargo", "koçtaş", "koctas", "barcin", "barçın"],
  },
  {
    key: "egitim",
    name: "Eğitim",
    icon: "graduation-cap",
    color: "#0D9488",
    kind: "EXPENSE",
    rules: ["kurs", "kitap", "udemy", "eğitim", "okul", "ders", "sınav"],
  },
  {
    key: "seyahat",
    name: "Seyahat",
    icon: "plane",
    color: "#0891B2",
    kind: "EXPENSE",
    rules: ["thy", "pegasus", "anadolujet", "otel", "booking", "uçak", "tatil", "seyahat"],
  },
  {
    key: "diger-gider",
    name: "Diğer Gider",
    icon: "circle-ellipsis",
    color: "#64748B",
    kind: "EXPENSE",
    rules: [],
  },
  {
    key: "maas",
    name: "Maaş",
    icon: "wallet",
    color: "#059669",
    kind: "INCOME",
    rules: ["maaş", "maas", "bordro", "ücret"],
  },
  {
    key: "ek-gelir",
    name: "Ek Gelir",
    icon: "trending-up",
    color: "#16A34A",
    kind: "INCOME",
    rules: ["ek gelir", "freelance", "danışmanlık", "prim"],
  },
  {
    key: "yatirim",
    name: "Faiz / Yatırım",
    icon: "line-chart",
    color: "#15803D",
    kind: "INCOME",
    rules: ["faiz", "temettü", "temettu", "kar payı", "yatırım", "getiri"],
  },
  {
    key: "iade",
    name: "İade",
    icon: "undo-2",
    color: "#22C55E",
    kind: "INCOME",
    rules: ["iade", "geri ödeme", "refund"],
  },
  {
    key: "diger-gelir",
    name: "Diğer Gelir",
    icon: "circle-plus",
    color: "#65A30D",
    kind: "INCOME",
    rules: [],
  },
];

// Claude'un categoryHint için seçebileceği kategori anahtarları (enum drift'e karşı).
export const SEED_CATEGORY_KEYS = SEED_CATEGORIES.map((c) => c.key);

export const SEED_ACCOUNTS: {
  bankName: string;
  type: "CHECKING" | "CREDIT_CARD" | "SAVINGS" | "CASH" | "OTHER";
  label: string;
}[] = [
  { bankName: "Nakit", type: "CASH", label: "Nakit" },
];
