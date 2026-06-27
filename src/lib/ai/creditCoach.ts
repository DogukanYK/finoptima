// Kredi sağlığı koçu — deterministik motorun (computeFindeks) ürettiği SAYILARI
// Claude'a verip kişiselleştirilmiş, önceliklendirilmiş bir aylık eylem planına çevirir.
//
// ALTIN KURAL: Skoru/matematiği LLM hesaplamaz. Sayılar `findeks.ts`/`debt.ts`'ten gelir;
// Claude sadece bu sayıları YORUMLAR, önceliklendirir ve Türkçe anlatır.

import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic, CREDIT_COACH_MODEL, AI_DEMO } from "@/lib/ai/client";
import type { FindeksResult } from "@/lib/findeks";
import type { PlainDebt } from "@/lib/queries";

// --- Yapısal çıktı şeması (Claude bu şekle uymak zorunda) ---
export const coachStepSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  title: z.string(), // kısa başlık
  why: z.string(), // neden önemli — kullanıcının gerçek sayılarına dayalı
  action: z.string(), // bu ay atılacak somut adım
  impact: z.string(), // beklenen etki (nitel: "yüksek etki" gibi; sayı uydurmaz)
});

export const coachPlanSchema = z.object({
  summary: z.string(), // 1-2 cümlelik dürüst genel durum
  steps: z.array(coachStepSchema), // önceliklendirilmiş eylem listesi
});

export type CoachStep = z.infer<typeof coachStepSchema>;
export type CoachPlan = z.infer<typeof coachPlanSchema>;

const SYSTEM_PROMPT = `Sen "Akça"nın kredi sağlığı koçusun. Görevin, kullanıcının finansal verilerine bakarak kredi notunu (kredi sağlığını) yükseltmesi için kişiselleştirilmiş, somut ve önceliklendirilmiş bir aylık eylem planı üretmek.

KURALLAR (kesinlikle uy):
1. SADECE sana verilen sayıları kullan. Yeni rakam, yeni skor, yeni bakiye UYDURMA. Hesaplama gerekiyorsa yalnızca verilen sayılarla yap.
2. Bu skor resmî bir FINDEKS notu DEĞİL; harcama davranışına dayalı bir TAHMİN. "Findeks notunu garanti ederiz / kesin yükseltiriz" gibi vaatler ASLA verme. "iyileştirmeye yardımcı olur", "olumlu yansır" gibi dürüst dil kullan.
3. impact alanında kesin puan vaadi verme; "yüksek etki / orta etki / düşük etki" gibi nitel ifadeler kullan.
4. En yüksek faizli borç, kredi kartı kullanım oranı, faturaların zamanında ödenmesi ve tasarruf oranı kredi sağlığının en güçlü kaldıraçlarıdır — verilere göre hangileri öne çıkıyorsa onları önceliklendir.
5. Adımlar somut ve uygulanabilir olsun ("X kartının borcunu önce kapat", "Y faturasını zamanında öde"). Genel geçer öğüt verme.
6. En fazla 5 adım. En kritik olan en üstte (priority: high).
7. Dil: sıcak, sade, anlaşılır Türkçe. Jargon yok. Kullanıcıyla "sen" diliyle konuş.`;

