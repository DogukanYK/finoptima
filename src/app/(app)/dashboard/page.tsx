import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import {
  getDashboard,
  getFindeksSignals,
  getLatestFindeksReport,
} from "@/lib/queries";
import { computeFindeks } from "@/lib/findeks";
import { formatTL, formatDate } from "@/lib/format";
import { Plus, Upload, CalendarClock, Gauge, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SectionCard } from "@/components/ui/section-card";
import { LinkButton } from "@/components/ui/button";
import { TrendChart } from "@/components/charts/trend-chart";
import { CategoryBars } from "@/components/charts/category-bars";
import { GaugeRing } from "@/components/findeks/gauge-ring";
import { CategoryIcon } from "@/components/ui/icon";

export default async function DashboardPage() {
  const user = await requireUser();
  const [data, signals, report] = await Promise.all([
    getDashboard(user.id),
    getFindeksSignals(user.id),
    getLatestFindeksReport(user.id),
  ]);
  const est = computeFindeks(signals);
  const findeks = report
    ? { score: report.score, band: report.band, real: true }
    : { score: est.estimatedScore, band: est.band, real: false };
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="genel bakış"
        title={`Merhaba, ${firstName}`}
        description="Finansal durumunun özeti."
        action={
          <div className="flex gap-2">
            <LinkButton href="/add" size="sm">
              <Plus size={16} />
              Harcama Ekle
            </LinkButton>
            <LinkButton href="/import" size="sm" variant="outline">
              <Upload size={16} />
              Döküm
            </LinkButton>
          </div>
        }
      />

      {/* Özet kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          kicker="Toplam Bakiye"
          value={formatTL(data.balance)}
          hue="primary"
          sub="tüm zamanlar net"
        />
        <StatCard kicker="Bu Ay Gelir" value={formatTL(data.income)} hue="accent" />
        <StatCard
          kicker="Bu Ay Gider"
          value={formatTL(data.expense)}
          hue="destructive"
        />
        <StatCard
          kicker="Bu Ay Net"
          value={formatTL(data.net)}
          hue={data.net >= 0 ? "accent" : "destructive"}
          sub={data.net >= 0 ? "artıda" : "ekside"}
        />
      </div>

      {/* Trend + Findeks */}
      <div className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <SectionCard title="Gelir & Gider" subtitle="Son 6 ay">
          <TrendChart data={data.trend} />
        </SectionCard>
        <FindeksMiniCard
          score={findeks.score}
          band={findeks.band}
          real={findeks.real}
        />
      </div>

      {/* Dağılım + Yaklaşan */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Harcama dağılımı"
          subtitle="Bu ay"
          href="/transactions"
        >
          {data.breakdown.length ? (
            <CategoryBars items={data.breakdown} />
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              Bu ay henüz gider yok.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Yaklaşan ödemeler" href="/calendar" hrefLabel="Takvim">
          {data.upcoming.length ? (
            <div className="space-y-2.5">
              {data.upcoming.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 rounded-[var(--app-radius)] border border-line p-3"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <CalendarClock size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {e.title}
                    </p>
                    <p className="text-xs text-muted">{formatDate(e.date)}</p>
                  </div>
                  {e.amount != null && (
                    <span className="font-heading text-sm font-semibold tabular-nums text-ink">
                      {formatTL(e.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted">
              Yaklaşan ödeme yok.
            </p>
          )}
        </SectionCard>
      </div>

      {/* Son işlemler */}
      <SectionCard title="Son işlemler" href="/transactions">
        {data.recent.length ? (
          <div className="divide-y divide-line">
            {data.recent.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: (t.category?.color ?? "#94A3B8") + "1A",
                    color: t.category?.color ?? "#94A3B8",
                  }}
                >
                  <CategoryIcon name={t.category?.icon ?? "tag"} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {t.description}
                  </p>
                  <p className="text-xs text-muted">
                    {t.category?.name ?? "Kategorisiz"} · {formatDate(t.date)}
                  </p>
                </div>
                <span
                  className={`font-heading text-sm font-semibold tabular-nums ${
                    t.kind === "INCOME" ? "text-accent" : "text-ink"
                  }`}
                >
                  {t.kind === "INCOME" ? "+" : "−"}
                  {formatTL(t.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted">
            Henüz işlem yok.{" "}
            <Link href="/add" className="font-semibold text-primary">
              İlk işlemini ekle
            </Link>
          </p>
        )}
      </SectionCard>
    </div>
  );
}

function FindeksMiniCard({
  score,
  band,
  real,
}: {
  score: number;
  band: string;
  real: boolean;
}) {
  return (
    <div className="card-dark relative flex flex-col items-center overflow-hidden p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex w-full items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85">
          <Gauge size={13} />
          {real ? "findeks" : "tahmini"}
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
          style={{ background: "var(--app-signal)", color: "#0d1117" }}
        >
          {band}
        </span>
      </div>
      <div className="relative my-1">
        <GaugeRing score={score} max={1900} size={150} />
      </div>
      <Link
        href="/findeks"
        className="relative inline-flex items-center gap-1 text-sm font-semibold text-white/90 transition-colors hover:text-white"
      >
        Kredi sağlığı detayı
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
