import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  CreditCard,
  Landmark,
  TrendingUp,
  Target,
  Percent,
  Lightbulb,
} from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import {
  getDebt,
  getDebts,
  getMonthlyCashFlow,
  getOrCreateFinanceProfile,
} from "@/lib/queries";
import { analyzeDebt, monthlyDebtBudget, distributeDebtBudget } from "@/lib/debt";
import { formatTL, formatDateShort } from "@/lib/format";
import { SectionCard } from "@/components/ui/section-card";
import { DebtPaymentForm } from "@/components/debts/debt-payment-form";

export default async function DebtDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const [debt, cashFlow, profile, allDebts] = await Promise.all([
    getDebt(user.id, id),
    getMonthlyCashFlow(user.id),
    getOrCreateFinanceProfile(user.id),
    getDebts(user.id),
  ]);

  if (!debt) notFound();

  const budget = monthlyDebtBudget(cashFlow.net, profile.allocDebt);
  const distribution = distributeDebtBudget(allDebts, budget);
  const recommended = distribution.get(debt.id) ?? 0;
  const analysis = analyzeDebt(debt, recommended);

  const card = debt.kind === "CREDIT_CARD";
  const total = debt.balance + debt.paidTotal;
  const paidFrac = total > 0 ? Math.min(100, (debt.paidTotal / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <Link
        href="/borclar"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        <ChevronLeft size={16} /> Borçlar
      </Link>

      {/* Başlık kartı — koyu hero */}
      <div className="card-dark relative overflow-hidden p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(37,99,235,0.45) 0%, rgba(37,99,235,0) 70%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))" }}
          >
            {card ? <CreditCard size={26} /> : <Landmark size={26} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-heading text-xl font-extrabold tracking-tight text-white">
                {debt.name}
              </h1>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/80">
                {card ? <CreditCard size={13} /> : <Landmark size={13} />}
                {card ? "Kredi Kartı" : "Kredi"}
              </span>
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-white/70">
              <Percent size={13} className="text-sky-300" />%{debt.apr} aylık faiz
              {debt.dueDay != null && ` · her ayın ${debt.dueDay}. günü`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-white/60">
              Güncel bakiye
            </p>
            <p className="font-heading text-2xl font-extrabold tabular-nums text-white sm:text-3xl">
              {formatTL(debt.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* AI Mikro Analiz */}
      <SectionCard
        title="AI Mikro Analiz"
        subtitle="Borcunun finansal sağlığına etkisi"
      >
        <div className="grid gap-3 lg:grid-cols-3">
          <AnalysisPanel
            icon={<TrendingUp size={18} />}
            title="Kredi Skoruna Etkisi"
          >
            <p
              className={`font-heading text-lg font-extrabold tabular-nums ${
                analysis.scoreImpact < 0 ? "text-destructive" : "text-accent"
              }`}
            >
              {analysis.scoreImpact} puan
            </p>
            <p className="mt-1 text-xs text-muted">{analysis.scoreImpactNote}</p>
          </AnalysisPanel>

          <AnalysisPanel
            icon={<Percent size={18} />}
            title="6 Aylık Faiz Yükü"
          >
            <p className="font-heading text-lg font-extrabold tabular-nums text-primary">
              {formatTL(analysis.sixMonthInterest)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Erken ödeme ile bu maliyeti %40-60 azaltabilirsin.
            </p>
          </AnalysisPanel>

          <AnalysisPanel
            icon={<Target size={18} />}
            title="Borç Yönlendirme Stratejisi"
          >
            <p className="text-sm text-ink">
              Önerilen aylık ödeme:{" "}
              <span className="font-semibold tabular-nums text-primary">
                {formatTL(analysis.recommendedPayment)}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-ink">
              Kapanma süresi:{" "}
              <span className="font-semibold">
                {analysis.monthsToPayoff < 0
                  ? "mevcut ödemeyle kapanmaz"
                  : `${analysis.monthsToPayoff} ay`}
              </span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${paidFrac}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              {formatTL(debt.paidTotal)} ödendi · {analysis.payoffNote}
            </p>
          </AnalysisPanel>
        </div>

        <div className="mt-3 flex items-start gap-3 rounded-[var(--app-radius)] bg-primary-soft p-4">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
            style={{ background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))" }}
          >
            <Lightbulb size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">
              AI Mikro-Aksiyon Önerisi
            </p>
            <p className="mt-0.5 text-sm text-ink">{analysis.microAction}</p>
          </div>
        </div>
      </SectionCard>

      <DebtPaymentForm debtId={debt.id} balance={debt.balance} />

      {/* Ödeme geçmişi */}
      <SectionCard title="Ödeme geçmişi" subtitle="Bu borca yapılan ödemeler">
        {debt.payments.length === 0 ? (
          <p className="text-sm text-muted">Henüz ödeme kaydı yok.</p>
        ) : (
          <div className="divide-y divide-[var(--app-border)]">
            {debt.payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold tabular-nums text-ink">
                    {formatTL(p.amount)}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {formatDateShort(p.paidAt)}
                    {p.note && ` · ${p.note}`}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                    p.source === "AUTOMATION"
                      ? "bg-primary-soft text-primary"
                      : "bg-surface-2 text-muted"
                  }`}
                >
                  {p.source === "AUTOMATION" ? "AI otomasyonu" : "Manuel"}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function AnalysisPanel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--app-radius)] border border-line bg-surface p-4">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          {icon}
        </span>
        <p className="text-xs font-semibold text-muted">{title}</p>
      </div>
      {children}
    </div>
  );
}
