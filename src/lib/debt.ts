// Borç / kredi analizi — kural tabanlı.
// apr alanı AYLIK faiz oranıdır (%). Gerçek AI'ya geçişte yalnızca bu modül değişir.

export type DebtLike = {
  id: string;
  name: string;
  kind: "CREDIT_CARD" | "LOAN";
  balance: number;
  apr: number; // aylık %
  dueDay: number | null;
};

export type DebtAnalysis = {
  scoreImpact: number; // tahmini kredi skoru etkisi (negatif puan)
  scoreImpactNote: string;
  sixMonthInterest: number; // ödeme yapılmazsa 6 aylık faiz yükü
  recommendedPayment: number; // strateji bütçesinden bu borca düşen aylık tutar
  monthsToPayoff: number; // -1 = mevcut ödemeyle kapanmaz
  microAction: string; // AI mikro-aksiyon önerisi
  payoffNote: string;
};

// Yüksek faizli borcun tahmini kredi skoru etkisi.
export function debtScoreImpact(debt: DebtLike): number {
  const apr = debt.apr;
  let base: number;
  if (apr >= 3) base = -40;
  else if (apr >= 2) base = -30;
  else if (apr >= 1.5) base = -20;
  else base = -10;
  // Kredi kartı kullanımı skoru kredilerden daha çok etkiler.
  if (debt.kind === "CREDIT_CARD" && debt.balance > 0) base -= 5;
  return base;
}

// Aylık borç bütçesi (nakit akışının borca ayrılan kısmı).
export function monthlyDebtBudget(
  monthlyCashFlow: number,
  allocDebt: number,
): number {
  return Math.max(0, Math.round((monthlyCashFlow * allocDebt) / 100));
}

// Borç bütçesini, faiz maliyeti ağırlığına (apr × bakiye) göre borçlara dağıtır.
export function distributeDebtBudget(
  debts: DebtLike[],
  budget: number,
): Map<string, number> {
  const result = new Map<string, number>();
  const active = debts.filter((d) => d.balance > 0);
  if (active.length === 0 || budget <= 0) {
    for (const d of debts) result.set(d.id, 0);
    return result;
  }
  const weights = active.map((d) => ({
    id: d.id,
    w: (d.apr / 100) * d.balance,
  }));
  const totalW = weights.reduce((s, x) => s + x.w, 0) || active.length;
  for (const d of debts) result.set(d.id, 0);
  for (const { id, w } of weights) {
    const share = totalW > 0 ? w / totalW : 1 / active.length;
    result.set(id, Math.round(budget * share));
  }
  return result;
}

// Verilen aylık ödemeyle borcun kaç ayda kapanacağını hesaplar (faiz dahil).
export function monthsToPayoff(
  balance: number,
  apr: number,
  monthlyPayment: number,
): number {
  if (balance <= 0) return 0;
  if (monthlyPayment <= 0) return -1;
  const monthlyInterest = balance * (apr / 100);
  // Ödeme aylık faizi karşılamıyorsa borç hiç kapanmaz.
  if (monthlyPayment <= monthlyInterest) return -1;
  let remaining = balance;
  let months = 0;
  while (remaining > 0 && months < 600) {
    remaining = remaining * (1 + apr / 100) - monthlyPayment;
    months++;
  }
  return months >= 600 ? -1 : months;
}

function microAction(debt: DebtLike): string {
  if (debt.kind === "CREDIT_CARD") {
    if (debt.apr >= 2.5) {
      return `Yüksek faizli bu kartı bir başka bankanın daha düşük faizli kartına bakiye transferi ile taşımayı değerlendir — aylık faiz yükün belirgin düşer.`;
    }
    return `Bu kartın asgari tutarın üzerinde düzenli ödemesini planla; kullanım oranını limitin %30'unun altında tut.`;
  }
  if (debt.apr >= 2) {
    return `Bu krediyi daha düşük faizli bir kredi ile yeniden yapılandırmak (refinansman) toplam maliyeti düşürebilir.`;
  }
  return `Kredinin vadesi uygunsa, ek ödeme yaparak anaparayı erkenden azaltmak faiz maliyetini düşürür.`;
}

export function analyzeDebt(
  debt: DebtLike,
  recommendedPayment: number,
): DebtAnalysis {
  const scoreImpact = debtScoreImpact(debt);
  const sixMonthInterest = Math.round(debt.balance * (debt.apr / 100) * 6);
  const payment = Math.max(0, Math.round(recommendedPayment));
  const months = monthsToPayoff(debt.balance, debt.apr, payment);

  let payoffNote: string;
  if (debt.balance <= 0) {
    payoffNote = "Bu borç kapanmış görünüyor. 🎉";
  } else if (months < 0) {
    payoffNote =
      "Önerilen aylık tutar bu borcun faizini karşılamıyor — borç azalmaz. Strateji dağılımında borç payını artır.";
  } else if (months <= 12) {
    payoffNote = `Harika — aylık ${payment.toLocaleString("tr-TR")} ₺ ayırarak yaklaşık ${months} ayda tamamen kapatabilirsin.`;
  } else if (months <= 24) {
    payoffNote = `Mevcut planla yaklaşık ${months} ayda kapanır. Borç payını biraz artırırsan süre kısalır.`;
  } else {
    payoffNote = `Bu borcun kapanması ${months} ay sürer. Daha agresif bir strateji ya da ek gelir kaynağı değerlendir.`;
  }

  const scoreImpactNote =
    scoreImpact <= -30
      ? "Yüksek faiz oranı ve bakiye, tahmini kredi skorunu belirgin biçimde aşağı çekiyor. Bu borcu azaltmak skoru 25-35 puan yükseltebilir."
      : "Bu borç tahmini kredi skorunu orta düzeyde etkiliyor. Düzenli ödeme skoru olumlu yönde destekler.";

  return {
    scoreImpact,
    scoreImpactNote,
    sixMonthInterest,
    recommendedPayment: payment,
    monthsToPayoff: months,
    microAction: microAction(debt),
    payoffNote,
  };
}

// Birden çok borç için analiz seti üretir (strateji + nakit akışına göre).
export function analyzeDebts(
  debts: DebtLike[],
  monthlyCashFlow: number,
  allocDebt: number,
): Map<string, DebtAnalysis> {
  const budget = monthlyDebtBudget(monthlyCashFlow, allocDebt);
  const distribution = distributeDebtBudget(debts, budget);
  const out = new Map<string, DebtAnalysis>();
  for (const debt of debts) {
    out.set(debt.id, analyzeDebt(debt, distribution.get(debt.id) ?? 0));
  }
  return out;
}
