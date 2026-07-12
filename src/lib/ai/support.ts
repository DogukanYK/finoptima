// Destek Asistanı (AI ön-yanıt) motoru — kullanıcının destek sorusunu KENDİ
// verisiyle (kendi hesabı — izin gerekmez) yanıtlamayı dener; çözemeyeceği
// konularda insana eskalasyon önerir. assistant.ts ile aynı kalıp:
// messages.parse + zodOutputFormat, AI_DEMO kısa devresi, CHAT_MODEL.
// Ayrıca admin tarafı için "yanıt taslağı öner" üretici içerir.

import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CHAT_MODEL, AI_DEMO } from "@/lib/ai/client";
import type { AssistantMessage } from "@/lib/assistant-types";

// Ticket kategorileriyle birebir (Prisma SupportTicketCategory).
export const SUPPORT_CATEGORIES = [
  "ACCOUNT",
  "TRANSACTIONS",
  "IMPORT",
  "FINDEKS",
  "DEBTS",
  "SECURITY",
  "BUG",
  "OTHER",
] as const;

const supportSchema = z.object({
  reply: z.string(),
  resolved: z.boolean(), // AI sorunu çözdüğüne inanıyor
  escalate: z.boolean(), // insana aktarılmalı
  suggestedCategory: z.enum(SUPPORT_CATEGORIES).nullable(),
  suggestedSubject: z.string().nullable(),
});

export type SupportAIResult = z.infer<typeof supportSchema>;

// Destek bağlamı — kullanıcının kendi verisi + açık talepleri.
export type SupportContext = {
  todayISO: string;
  userName: string;
  finance: {
    balance: number;
    monthIncome: number;
    monthExpense: number;
    monthNet: number;
  };
  categories: string[];
  accounts: string[];
  recent: { date: string; description: string; amount: number; kind: string }[];
  openTickets: { shortId: number; subject: string; status: string }[];
  twoFactorEnabled: boolean;
};

const ROUTES =
  "/dashboard (Panel), /transactions (İşlemler), /add (Harcama Ekle), /findeks (Kredi notu), /borclar (Borçlar), /calendar (Takvim), /import (Banka dökümü yükleme), /receipts (Fişler), /settings?tab=appearance (Tema), /settings?tab=categories (Kategoriler), /settings?tab=accounts (Hesaplar), /settings?tab=security (Güvenlik/2FA), /profil (Profil), /destek (Destek merkezi)";

function buildSystem(ctx: SupportContext): string {
  const recent = ctx.recent.length
    ? ctx.recent
        .map((r) => `${r.date} · ${r.kind === "INCOME" ? "+" : "-"}${r.amount} ₺ · ${r.description}`)
        .join("\n")
    : "(kayıtlı işlem yok)";
  const tickets = ctx.openTickets.length
    ? ctx.openTickets.map((t) => `#${t.shortId} · ${t.subject} · ${t.status}`).join("\n")
    : "(açık talep yok)";

  return `Sen FinOptima'nın DESTEK ASİSTANI'sın. Kullanıcının destek sorularını TÜRKÇE, kibar, net ve çözüm odaklı yanıtla. Amacın sorunu İLK TEMASTA çözmek; çözemeyeceğin konularda insan desteğe aktarmayı önermek.

BUGÜN: ${ctx.todayISO}
KULLANICI: ${ctx.userName} · 2FA: ${ctx.twoFactorEnabled ? "açık" : "kapalı"}

KULLANICININ VERİSİ (kendi hesabı — bununla soruları doğrudan yanıtlayabilirsin):
- Bakiye: ${ctx.finance.balance} ₺ · Bu ay: gelir ${ctx.finance.monthIncome} ₺, gider ${ctx.finance.monthExpense} ₺, net ${ctx.finance.monthNet} ₺
- Kategorileri: ${ctx.categories.join(", ") || "(yok)"}
- Hesapları: ${ctx.accounts.join(", ") || "(yok)"}
SON İŞLEMLER:
${recent}
AÇIK DESTEK TALEPLERİ:
${tickets}

UYGULAMA BİLGİSİ (yol tarifi için): ${ROUTES}
Özellikler: tahmini Findeks skoru + AI koçluk; banka ekstresi/dekont AI okuma (/import); fiş fotoğrafı okuma (/receipts); AI asistanla doğal dilden işlem girme; borç takibi; takvim/fatura hatırlatma; tema (Ayarlar>Görünüm); 2FA (Ayarlar>Güvenlik); iOS uygulaması.

KARAR KURALLARI:
- resolved=true: Soruyu tam yanıtladın ve kullanıcının başka aksiyona ihtiyacı yok.
- escalate=true ŞU DURUMLARDA (reply'de de kibarca insana aktarmayı öner):
  * Güvenlik: hesap ele geçirilmesi şüphesi, 2FA kilidi/cihaz kaybı, şifre sıfırlama talebi
  * Veri silme / hesap kapatma talepleri (KVKK süreci — insan onayı şart)
  * Hata/bug bildirimi (yanlış hesaplama, çökme, görünmeyen veri)
  * Ödeme/fatura itirazı ya da senin verinle DOĞRULAYAMADIĞIN her iddia
  * Kullanıcı açıkça insan istiyor ya da öfkeli/mağdur
- escalate=true iken suggestedSubject (kısa TR başlık) ve suggestedCategory doldur.
- Skor/işlem verisi hakkında yukarıdaki veriyle yanıt verebilirsin; ASLA veri uydurma.
- Şifre, tam kart numarası, kimlik numarası gibi bilgileri ASLA isteme.`;
}

