import { CreditCard } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import {
  getDebts,
  getMonthlyCashFlow,
  getOrCreateFinanceProfile,
} from "@/lib/queries";
import { analyzeDebts, monthlyDebtBudget } from "@/lib/debt";
import { formatTL } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { DebtManager } from "@/components/debts/debt-manager";

export default async function DebtsPage() {
  const user = await requireUser();
  const [debts, cashFlow, profile] = await Promise.all([
    getDebts(user.id),
    getMonthlyCashFlow(user.id),
    getOrCreateFinanceProfile(user.id),
  ]);

  const analyses = analyzeDebts(debts, cashFlow.net, profile.allocDebt);

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const budget = monthlyDebtBudget(cashFlow.net, profile.allocDebt);

  // Toplam tahmini faiz yükü ve skor etkisi (gerçek analiz verisinden).
  const interestCost = debts.reduce(
    (s, d) => s + (analyses.get(d.id)?.sixMonthInterest ?? 0),
    0,
  );
  const scoreImpact = debts.reduce(
    (s, d) => s + (analyses.get(d.id)?.scoreImpact ?? 0),
    0,
  );

  const dueSoon = debts.filter((d) => {
    const a = analyses.get(d.id);
    return a ? a.scoreImpact <= -35 : false;
  }).length;

  const managerDebts = debts.map((d) => ({
    id: d.id,
    name: d.name,
    kind: d.kind,
    balance: d.balance,
    apr: d.apr,
    dueDay: d.dueDay,
    paidTotal: d.paidTotal,
    scoreImpact: analyses.get(d.id)?.scoreImpact ?? 0,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Borçlar"
        title="Borç & kredi yönetimi"
        description={
          debts.length > 0
            ? `${debts.length} aktif borç${dueSoon > 0 ? ` · ${dueSoon} yakında` : ""}`
            : "Kredi kartı ve kredilerini izle, AI ile kapatma planı kur."
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          kicker="Toplam borç"
          value={formatTL(totalDebt)}
          hue="destructive"
          sub={`${debts.length} kalem`}
        />
        <StatCard
          kicker="Aylık borç bütçesi"
          value={formatTL(budget)}
          hue="accent"
          sub={`gelirin %${profile.allocDebt}'i`}
        />
        <StatCard
          kicker="Faiz yükü"
          value={formatTL(interestCost)}
          hue="violet"
          sub="6 aylık tahmini"
        />
        <StatCard
          kicker="Skor etkisi"
          value={`${scoreImpact} pt`}
          hue="destructive"
          sub="kapatınca düzelir"
        />
      </div>

      {debts.length === 0 ? (
        <EmptyState
          icon={<CreditCard size={26} />}
          title="Henüz borç eklemedin"
          description="Kredi kartı borçlarını ve kredilerini ekle; FinOptima senin için kapatma planı kursun."
          action={
            <div className="w-full max-w-sm text-left">
              <DebtManager debts={managerDebts} />
            </div>
          }
        />
      ) : (
        <DebtManager debts={managerDebts} />
      )}
    </div>
  );
}