// Demo: gerçek AI yokken, kullanıcının GERÇEK verisinden (skor faktörleri +
// borçlar) duruma göre değişen, detaylı bir plan üretir — gerçek AI çıktısını
// taklit eder. Farklı finansal durumlar farklı plan üretir.
function demoPlan(input: {
  findeks: FindeksResult;
  debts: PlainDebt[];
}): CoachPlan {
  const { findeks, debts } = input;
  const tl = (n: number) => `${Math.round(n).toLocaleString("tr-TR")} ₺`;
  const score = (k: string) =>
    findeks.factors.find((x) => x.key === k)?.score ?? 50;
  const active = debts
    .filter((d) => d.balance > 0)
    .sort((a, b) => b.apr - a.apr);
  const top = active[0];
  const totalDebt = active.reduce((s, d) => s + d.balance, 0);
  const health = findeks.healthScore;
  const steps: CoachStep[] = [];

  if (top) {
    steps.push({
      priority: "high",
      title: `Önce ${top.name} borcunu hedefle`,
      why: `${top.name} aylık %${top.apr} ile en yüksek faizli borcun (${tl(top.balance)}). Bu borç durdukça faiz maliyetin büyüyor ve kredi sağlığını en çok bu aşağı çekiyor.`,
      action: `Bu ay nakit fazlanın büyük kısmını ${top.name}'a yönlendir; mümkünse asgarinin üstünde öde. Diğer borçlarda asgariyi aksatma.`,
      impact: "yüksek etki",
    });
  }

  if (score("savings") < 55) {
    steps.push({
      priority: active.length ? "medium" : "high",
      title: "Tasarruf oranını yükselt",
      why: `Tasarruf faktörün ${score("savings")}/100 — gelirinin yeterince azını elinde tutuyorsun; beklenmedik gideri yeni borçla karşılama riski yüksek.`,
      action: "Ay başında gelirinin ~%15-20'sini otomatik talimatla kenara ayır, kalanla harca.",
      impact: "orta etki",
    });
  }

  if (score("punctuality") < 80) {
    steps.push({
      priority: "high",
      title: "Faturaları zamanında öde",
      why: `Ödeme düzeni faktörün ${score("punctuality")}/100. Geciken ödemeler kredi skorunun en güçlü olumsuz belirleyicisidir.`,
      action: "Takvimden elektrik, kredi kartı ve abonelik faturalarına hatırlatma kur; ödedikçe işaretle.",
      impact: "yüksek etki",
    });
  }

  steps.push({
    priority: "medium",
    title: "Kart kullanım oranını %30 altında tut",
    why: "Kart limitinin %30'undan fazlasını kullanmak Findeks skorunu doğrudan aşağı çeker.",
    action: "Ekstre kesim gününden birkaç gün önce ara ödeme yaparak kullanım oranını düşür.",
    impact: "orta etki",
  });

  if (health >= 65 && active.length === 0) {
    steps.push({
      priority: "low",
      title: "Birikimini düzenli yatırıma yönlendir",
      why: "Borcun yok ve kredi sağlığın iyi; atıl nakit enflasyona karşı değer kaybediyor.",
      action: "Aylık sabit bir tutarı düzenli bir yatırım aracına yönlendir.",
      impact: "düşük etki",
    });
  }

  const summary = active.length
    ? `Kredi sağlığın "${findeks.band}" bandında (sağlık ${health}/100). En kritik nokta ${top ? `${top.name} (aylık %${top.apr})` : "borç yükün"}; toplam ${tl(totalDebt)} borç var. Adımlar bu ay etkiyi en çok artıracak sırayla dizildi.`
    : `Kredi sağlığın "${findeks.band}" bandında (sağlık ${health}/100) ve aktif borcun yok. Odak: tasarruf ve ödeme düzenini koruyup skoru daha da yukarı taşımak.`;

  return { summary, steps: steps.slice(0, 5) };
}

export async function generateCreditCoachPlan(input: {
  findeks: FindeksResult;
  debts: PlainDebt[];
}): Promise<CoachPlan> {
  if (AI_DEMO) return demoPlan(input);
  const { findeks, debts } = input;

  // Claude'a SADECE deterministik motorun ürettiği sayıları veriyoruz.
  // Kimlik bilgisi (isim, TC, adres) GÖNDERİLMEZ — KVKK + altın kural.
  const context = {
    tahminiSkor: findeks.estimatedScore,
    saglikSkoru: findeks.healthScore,
    bant: findeks.band,
    faktorler: findeks.factors.map((f) => ({
      ad: f.label,
      puan: f.score, // 0-100
      agirlik: f.weight,
      detay: f.detail,
    })),
    aktifBorclar: debts
      .filter((d) => d.balance > 0)
      .map((d) => ({
        ad: d.name,
        tur: d.kind === "CREDIT_CARD" ? "kredi kartı" : "kredi",
        bakiye: Math.round(d.balance),
        aylikFaizYuzde: d.apr,
        odemeGunu: d.dueDay,
      })),
  };

  const client = getAnthropic();
  const message = await client.messages.parse({
    model: CREDIT_COACH_MODEL,
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    output_config: { format: zodOutputFormat(coachPlanSchema) },
    messages: [
      {
        role: "user",
        content:
          "Aşağıda kullanıcının kredi sağlığı verileri var (deterministik motorla hesaplandı). " +
          "Bu sayılara dayanarak, bu ay kredi sağlığını yükseltmek için önceliklendirilmiş bir eylem planı üret:\n\n" +
          JSON.stringify(context, null, 2),
      },
    ],
  });

  const plan = message.parsed_output;
  if (!plan) {
    throw new Error("Plan üretilemedi (boş yanıt).");
  }
  return plan;
}
