// FinOptima asistan motoru (bulut tier) — kullanıcının finansal sorularını eldeki
// verilerle yanıtlar VE serbest metinden yapısal işlem önerileri çıkarır.
// creditCoach/extract ile aynı kalıp: messages.parse + zodOutputFormat.
// YALNIZCA sunucuda çağrılır (server action). API anahtarı client'a asla sızmaz.

import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CHAT_MODEL, AI_DEMO } from "@/lib/ai/client";
import type {
  AssistantMessage,
  AssistantResult,
} from "@/lib/assistant-types";

// Asistanın karar verirken kullandığı bağlam (sunucuda toplanır).
export type AssistantContext = {
  todayISO: string; // yyyy-mm-dd
  userName: string;
  aiIdentity: string | null;
  finance: {
    balance: number;
    monthIncome: number;
    monthExpense: number;
    monthNet: number;
  };
  categories: { name: string; kind: "INCOME" | "EXPENSE" }[];
  accounts: string[];
  recent: {
    date: string;
    description: string;
    amount: number;
    kind: string;
    category: string | null;
  }[];
};

const actionSchema = z.object({
  type: z.literal("transaction"),
  kind: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive(),
  description: z.string(),
  category: z.string().nullable(),
  date: z.string(), // yyyy-mm-dd
  note: z.string().nullable(),
});

const assistantSchema = z.object({
  reply: z.string(),
  actions: z.array(actionSchema),
  navigate: z.string().nullable(),
});

const ROUTES =
  "/dashboard (Panel/özet), /transactions (İşlemler listesi), /add (Harcama Ekle formu), /findeks (Kredi notu), /borclar (Borçlar), /calendar (Takvim), /import (Banka dökümü/ekstre yükle), /receipts (Fişler), /settings?tab=appearance (Tema/renk), /settings?tab=categories (Kategoriler), /settings?tab=accounts (Hesaplar & kartlar), /profil (Profil)";

function buildSystem(ctx: AssistantContext): string {
  const incomeCats =
    ctx.categories
      .filter((c) => c.kind === "INCOME")
      .map((c) => c.name)
      .join(", ") || "(yok)";
  const expenseCats =
    ctx.categories
      .filter((c) => c.kind === "EXPENSE")
      .map((c) => c.name)
      .join(", ") || "(yok)";
  const recent = ctx.recent.length
    ? ctx.recent
        .map(
          (r) =>
            `${r.date} · ${r.kind === "INCOME" ? "+" : "-"}${r.amount} ₺ · ${r.description}${
              r.category ? ` [${r.category}]` : ""
            }`,
        )
        .join("\n")
    : "(kayıtlı işlem yok)";

  return `Sen FinOptima adlı Türk kişisel finans uygulamasının içindeki yardımcı asistansın. Kullanıcıyla TÜRKÇE, kısa, net ve samimi konuş. İki görevin var:
(1) Kullanıcının finansal sorularını AŞAĞIDAKİ verilerle yanıtlamak.
(2) Kullanıcı bir harcama/gelir anlatınca bunu YAPISAL İŞLEM olarak önermek — kullanıcı onaylayınca sisteme eklenecek.

BUGÜN: ${ctx.todayISO}
KULLANICI: ${ctx.userName}${ctx.aiIdentity ? `\nKULLANICI PROFİLİ (kişiselleştirme için): ${ctx.aiIdentity}` : ""}

FİNANSAL DURUM:
- Tahmini bakiye: ${ctx.finance.balance} ₺
- Bu ay: gelir ${ctx.finance.monthIncome} ₺, gider ${ctx.finance.monthExpense} ₺, net ${ctx.finance.monthNet} ₺
GELİR KATEGORİLERİ: ${incomeCats}
GİDER KATEGORİLERİ: ${expenseCats}
HESAPLAR: ${ctx.accounts.join(", ") || "(yok)"}
SON İŞLEMLER (en yeni önce):
${recent}

İŞLEM ÖNERME KURALLARI:
- "markete 350 harcadım", "kedimi veterinere götürdüm 500 tl", "maaş 45000 yattı", "kuaföre 600 verdim" gibi ifadelerde actions dizisine işlem ekle.
- amount POZİTİF sayı. kind: harcama için EXPENSE, gelen para için INCOME.
- description kısa ve insancıl olsun ("Veteriner", "Market", "Maaş", "Kuaför").
- category: YUKARIDAKİ ilgili (gelir/gider) kategori adlarından EN UYGUN olanı AYNEN yaz; uygun kategori yoksa null. Uydurma isim yazma.
- date: aksi söylenmedikçe bugün (${ctx.todayISO}). "dün", "önceki gün", "geçen cuma", "3 gün önce" gibi ifadeleri bugüne göre çöz (yyyy-mm-dd).
- Bir mesajda birden çok harcama varsa ("markete 200 benzine 300") HER BİRİ için ayrı action üret.
- Tutar ya da ne olduğu belirsizse action ÜRETME; reply'de TEK bir kısa netleştirme sorusu sor.
- ÇOK işlemli bir belgeden söz ediyorsa (kredi kartı EKSTRESİ, banka DÖKÜMÜ — tek harcama değil), action üretme; reply'de "Banka Dökümü" ekranından yükleyebileceğini söyle, navigate="/import" ver.
- Sadece sohbet/soru ise actions boş dizi olsun.

navigate: Kullanıcıyı bir ekrana yönlendirmek faydalıysa o yolu yaz, değilse null. Geçerli yollar: ${ROUTES}

GENEL: Verini uydurma. Elinde olmayan geçmiş/detay veri sorulursa "şu an panelimde yok, İşlemler sayfasından görebilirsin" de ve navigate="/transactions" ver. Finansal tavsiye verirken temkinli ol; yatırım tavsiyesi verme.`;
}

