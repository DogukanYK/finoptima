import { requireUser } from "@/lib/auth-helpers";
import { getFindeksSignals, getLatestFindeksReport } from "@/lib/queries";
import { computeFindeks, type FindeksAdvice } from "@/lib/findeks";
import { findeksAdvice } from "@/lib/findeksReport";
import { formatTL, formatDate } from "@/lib/format";
import {
  Gauge,
  Clock,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  BarChart3,
  Cpu,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { FindeksUpload } from "@/components/findeks/findeks-upload";
import { CreditCoach } from "@/components/findeks/credit-coach";
import { GaugeRing } from "@/components/findeks/gauge-ring";

// AI kredi koçu çağrısı için sunucu fonksiyon süresini uzat.
export const maxDuration = 60;

export default async function FindeksPage() {
  const user = await requireUser();
  const [signals, report] = await Promise.all([
    getFindeksSignals(user.id),
    getLatestFindeksReport(user.id),
  ]);

  const headerTitle = report
    ? `Findeks notun ${report.score.toLocaleString("tr-TR")}`
    : (() => {
        const r = computeFindeks(signals);
        return `Tahmini skorun ${r.estimatedScore.toLocaleString("tr-TR")}`;
      })();

  return (
    <div className="space-y-5">
      <PageHeader
        kicker={
          report
            ? `findeks · ${formatDate(report.reportDate)} tarihli resmî rapor`
            : "tahmini findeks · harcama davranışından"
        }
        title={headerTitle}
        description="Kredi sağlığını izle, geleceğini planla."
      />

      {report ? (
        <RealReport report={report} />
      ) : (
        <EstimatedReport signals={signals} />
      )}

      {/* AI kredi koçu — deterministik skor verisinden kişisel eylem planı */}
      <CreditCoach />

      <FindeksUpload hasReport={Boolean(report)} />
    </div>
  );
}

/* ---------- Gerçek Findeks raporu ---------- */

type RealReportData = NonNullable<
  Awaited<ReturnType<typeof getLatestFindeksReport>>
>;

function RealReport({ report }: { report: RealReportData }) {
  const advice = findeksAdvice({ ...report, cards: report.cards });

  // Bileşen ağırlıklarını 5 faktörlü tablo satırlarına çevir.
  const factorRows: FactorRow[] = [
    {
      n: "01",
      label: "Kredi Kullanım Yoğunluğu",
      weight: report.componentWeights.usage,
      score: clampScore(100 - report.debtRatio),
      note: `Borç / limit oranın %${report.debtRatio}`,
    },
    {
      n: "02",
      label: "Mevcut Hesap ve Borç Durumu",
      weight: report.componentWeights.currentDebt,
      score: clampScore(100 - report.debtRatio / 2),
      note: `Toplam borç ${formatTL(report.totalDebt)}`,
    },
    {
      n: "03",
      label: "Kredili Ürün Ödeme Alışkanlıkları",
      weight: report.componentWeights.payment,
      score: /gecikme/i.test(report.worstStatus) ? 62 : 90,
      note: `En olumsuz durum: ${report.worstStatus}`,
    },
    {
      n: "04",
      label: "Yeni Kredili Ürün Açılışları",
      weight: report.componentWeights.newProducts,
      score: 80,
      note: `${report.cards.length} kredi kartı kayıtlı`,
    },
  ];

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <ScoreHero
          score={report.score}
          max={1900}
          band={report.band}
          kicker="resmî findeks raporu"
          headline={heroHeadline(report.score, 1900)}
          body={`${formatDate(report.reportDate)} tarihli resmî Findeks Risk Raporu'ndan alınmıştır. Borç / limit oranın %${report.debtRatio}.`}
        />

        <div className="flex flex-col gap-4">
          {advice.slice(0, 2).map((a, i) => (
            <AdviceGlassCard
              key={i}
              advice={a}
              rank={i === 0 ? "öncelikli aksiyon" : "ikinci aksiyon"}
              factor={`FAKTÖR 0${i + 1}`}
            />
          ))}
        </div>
      </div>

      <FactorTable rows={factorRows} engineLabel="RESMÎ RAPOR BİLEŞENLERİ" />

      {advice.length > 2 && (
        <SectionCard
          title="Diğer tavsiyeler"
          subtitle="Gerçek rapor verine göre"
        >
          <div className="space-y-2.5">
            {advice.slice(2).map((a, i) => (
              <AdviceRow key={i} advice={a} />
            ))}
          </div>
        </SectionCard>
      )}
    </>
  );
}

