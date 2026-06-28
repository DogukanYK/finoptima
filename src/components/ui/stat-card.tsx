// KPI kartı — landing'in temiz stat kartı: accent çizgi + kicker + büyük rakam + delta.

import { TrendingUp, TrendingDown } from "lucide-react";

export type StatHue = "primary" | "accent" | "destructive" | "violet";

const HUE: Record<StatHue, string> = {
  primary: "var(--app-primary)",
  accent: "var(--app-accent)",
  destructive: "var(--app-destructive)",
  violet: "var(--app-violet)",
};

export function StatCard({
  kicker,
  value,
  hue = "primary",
  sub,
  delta,
  deltaUp,
}: {
  kicker: string;
  value: string;
  hue?: StatHue;
  sub?: string;
  delta?: string;
  deltaUp?: boolean;
}) {
  return (
    <div className="card card-hover p-4 sm:p-5">
      <span
        className="mb-3 block h-1 w-7 rounded-full"
        style={{ background: HUE[hue] }}
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
        {kicker}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <p className="font-heading text-xl font-extrabold tracking-tight tabular-nums text-ink sm:text-[1.6rem]">
          {value}
        </p>
        {delta && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
              deltaUp
                ? "bg-accent-soft text-accent"
                : "bg-destructive-soft text-destructive"
            }`}
          >
            {deltaUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {delta}
          </span>
        )}
      </div>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