// ---------------------------------------------------------------------------
// Demo modu (AI_DEMO=true) — API çağrılmadan yanıt üretir.
// creditCoach.demoPlan() / extract.demoExtract() ile aynı desen: uydurma metin
// değil, kullanıcının GERÇEK verisinden (bakiye, ay içi gelir/gider, kategoriler,
// son işlemler) türetilen senaryolu yanıtlar. "[DEMO]" etiketi YOK — canlı API
// erişilemezse akış görünüşte hiç bozulmadan devam eder.
// ---------------------------------------------------------------------------

const tl = (n: number) => {
  const v = Math.round(n * 100) / 100;
  return `${v.toLocaleString("tr-TR", {
    maximumFractionDigits: Number.isInteger(v) ? 0 : 2,
  })} ₺`;
};

// Serbest metinden tutar çöz: "150 TL", "1.250,50", "2500" → sayı.
function parseAmount(text: string): number | null {
  const num = "\\d{1,3}(?:\\.\\d{3})+(?:,\\d+)?|\\d+(?:[.,]\\d+)?";
  const m =
    text.match(new RegExp(`(${num})\\s*(?:tl|try|₺|lira)`, "i")) ??
    text.match(new RegExp(`(${num})`));
  if (!m) return null;
  let raw = m[1];
  if (raw.includes(".") && raw.includes(",")) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if (raw.includes(",")) {
    raw = raw.replace(",", ".");
  } else if (/^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
    raw = raw.replace(/\./g, "");
  }
  const v = Number(raw);
  return Number.isFinite(v) && v > 0 ? v : null;
}

// Serbest metin → işlem şablonu. Kategori adı KULLANICININ kendi kategorilerinden
// seçilir (hints ile eşleşen ilki), bulunamazsa null — gerçek akışla birebir aynı.
const DEMO_TX_RULES: {
  test: RegExp;
  description: string;
  kind: "INCOME" | "EXPENSE";
  hints: string[];
}[] = [
  { test: /maaş|bordro|ikramiye|prim/, description: "Maaş", kind: "INCOME", hints: ["maaş", "gelir"] },
  { test: /market|migros|bim|a101|şok|carrefour|bakkal/, description: "Market", kind: "EXPENSE", hints: ["market", "gıda", "alışveriş"] },
  { test: /öğle yemeğ|akşam yemeğ|yemek|restoran|kahve|starbucks|yemeksepeti|getir|lokanta|kafe/, description: "Yemek", kind: "EXPENSE", hints: ["yeme", "yemek", "gıda", "restoran"] },
  { test: /benzin|akaryakıt|mazot|motorin|shell|opet|petrol/, description: "Akaryakıt", kind: "EXPENSE", hints: ["akaryakıt", "yakıt", "ulaşım"] },
  { test: /taksi|uber|otobüs|metro|dolmuş|bilet|ulaşım/, description: "Ulaşım", kind: "EXPENSE", hints: ["ulaşım", "taksi"] },
  { test: /kira/, description: "Kira", kind: "EXPENSE", hints: ["kira", "konut"] },
  { test: /elektrik|su fatura|doğalgaz|internet|fatura/, description: "Fatura", kind: "EXPENSE", hints: ["fatura"] },
  { test: /netflix|spotify|abonelik|youtube|icloud/, description: "Abonelik", kind: "EXPENSE", hints: ["abonelik"] },
  { test: /eczane|doktor|hastane|ilaç|muayene/, description: "Sağlık", kind: "EXPENSE", hints: ["sağlık"] },
  { test: /veteriner|kedi|köpek|mama/, description: "Veteriner", kind: "EXPENSE", hints: ["evcil", "veteriner", "sağlık"] },
  { test: /kuaför|berber/, description: "Kuaför", kind: "EXPENSE", hints: ["kişisel", "bakım"] },
];

