// Dairesel skor göstergesi (koyu zemin için — beyaz metin). Findeks hero'su +
// dashboard kompakt kartı ortak kullanır. size ile ölçeklenir (viewBox sabit).
export function GaugeRing({
  score,
  max,
  size = 220,
}: {
  score: number;
  max: number;
  size?: number;
}) {
  const r = 92;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, score / max));
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const scoreFont = Math.round(size * 0.29);
  return (
    <div className="relative mx-auto" style={{ height: size, width: size }}>
      <svg viewBox="0 0 220 220" className="h-full w-full">
        <defs>
          <linearGradient id="fkGauge" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="55%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <circle
          cx="110"
          cy="110"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="14"
        />
        <circle
          cx="110"
          cy="110"
          r={r}
          fill="none"
          stroke="url(#fkGauge)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          transform="rotate(-90 110 110)"
        />
        {ticks.map((tk, i) => {
          const a = -Math.PI / 2 + tk * Math.PI * 2;
          const x1 = 110 + 104 * Math.cos(a);
          const y1 = 110 + 104 * Math.sin(a);
          const x2 = 110 + 114 * Math.cos(a);
          const y2 = 110 + 114 * Math.sin(a);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-semibold uppercase tracking-[0.14em] text-white/55"
          style={{ fontSize: Math.max(9, Math.round(size * 0.045)) }}
        >
          SKOR
        </span>
        <span
          className="mt-1 font-heading font-bold leading-none tabular-nums text-white"
          style={{ fontSize: scoreFont, letterSpacing: "-0.04em" }}
        >
          {score.toLocaleString("tr-TR")}
        </span>
        <span
          className="mt-1 font-semibold tabular-nums text-white/55"
          style={{ fontSize: Math.max(10, Math.round(size * 0.05)) }}
        >
          / {max.toLocaleString("tr-TR")}
        </span>
      </div>
    </div>
  );
}
