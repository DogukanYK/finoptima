// KPI kartı — hue-blob ışıltılı glass yüzey (Neo banking v2).

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
    <div className="card relative overflow-hidden p-4 sm:p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-7 -top-9 h-28 w-28 rounded-full"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${HUE[hue]} 24%, transparent) 0%, transparent 70%)`,
        }}
      />
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
            className={`text-xs font-semibold tabular-nums ${
              deltaUp ? "text-accent" : "text-destructive"
            }`}
          >
            {delta}
          </span>
        )}
      </div>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