/* ---------- Tahmini skor (rapor yokken) ---------- */

function EstimatedReport({
  signals,
}: {
  signals: Awaited<ReturnType<typeof getFindeksSignals>>;
}) {
  const result = computeFindeks(signals);

  const factorRows: FactorRow[] = result.factors.map((f, i) => ({
    n: `0${i + 1}`,
    label: f.label,
    weight: Math.round(f.weight * 100),
    score: f.score,
    note: f.detail,
  }));

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <ScoreHero
          score={result.estimatedScore}
          max={1900}
          band={result.band}
          kicker="tahmini findeks"
          headline={heroHeadline(result.estimatedScore, 1900)}
          body="Bu skor tahminidir — harcama davranışından hesaplanır. Gerçek skorun için aşağıdan Findeks Risk Raporu PDF'ini yükle."
        />

        <div className="flex flex-col gap-4">
          {result.advice.slice(0, 2).map((a, i) => (
            <AdviceGlassCard
              key={i}
              advice={a}
              rank={i === 0 ? "öncelikli aksiyon" : "ikinci aksiyon"}
              factor={`FAKTÖR 0${i + 1}`}
            />
          ))}
        </div>
      </div>

      <FactorTable rows={factorRows} engineLabel="5 FAKTÖRLÜ TAHMİN MOTORU" />

      {result.advice.length > 2 && (
        <SectionCard title="Diğer tavsiyeler">
          <div className="space-y-2.5">
            {result.advice.slice(2).map((a, i) => (
              <AdviceRow key={i} advice={a} />
            ))}
          </div>
        </SectionCard>
      )}
    </>
  );
}

/* ---------- Büyük skor kartı (koyu hero) ---------- */

function ScoreHero({
  score,
  max,
  band,
  kicker,
  headline,
  body,
}: {
  score: number;
  max: number;
  band: string;
  kicker: string;
  headline: string;
  body: string;
}) {
  return (
    <div className="card-dark relative overflow-hidden p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-44 -top-52 h-[600px] w-[600px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.45) 0%, transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 -left-44 h-[500px] w-[500px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(5,150,105,0.22) 0%, transparent 60%)",
        }}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85">
            <Gauge size={13} />
            {kicker}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85">
            <Clock size={13} />
            güncel
          </span>
        </div>

        <div className="mt-5 grid items-center gap-6 sm:grid-cols-[220px_1fr]">
          <GaugeRing score={score} max={max} />
          <div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
              style={{ background: "var(--app-signal)", color: "#0d1117" }}
            >
              <ShieldCheck size={13} />
              {band}
            </span>
            <p
              className="mt-3.5 font-heading text-2xl font-bold leading-tight tracking-tight text-white"
              style={{ textWrap: "balance" }}
            >
              {headline}
            </p>
            <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-white/75">
              {body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Öneri kartları (glass) ---------- */

const SEVERITY = {
  high: { color: "var(--app-destructive)", icon: AlertTriangle },
  medium: { color: "var(--app-primary)", icon: TrendingUp },
  low: { color: "var(--app-accent)", icon: Sparkles },
} as const;

function AdviceGlassCard({
  advice,
  rank,
  factor,
}: {
  advice: FindeksAdvice;
  rank: string;
  factor: string;
}) {
  const tone = SEVERITY[advice.severity];
  const Icon = tone.icon;
  return (
    <div className="card card-hover flex flex-1 flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: `color-mix(in srgb, ${tone.color} 12%, transparent)`,
            color: tone.color,
          }}
        >
          <Icon size={18} />
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{
            background: `color-mix(in srgb, ${tone.color} 12%, transparent)`,
            color: tone.color,
          }}
        >
          {rank}
        </span>
      </div>
      <h4 className="mt-3 font-heading text-lg font-bold tracking-tight text-ink">
        {advice.title}
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-muted">{advice.body}</p>
      <div className="mt-3.5 flex flex-wrap gap-2">
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{
            background: `color-mix(in srgb, ${tone.color} 12%, transparent)`,
            color: tone.color,
          }}
        >
          {advice.severity === "high"
            ? "ÖNCELİKLİ"
            : advice.severity === "medium"
              ? "ORTA VADE"
              : "İYİLEŞTİRME"}
        </span>
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
          {factor}
        </span>
        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          {priorityLabel(advice.severity)}
        </span>
      </div>
    </div>
  );
}

