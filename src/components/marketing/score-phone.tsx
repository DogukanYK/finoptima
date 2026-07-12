import {
  Gauge,
  CreditCard,
  Sparkles,
  TrendingUp,
  ArrowLeftRight,
  Plus,
  User,
} from "lucide-react";
import { INK, BG, MUTED, SUBTLE, LINE, BLUE, EMERALD, GRAD, DARK } from "@/components/marketing/theme";
import { F } from "@/components/marketing/fonts";

/* Gerçekçi iPhone mockup'ı — kredi notu ekranı, hafifçe süzülür. Landing hero'su
   ve kredi-notu sayfası paylaşır. */
export function ScorePhone() {
  return (
    <div className="relative flex justify-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 h-[440px] w-[440px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.16) 0%, rgba(5,150,105,0.10) 45%, transparent 70%)",
        }}
      />

      <div className="fin-float relative z-10 w-[300px]" style={{ filter: "drop-shadow(0 48px 90px rgba(15,23,42,0.4))" }}>
        <span aria-hidden className="absolute -left-[2px] top-[118px] z-0 h-[26px] w-[3px] rounded-l-[2px]" style={{ background: "linear-gradient(90deg,#15171b,#3d4047)" }} />
        <span aria-hidden className="absolute -left-[2px] top-[162px] z-0 h-[44px] w-[3px] rounded-l-[2px]" style={{ background: "linear-gradient(90deg,#15171b,#3d4047)" }} />
        <span aria-hidden className="absolute -left-[2px] top-[216px] z-0 h-[44px] w-[3px] rounded-l-[2px]" style={{ background: "linear-gradient(90deg,#15171b,#3d4047)" }} />
        <span aria-hidden className="absolute -right-[2px] top-[174px] z-0 h-[64px] w-[3px] rounded-r-[2px]" style={{ background: "linear-gradient(270deg,#15171b,#3d4047)" }} />

        <div
          className="relative z-10 rounded-[56px] p-[2.5px]"
          style={{
            background:
              "linear-gradient(135deg,#efede6 0%,#9c9992 13%,#dcd9d1 30%,#86837d 50%,#e8e5dd 70%,#827f79 88%,#cdcac2 100%)",
            boxShadow:
              "inset 0 1.5px 1px rgba(255,255,255,0.75), inset 0 -1.5px 1px rgba(0,0,0,0.3), 0 0 0 0.5px rgba(0,0,0,0.08)",
          }}
        >
          <div className="rounded-[54px] bg-black p-[3.5px]">
            <div className="relative flex flex-col overflow-hidden rounded-[50px]" style={{ background: BG, aspectRatio: "9 / 19.3" }}>
              <div className="absolute left-1/2 top-[11px] z-30 h-[26px] w-[86px] -translate-x-1/2 rounded-full bg-black" />

              <div className="relative z-20 flex items-center justify-between px-6 pt-3.5 text-[12px] font-semibold" style={{ color: INK }}>
                <span style={{ fontFamily: F.display }}>9:41</span>
                <span className="flex items-center gap-[6px]" style={{ color: INK }}>
                  <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden>
                    <rect x="0" y="8" width="3" height="4" rx="1" />
                    <rect x="4.7" y="5.5" width="3" height="6.5" rx="1" />
                    <rect x="9.3" y="3" width="3" height="9" rx="1" />
                    <rect x="14" y="0.5" width="3" height="11.5" rx="1" />
                  </svg>
                  <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
                    <path d="M8 2.1c2.6 0 5 1 6.9 2.8l-1.5 1.6A7.6 7.6 0 0 0 8 4.4 7.6 7.6 0 0 0 2.6 6.5L1.1 4.9A9.8 9.8 0 0 1 8 2.1Z" />
                    <path d="M8 5.5c1.6 0 3.1.6 4.3 1.8L10.7 8.9A3.8 3.8 0 0 0 8 7.7c-1 0-2 .4-2.7 1.2L3.7 7.3A6.1 6.1 0 0 1 8 5.5Z" />
                    <circle cx="8" cy="10.4" r="1.5" />
                  </svg>
                  <svg width="26" height="13" viewBox="0 0 26 13" aria-hidden>
                    <rect x="0.5" y="0.5" width="22" height="12" rx="3.6" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                    <rect x="2" y="2" width="16" height="9" rx="2" fill="currentColor" />
                    <rect x="24" y="4" width="1.6" height="5" rx="0.8" fill="currentColor" opacity="0.4" />
                  </svg>
                </span>
              </div>

              <div className="relative z-10 min-h-0 flex-1 px-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium" style={{ color: MUTED }}>Merhaba, Doğukan</div>
                    <div className="text-[18px] font-bold tracking-tight" style={{ fontFamily: F.display, color: INK }}>Kredi sağlığın</div>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold text-white" style={{ background: GRAD }}>D</span>
                </div>

                <div className="relative mt-3 overflow-hidden rounded-[20px] p-4 text-white" style={{ background: DARK }}>
                  <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.55) 0%, transparent 60%)" }} />
                  <div className="relative flex items-center gap-4">
                    <ScoreRing value={1420} max={1900} />
                    <div>
                      <div className="text-[9px] font-semibold tracking-[0.1em]" style={{ fontFamily: F.mono, color: "rgba(248,250,252,0.6)" }}>FINDEKS (TAHMİNİ)</div>
                      <div className="mt-0.5 text-[28px] font-extrabold leading-none tracking-tight" style={{ fontFamily: F.display }}>1.420</div>
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-bold" style={{ background: "rgba(16,185,129,0.22)", color: "#34D399", fontFamily: F.mono }}>+38 ↑ · İyi</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {[
                    { l: "Ödeme düzeni", v: 92 },
                    { l: "Kart kullanımı", v: 76 },
                    { l: "Borç / gelir", v: 84 },
                  ].map((r) => (
                    <div key={r.l}>
                      <div className="flex justify-between text-[11px] font-medium" style={{ color: SUBTLE }}>
                        <span>{r.l}</span>
                        <span style={{ fontFamily: F.mono, color: MUTED }}>{r.v}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "#E2E8F0" }}>
                        <div className="h-full rounded-full" style={{ width: `${r.v}%`, background: r.v >= 85 ? EMERALD : BLUE }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2.5 rounded-2xl border p-2.5" style={{ borderColor: "rgba(37,99,235,0.25)", background: "rgba(37,99,235,0.06)" }}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: BLUE }}>
                    <Sparkles size={15} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-bold" style={{ color: INK }}>Garanti kart borcunu kapat</div>
                    <div className="text-[10px]" style={{ color: MUTED }}>bu ay önceliğin · +15-20 puan</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wide" style={{ color: INK }}>Son işlemler</span>
                    <span className="text-[10px] font-semibold" style={{ color: BLUE }}>Tümü</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { t: "Maaş", c: "Gelir · bugün", v: "+₺32.000", out: false },
                      { t: "Migros", c: "Market · dün", v: "−₺540", out: true },
                    ].map((r) => (
                      <div key={r.t} className="flex items-center gap-2.5 rounded-xl border p-2" style={{ borderColor: LINE, background: "#fff" }}>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: r.out ? "rgba(15,23,42,0.05)" : "rgba(5,150,105,0.1)", color: r.out ? SUBTLE : EMERALD }}>
                          {r.out ? <CreditCard size={13} /> : <TrendingUp size={13} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11.5px] font-semibold" style={{ color: INK }}>{r.t}</div>
                          <div className="text-[9.5px]" style={{ color: MUTED }}>{r.c}</div>
                        </div>
                        <span className="text-[11.5px] font-bold" style={{ fontFamily: F.mono, color: r.out ? INK : EMERALD }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative z-20 shrink-0 border-t" style={{ borderColor: LINE, background: "rgba(255,255,255,0.95)" }}>
                <div className="flex items-center justify-between px-6 pt-2 pb-1.5">
                  {[
                    { Icon: Gauge, a: true },
                    { Icon: ArrowLeftRight, a: false },
                    { Icon: Plus, a: false },
                    { Icon: CreditCard, a: false },
                    { Icon: User, a: false },
                  ].map((t, i) => (
                    <span key={i} className="flex h-7 w-7 items-center justify-center rounded-xl" style={{ color: t.a ? BLUE : MUTED, background: t.a ? "rgba(37,99,235,0.1)" : "transparent" }}>
                      <t.Icon size={17} strokeWidth={t.a ? 2.5 : 2} />
                    </span>
                  ))}
                </div>
                <div className="mx-auto mb-2 h-[4px] w-[110px] rounded-full" style={{ background: "rgba(15,23,42,0.26)" }} />
              </div>

              <div aria-hidden className="pointer-events-none absolute inset-0 z-40 rounded-[50px]" style={{ background: "linear-gradient(125deg, rgba(255,255,255,0.2) 0%, transparent 22%, transparent 74%, rgba(255,255,255,0.06) 100%)" }} />
            </div>
          </div>
        </div>
      </div>

      <div
        className="fin-floatb absolute right-0 top-12 hidden max-w-[220px] items-center gap-3 rounded-[18px] border bg-white p-3.5 lg:flex"
        style={{ borderColor: LINE, boxShadow: "0 24px 50px rgba(15,23,42,0.12)", animationDelay: "0.6s" }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(5,150,105,0.1)", color: EMERALD }}>
          <TrendingUp size={18} />
        </span>
        <div>
          <div className="text-[13px] font-semibold" style={{ color: INK }}>Findeks +38 puan</div>
          <div className="text-[11.5px]" style={{ color: MUTED }}>son 30 gün</div>
        </div>
      </div>
      <div
        className="fin-floatb absolute -left-2 bottom-24 hidden max-w-[220px] items-center gap-3 rounded-[18px] border bg-white p-3.5 lg:flex"
        style={{ borderColor: LINE, boxShadow: "0 24px 50px rgba(15,23,42,0.12)", animationDelay: "1.4s" }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: GRAD }}>
          <CreditCard size={18} />
        </span>
        <div>
          <div className="text-[13px] font-semibold" style={{ color: INK }}>Kart kullanımı %28</div>
          <div className="text-[11.5px]" style={{ color: MUTED }}>ideal aralıkta</div>
        </div>
      </div>
    </div>
  );
}

