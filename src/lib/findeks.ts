// Findeks tarzı tahmini kredi sağlığı skoru ve kural tabanlı tavsiyeler.
// ÖNEMLİ: Bu resmî bir Findeks skoru DEĞİLDİR. Findeks'in açık API'si yoktur.
// Buradaki skor, harcama davranışına dayalı bir TAHMİNDİR.

export type FindeksInput = {
  months: { income: number; expense: number }[];
  billsTotal: number;
  billsPaid: number;
};

export type FindeksFactor = {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number;
  detail: string;
};

export type FindeksAdvice = {
  title: string;
  body: string;
  severity: "high" | "medium" | "low";
};

export type FindeksResult = {
  estimatedScore: number; // 1-1900 (Findeks ölçeği taklidi)
  healthScore: number; // 0-100
  band: string;
  factors: FindeksFactor[];
  advice: FindeksAdvice[];
};

function mean(arr: number[]): number {
  return arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;
}

function stdev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((v) => (v - m) ** 2)));
}

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, v));
}

export function computeFindeks(input: FindeksInput): FindeksResult {
  const incomes = input.months.map((m) => m.income);
  const expenses = input.months.map((m) => m.expense);
  const avgIncome = mean(incomes);
  const avgExpense = mean(expenses);

  // 1) Tasarruf oranı
  const savingsRate = avgIncome > 0 ? (avgIncome - avgExpense) / avgIncome : 0;
  const savingsScore = clamp(50 + savingsRate * 250);

  // 2) Gider/gelir dengesi
  const expenseRatio = avgIncome > 0 ? avgExpense / avgIncome : 1.2;
  const balanceScore = clamp(140 - expenseRatio * 100);

  // 3) Harcama istikrarı (düşük oynaklık iyi)
  const volatility = avgExpense > 0 ? stdev(expenses) / avgExpense : 0.5;
  const stabilityScore = clamp(100 - volatility * 160);

  // 4) Gelir istikrarı
  const incomeVol = avgIncome > 0 ? stdev(incomes) / avgIncome : 0.5;
  const incomeStabilityScore = clamp(100 - incomeVol * 150);

  // 5) Fatura ödeme düzenliliği
  const punctuality =
    input.billsTotal > 0 ? input.billsPaid / input.billsTotal : 0.7;
  const punctualityScore = clamp(punctuality * 100);

  const factors: FindeksFactor[] = [
    {
      key: "savings",
      label: "Tasarruf oranı",
      score: Math.round(savingsScore),
      weight: 0.3,
      detail: `Gelirinin ortalama %${Math.round(savingsRate * 100)}'unu elinde tutuyorsun.`,
    },
    {
      key: "balance",
      label: "Gider / gelir dengesi",
      score: Math.round(balanceScore),
      weight: 0.25,
      detail: `Giderin gelirinin %${Math.round(expenseRatio * 100)}'u kadar.`,
    },
    {
      key: "stability",
      label: "Harcama istikrarı",
      score: Math.round(stabilityScore),
      weight: 0.2,
      detail:
        volatility < 0.25
          ? "Harcamaların aydan aya dengeli."
          : "Harcamaların aylara göre dalgalı.",
    },
    {
      key: "income",
      label: "Gelir istikrarı",
      score: Math.round(incomeStabilityScore),
      weight: 0.15,
      detail:
        incomeVol < 0.2
          ? "Gelirin düzenli görünüyor."
          : "Gelirinde dalgalanma var.",
    },
    {
      key: "punctuality",
      label: "Fatura ödeme düzeni",
      score: Math.round(punctualityScore),
      weight: 0.1,
      detail:
        input.billsTotal > 0
          ? `${input.billsPaid}/${input.billsTotal} fatura ödendi olarak işaretli.`
          : "Henüz fatura takibi yok — ajandadan fatura ekleyebilirsin.",
    },
  ];

  const healthScore = Math.round(
    factors.reduce((s, f) => s + f.score * f.weight, 0),
  );
  const estimatedScore = Math.round(500 + (healthScore / 100) * 1400);

  const band =
    healthScore >= 80
      ? "Çok iyi"
      : healthScore >= 65
        ? "İyi"
        : healthScore >= 45
          ? "Orta"
          : "Geliştirilmeli";

  // Kural tabanlı tavsiyeler
  const advice: FindeksAdvice[] = [];

  if (savingsRate < 0.1) {
    advice.push({
      title: "Tasarruf oranını yükselt",
      body: "Gelirinin en az %15-20'sini biriktirmeyi hedefle. Önce sabit bir tutarı ay başında ayır, kalanla harcamaya çalış.",
      severity: "high",
    });
  } else if (savingsRate < 0.2) {
    advice.push({
      title: "Tasarrufunu bir adım ileri taşı",
      body: "İyi gidiyorsun. Tasarruf oranını %20'nin üzerine çıkarmak kredi sağlığını belirgin güçlendirir.",
      severity: "medium",
    });
  }

  if (expenseRatio > 0.9) {
    advice.push({
      title: "Giderlerini gelirinin altına çek",
      body: "Harcamaların gelirine çok yakın. En büyük 2-3 gider kalemini gözden geçir; küçük ama düzenli kesintiler büyük fark yaratır.",
      severity: "high",
    });
  }

  if (volatility > 0.35) {
    advice.push({
      title: "Harcamalarını dengele",
      body: "Bazı aylar çok yüksek harcıyorsun. Büyük alışverişleri aylara yayarak dalgalanmayı azaltabilirsin.",
      severity: "medium",
    });
  }

  if (punctuality < 0.8 && input.billsTotal > 0) {
    advice.push({
      title: "Faturalarını zamanında öde",
      body: "Gecikmeyen ödemeler kredi skorunun en güçlü belirleyicisidir. Ajandaya fatura hatırlatmaları ekleyip ödedikçe işaretle.",
      severity: "high",
    });
  }

  if (input.billsTotal === 0) {
    advice.push({
      title: "Fatura takibi başlat",
      body: "Ajandadan düzenli faturalarını (elektrik, kredi kartı, abonelik) ekle. Ödeme düzenin skora olumlu yansır.",
      severity: "low",
    });
  }

  advice.push({
    title: "Kredi kartı kullanım oranını düşük tut",
    body: "Kart limitinin %30'undan fazlasını kullanmamaya çalış. Düşük kullanım oranı Findeks skorunu doğrudan iyileştirir.",
    severity: "low",
  });

  return { estimatedScore, healthScore, band, factors, advice };
}
