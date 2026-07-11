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

export async function runAssistant(
  history: AssistantMessage[],
  userText: string,
  ctx: AssistantContext,
): Promise<AssistantResult> {
  if (AI_DEMO) {
    return {
      reply:
        "[DEMO] Asistan demo modunda çalışıyor. Gerçek yanıtlar ve işlem girişi için ANTHROPIC_API_KEY gerekli.",
      actions: [],
      navigate: null,
    };
  }

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