export function ScoreRing({ value, max }: { value: number; max: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative h-[68px] w-[68px] shrink-0">
      <svg viewBox="0 0 68 68" className="h-full w-full">
        <defs>
          <linearGradient id="sr" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="6" />
        <circle cx="34" cy="34" r={r} fill="none" stroke="url(#sr)" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} transform="rotate(-90 34 34)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[13px] font-extrabold" style={{ fontFamily: F.display }}>
        {Math.round(frac * 100)}
      </div>
    </div>
  );
}

/* Büyük Findeks göstergesi — kredi-notu sayfası ve koyu panellerde kullanılır. */
export function BigGauge({ value = 1420, max = 1900 }: { value?: number; max?: number }) {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const pct = value / max;
  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 150 150" className="h-full w-full">
        <defs>
          <linearGradient id="bg-fg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>
        <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="11" />
        <circle cx="75" cy="75" r={r} fill="none" stroke="url(#bg-fg)" strokeWidth="11" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} transform="rotate(-90 75 75)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] font-semibold tracking-[0.1em]" style={{ fontFamily: F.mono, color: "rgba(248,250,252,0.6)" }}>FINDEKS</span>
        <span className="text-[32px] font-extrabold leading-none tracking-tight" style={{ fontFamily: F.display }}>{value.toLocaleString("tr-TR")}</span>
        <span className="text-[11px] font-semibold" style={{ color: "#34D399" }}>+38 ↑ İyi</span>
      </div>
    </div>
  );
}