export async function runSupportAssistant(
  history: AssistantMessage[],
  userText: string,
  ctx: SupportContext,
): Promise<SupportAIResult> {
  if (AI_DEMO) {
    return {
      reply: "[DEMO] Destek asistanı demo modunda. Gerçek yanıt için ANTHROPIC_API_KEY gerekli.",
      resolved: false,
      escalate: false,
      suggestedCategory: null,
      suggestedSubject: null,
    };
  }

  const client = getAnthropic();
  const messages = [
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userText },
  ];

  const message = await client.messages.parse({
    model: CHAT_MODEL,
    max_tokens: 1200,
    system: buildSystem(ctx),
    output_config: { format: zodOutputFormat(supportSchema) },
    messages,
  });

  const out = message.parsed_output;
  if (!out) {
    return {
      reply: "Şu an yanıt veremedim — istersen talebini insan desteğe iletebilirim.",
      resolved: false,
      escalate: true,
      suggestedCategory: "OTHER",
      suggestedSubject: "Destek talebi",
    };
  }
  return out;
}

/* ---------- Admin: yanıt taslağı önerici ---------- */

const draftSchema = z.object({ draft: z.string() });

export type DraftContext = {
  ticketSubject: string;
  ticketCategory: string;
  customerName: string;
  thread: { author: string; body: string }[]; // internal notlar HARİÇ verilmez
  tier1Summary: string; // maskeli özet metni
  tier2Summary: string | null; // yalnız aktif consent varsa dolu
};

export async function runDraftSuggestion(ctx: DraftContext): Promise<string> {
  if (AI_DEMO) return "[DEMO] Yanıt taslağı örneği.";

  const client = getAnthropic();
  const thread = ctx.thread
    .map((m) => `${m.author}: ${m.body}`)
    .join("\n---\n")
    .slice(0, 12000);

  const system = `Sen FinOptima destek ekibi için YANIT TASLAĞI yazan bir yardımcısın. Aşağıdaki destek talebine, müşteriye gönderilmeye hazır, TÜRKÇE, kibar, net ve çözüm odaklı TEK bir yanıt taslağı yaz. Kısa tut (en fazla ~150 kelime). Veri uydurma; elindeki bağlam yetmiyorsa taslakta hangi bilginin isteneceğini kibarca sor. İmza ekleme.

TALEP: ${ctx.ticketSubject} (kategori: ${ctx.ticketCategory}) · Müşteri: ${ctx.customerName}
MÜŞTERİ ÖZETİ (maskeli): ${ctx.tier1Summary}
${ctx.tier2Summary ? `İZİNLİ DETAY (müşteri onayıyla): ${ctx.tier2Summary}` : "(Detay verisine izin yok — genel yanıt ver.)"}

YAZIŞMA:
${thread}`;

  const message = await client.messages.parse({
    model: CHAT_MODEL,
    max_tokens: 800,
    system,
    output_config: { format: zodOutputFormat(draftSchema) },
    messages: [{ role: "user", content: "Yanıt taslağını üret." }],
  });

  return message.parsed_output?.draft ?? "";
}