function pickCategory(
  ctx: AssistantContext,
  kind: "INCOME" | "EXPENSE",
  hints: string[],
): string | null {
  const pool = ctx.categories.filter((c) => c.kind === kind);
  for (const h of hints) {
    const hit = pool.find((c) => c.name.toLocaleLowerCase("tr").includes(h));
    if (hit) return hit.name;
  }
  return null;
}

// Son işlemlerden en çok harcanan kategoriler (demo özetini gerçek veriye bağlar).
function topExpenseCategories(ctx: AssistantContext): [string, number][] {
  const map = new Map<string, number>();
  for (const r of ctx.recent) {
    if (r.kind !== "EXPENSE") continue;
    const key = r.category ?? "Kategorisiz";
    map.set(key, (map.get(key) ?? 0) + Math.abs(r.amount));
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

const DEMO_NAV_RULES: { test: RegExp; route: string; reply: string }[] = [
  {
    test: /ekstre|döküm|banka dosya|csv|excel|pdf yükle/,
    route: "/import",
    reply:
      "Çok işlemli bir belgeyi buradan tek tek girmene gerek yok. “Banka Dökümü” ekranına ekstreni (PDF/Excel/CSV) yükle; satırları ayıklayıp kategorilere ben dağıtayım, sen sadece onayla.",
  },
  {
    test: /fiş|fatura fotoğraf|makbuz/,
    route: "/receipts",
    reply:
      "Fişin fotoğrafını “Fişler” ekranından yükleyebilirsin — tutarı, tarihi ve işyerini okuyup işlem olarak öneriyorum.",
  },
  {
    test: /borç|kredi kartı borc|taksit/,
    route: "/borclar",
    reply:
      "Borçlarını “Borçlar” ekranında faiz oranına göre sıralı görebilirsin. En yüksek faizli borcu önce kapatmak toplam maliyetini en hızlı düşüren hamle.",
  },
  {
    test: /kart(ım|larım)?\b|hesap ekle|banka ekle/,
    route: "/settings?tab=accounts",
    reply:
      "Kartlarını ve banka hesaplarını Ayarlar → Hesaplar & Kartlar bölümünden yönetebilirsin.",
  },
  {
    test: /tema|renk|karanlık mod|görünüm/,
    route: "/settings?tab=appearance",
    reply: "Temayı ve renk düzenini Ayarlar → Görünüm bölümünden değiştirebilirsin.",
  },
  {
    test: /kategori/,
    route: "/settings?tab=categories",
    reply:
      "Kategorilerini Ayarlar → Kategoriler bölümünden ekleyip düzenleyebilirsin; sonraki işlemlerde önerilerimi ona göre yaparım.",
  },
  {
    test: /takvim|hatırlat|ödeme günü|vade/,
    route: "/calendar",
    reply:
      "Ödeme günlerini Takvim ekranından takip edebilirsin; yaklaşan fatura ve taksitler orada işaretli.",
  },
  {
    test: /işlem|geçmiş|liste|harcamalarımı gör/,
    route: "/transactions",
    reply:
      "Tüm işlemlerini İşlemler ekranından tarih ve kategoriye göre süzerek inceleyebilirsin.",
  },
];

function demoAssistant(
  userText: string,
  ctx: AssistantContext,
): AssistantResult {
  const q = userText.toLocaleLowerCase("tr");
  const f = ctx.finance;
  const firstName = (ctx.userName || "Kullanıcı").split(" ")[0];
  // Soru kalıpları — "kedimi veterinere götürdüm 500 tl" gibi cümleleri yanlışlıkla
  // soru saymamak için soru EKİ (mi/mı) aranmaz, yalnızca soru sözcükleri.
  const isQuestion = /\?|ne kadar|nasıl|neden|hangi|nedir|kaç /.test(q);

  // 1) Harcama özeti / durum sorusu — gerçek aylık rakamlarla.
  if (
    /ne kadar harca|ne kadar gitti|bu ay|özet|durum|bakiye|param var|ne kadar param|gelir gider/.test(
      q,
    )
  ) {
    const top = topExpenseCategories(ctx);
    const breakdown = top.length
      ? ` En çok ${top
          .map(([name, sum]) => `${name} (${tl(sum)})`)
          .join(", ")} kalemlerine gitmiş.`
      : "";
    const verdict =
      f.monthNet >= 0
        ? `Ay net ${tl(f.monthNet)} artıda — bu tempoyu korursan sorun yok.`
        : `Ay net ${tl(Math.abs(f.monthNet))} ekside; harcama tarafında bir kalemi kısman gerekiyor.`;
    return {
      reply: `${firstName}, bu ay ${tl(f.monthExpense)} harcadın, ${tl(f.monthIncome)} gelirin oldu.${breakdown} ${verdict} Tahmini bakiyen ${tl(f.balance)}. Detayına bakmak istersen İşlemler ekranında kalem kalem duruyor.`,
      actions: [],
      navigate: "/transactions",
    };
  }

  // 2) Kredi notu / Findeks sorusu.
  if (/kredi not|findeks|kredi sağlığ|skor|not(um|umu)? yüksel/.test(q)) {
    const savingRate =
      f.monthIncome > 0 ? Math.round((f.monthNet / f.monthIncome) * 100) : null;
    const rateLine =
      savingRate === null
        ? "Gelir tarafında henüz kayıt yok, o yüzden tasarruf oranını ölçemiyorum."
        : savingRate >= 15
          ? `Bu ay gelirinin %${savingRate}'ini elinde tutmuşsun — bu iyi bir seviye, koru.`
          : `Bu ay gelirinin yalnızca %${savingRate}'i elinde kalmış; %15-20 bandına çıkarmak skoru en çok iten kaldıraçlardan biri.`;
    return {
      reply: `Kredi sağlığını en hızlı yükselten üç şey şunlar: (1) Faturaları hiç gecikmeden ödemek — gecikme skoru en sert vuran kalem. (2) Kredi kartı kullanım oranını limitin %30'unun altında tutmak. (3) En yüksek faizli borcu önce kapatıp toplam borcu küçültmek. ${rateLine} Kredi Notu ekranında hangi faktörün seni aşağı çektiğini tek tek görebilirsin. Not: bu skor resmî bir Findeks notu değil, harcama davranışına dayalı bir tahmin.`,
      actions: [],
      navigate: "/findeks",
    };
  }

  // 3) Doğal dilden işlem girişi ("öğle yemeği 150 TL").
  const amount = parseAmount(userText);
  const rule = DEMO_TX_RULES.find((r) => r.test.test(q));
  const spendVerb =
    /harcadım|verdim|ödedim|aldım|çektim|yattı|geldi|kazandım/.test(q);
  if (amount && (rule || spendVerb) && !isQuestion) {
    const kind: "INCOME" | "EXPENSE" =
      rule?.kind ?? (/yattı|geldi|kazandım/.test(q) ? "INCOME" : "EXPENSE");
    const description = rule?.description ?? (kind === "INCOME" ? "Gelir" : "Harcama");
    const category = pickCategory(ctx, kind, rule?.hints ?? []);
    return {
      reply: `${description} · ${tl(amount)} olarak kaydedeyim mi?${
        category ? ` Kategoriyi “${category}” seçtim` : " Uygun bir kategori bulamadım, kategorisiz kaydedeceğim"
      }, tarih bugün. Onayla, işlemlerine ekleyeyim.`,
      actions: [
        {
          type: "transaction",
          kind,
          amount,
          description,
          category,
          date: ctx.todayISO,
          note: null,
        },
      ],
      navigate: null,
    };
  }

  // 4) Yönlendirme gerektiren sorular.
  const nav = DEMO_NAV_RULES.find((r) => r.test.test(q));
  if (nav) {
    return { reply: nav.reply, actions: [], navigate: nav.route };
  }

  // 5) Genel karşılama / yönlendirme.
  return {
    reply: `Buradayım ${firstName}. Şu an tahmini bakiyen ${tl(f.balance)}, bu ayki gideri ${tl(f.monthExpense)} olarak görüyorum. Bana “bu ay ne kadar harcadım”, “kredi notumu nasıl yükseltirim” diye sorabilir ya da “öğle yemeği 150 TL” gibi yazıp harcamanı doğrudan kaydettirebilirsin.`,
    actions: [],
    navigate: null,
  };
}

export async function runAssistant(
  history: AssistantMessage[],
  userText: string,
  ctx: AssistantContext,
): Promise<AssistantResult> {
  // Demo kısa devresi: provider (Anthropic / Foundry) fark etmeksizin ÖNCE çalışır.
  if (AI_DEMO) return demoAssistant(userText, ctx);

  const client = getAnthropic();
  const messages = [
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userText },
  ];

  const message = await client.messages.parse({
    model: CHAT_MODEL,
    max_tokens: 1500,
    system: buildSystem(ctx),
    output_config: { format: zodOutputFormat(assistantSchema) },
    messages,
  });

  const out = message.parsed_output;
  if (!out) {
    return {
      reply: "Bir sorun oldu, tekrar dener misin?",
      actions: [],
      navigate: null,
    };
  }

  return {
    reply: out.reply,
    actions: out.actions.map((a) => ({
      type: "transaction" as const,
      kind: a.kind,
      amount: Math.abs(a.amount),
      description: a.description.slice(0, 200),
      category: a.category,
      date: a.date,
      note: a.note,
    })),
    navigate: out.navigate,
  };
}