function AdviceRow({ advice }: { advice: FindeksAdvice }) {
  const tone = SEVERITY[advice.severity];
  const Icon = tone.icon;
  return (
    <div className="flex items-start gap-3 rounded-[var(--app-radius)] border border-line p-3.5">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: `color-mix(in srgb, ${tone.color} 12%, transparent)`,
          color: tone.color,
        }}
      >
        <Icon size={15} />
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{advice.title}</p>
        <p className="mt-0.5 text-sm text-muted">{advice.body}</p>
      </div>
    </div>
  );
}

/* ---------- 5 faktör tablosu ---------- */

type FactorRow = {
  n: string;
  label: string;
  weight: number;
  score: number;
  note: string;
};

function factorStatus(score: number): {
  pill: string;
  color: string;
} {
  if (score >= 70) return { pill: "GOOD", color: "var(--app-accent)" };
  if (score >= 45) return { pill: "MID", color: "var(--app-warning)" };
  return { pill: "WARN", color: "var(--app-destructive)" };
}

function FactorTable({
  rows,
  engineLabel,
}: {
  rows: FactorRow[];
  engineLabel: string;
}) {
  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-heading text-base font-bold text-ink">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-xl"
            style={{
              background: "linear-gradient(120deg,#2563EB,#0EA5E9)",
              color: "#fff",
            }}
          >
            <BarChart3 size={17} />
          </span>
          Faktörler
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          <Cpu size={13} />
          {engineLabel}
        </span>
      </div>

      {/* Başlık satırı */}
      <div
        className="grid items-center gap-3 border-b border-line py-2.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted"
        style={{
          gridTemplateColumns: "40px minmax(0,2.4fr) 0.7fr 0.7fr minmax(0,1.6fr)",
        }}
      >
        <span>№</span>
        <span>FAKTÖR</span>
        <span>AĞIRLIK</span>
        <span>PUAN</span>
        <span>DURUM</span>
      </div>

      {rows.map((r, i) => {
        const st = factorStatus(r.score);
        return (
          <div
            key={r.n}
            className="grid items-center gap-3 py-3.5"
            style={{
              gridTemplateColumns:
                "40px minmax(0,2.4fr) 0.7fr 0.7fr minmax(0,1.6fr)",
              borderBottom:
                i < rows.length - 1 ? "1px solid var(--app-border)" : "none",
            }}
          >
            <span className="text-[11px] font-semibold tracking-[0.04em] tabular-nums text-muted">
              {r.n}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink">{r.label}</div>
              <div className="mt-0.5 truncate text-[11px] text-muted">
                {r.note}
              </div>
            </div>
            <span className="text-[13px] font-semibold tabular-nums text-muted">
              %{r.weight}
            </span>
            <span
              className="font-heading text-[17px] font-bold tabular-nums"
              style={{ letterSpacing: "-0.02em", color: st.color }}
            >
              {r.score}
            </span>
            <div className="flex items-center gap-2">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0, r.score))}%`,
                    background: st.color,
                  }}
                />
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide"
                style={{
                  background: `color-mix(in srgb, ${st.color} 14%, transparent)`,
                  color: st.color,
                }}
              >
                {st.pill}
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/* ---------- Yardımcılar ---------- */

function clampScore(v: number): number {
  return Math.round(Math.max(0, Math.min(100, v)));
}

function heroHeadline(score: number, max: number): string {
  const thresholds = [700, 1100, 1500, 1700];
  const next = thresholds.find((t) => t > score);
  if (next) {
    return `Üst banda ${(next - score).toLocaleString("tr-TR")} puan kaldı.`;
  }
  if (score >= max) return "En üst bandasın — bu seviyeyi koru.";
  return "İyi durumdasın — istikrarı sürdür.";
}

function priorityLabel(severity: FindeksAdvice["severity"]): string {
  return severity === "high"
    ? "yüksek etki"
    : severity === "medium"
      ? "orta etki"
      : "düşük etki";
}

