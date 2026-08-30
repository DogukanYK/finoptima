import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import {
  INK,
  MUTED,
  SUBTLE,
  LINE,
  BLUE,
  EMERALD,
  GRAD,
  DARK,
  SHADOW_SM,
} from "@/components/marketing/theme";
import { F } from "@/components/marketing/fonts";

/* ============================ Marka ============================ */

export function Brand({ light, size = 20 }: { light?: boolean; size?: number }) {
  const box = Math.round(size * 1.8);
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="inline-flex items-center justify-center rounded-[11px] font-bold text-white"
        style={{
          background: GRAD,
          fontFamily: F.display,
          letterSpacing: "-0.04em",
          fontSize: size * 0.75,
          height: box,
          width: box,
        }}
      >
        Fo
      </span>
      <span
        className="font-bold tracking-tight"
        style={{ fontFamily: F.display, color: light ? "#F8FAFC" : INK, fontSize: size }}
      >
        FinOptima
      </span>
    </span>
  );
}

/* ============================ Pill / Eyebrow ============================ */

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "blue" | "green" | "white";
}) {
  const tones = {
    muted: { bg: "rgba(15,23,42,0.05)", fg: SUBTLE },
    blue: { bg: "rgba(37,99,235,0.1)", fg: BLUE },
    green: { bg: "rgba(5,150,105,0.1)", fg: EMERALD },
    white: { bg: "rgba(255,255,255,0.12)", fg: "#F8FAFC" },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold"
      style={{ background: tones.bg, color: tones.fg }}
    >
      {children}
    </span>
  );
}

/* ============================ CTA Butonları ============================ */

type BtnVariant = "primary" | "accent" | "outline" | "white" | "ghostWhite";
type BtnSize = "sm" | "md" | "lg";

const SIZES: Record<BtnSize, string> = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-7 py-3.5 text-[15px]",
  lg: "px-8 py-4 text-base",
};

export function CTAButton({
  href,
  children,
  variant = "primary",
  size = "md",
  arrow,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: BtnVariant;
  size?: BtnSize;
  arrow?: boolean;
  className?: string;
}) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200";
  const styles: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: BLUE, color: "#fff", boxShadow: "0 14px 32px rgba(37,99,235,0.3)" },
    accent: { background: GRAD, color: "#fff", boxShadow: "0 14px 32px rgba(37,99,235,0.32)" },
    outline: { border: "1px solid rgba(15,23,42,0.14)", color: INK, background: "transparent" },
    white: { background: "#fff", color: BLUE, boxShadow: "0 14px 30px rgba(0,0,0,0.16)" },
    ghostWhite: { border: "1px solid rgba(255,255,255,0.4)", color: "#fff", background: "transparent" },
  };
  const hover =
    variant === "outline"
      ? "hover:bg-[rgba(15,23,42,0.03)]"
      : variant === "ghostWhite"
        ? "hover:bg-white/10"
        : "hover:-translate-y-0.5";
  return (
    <Link href={href} className={`${base} ${SIZES[size]} ${hover} ${className}`} style={styles[variant]}>
      {children}
      {arrow && (
        <ArrowRight size={size === "lg" ? 18 : 16} className="transition-transform group-hover:translate-x-0.5" />
      )}
    </Link>
  );
}

/* ============================ Bölüm & tipografi ============================ */

export function Section({
  children,
  id,
  className = "",
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={`relative z-[3] mx-auto max-w-7xl px-5 sm:px-8 ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({
  children,
  className = "",
  as: Tag = "h2",
  light,
}: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
  light?: boolean;
}) {
  const sizes = {
    h1: "text-[clamp(2.5rem,7vw,5rem)] leading-[1.04]",
    h2: "text-[clamp(1.7rem,4vw,3.2rem)] leading-tight",
    h3: "text-[clamp(1.3rem,3vw,2rem)] leading-snug",
  }[Tag];
  return (
    <Tag
      className={`font-bold tracking-[-0.03em] [overflow-wrap:anywhere] ${sizes} ${className}`}
      style={{ fontFamily: F.display, color: light ? "#F8FAFC" : INK }}
    >
      {children}
    </Tag>
  );
}

export function Lead({
  children,
  className = "",
  light,
}: {
  children: ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <p
      className={`text-[17px] leading-relaxed ${className}`}
      style={{ color: light ? "rgba(248,250,252,0.78)" : SUBTLE }}
    >
      {children}
    </p>
  );
}

/* ============================ Kartlar ============================ */

export function Card({
  children,
  className = "",
  hover,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] border bg-white p-6 ${hover ? "transition-shadow hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]" : ""} ${className}`}
      style={{ borderColor: LINE, boxShadow: SHADOW_SM }}
    >
      {children}
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  desc,
  color = BLUE,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  color?: string;
}) {
  return (
    <Card hover>
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
        style={{ background: color }}
      >
        {icon}
      </span>
      <h3 className="mt-4 text-xl font-bold tracking-[-0.02em]" style={{ fontFamily: F.display }}>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: SUBTLE }}>
        {desc}
      </p>
    </Card>
  );
}

/* ============================ Liste öğeleri ============================ */

export function CheckItem({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <li
      className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium"
      style={{
        borderColor: light ? "rgba(255,255,255,0.1)" : LINE,
        background: light ? "rgba(255,255,255,0.05)" : "#fff",
        color: light ? "#F8FAFC" : INK,
      }}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{
          background: light ? "rgba(52,211,153,0.18)" : "rgba(5,150,105,0.1)",
          color: light ? "#34D399" : EMERALD,
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      {children}
    </li>
  );
}

/* ============================ Koyu panel ============================ */

export function DarkPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] px-6 py-12 text-white sm:px-10 ${className}`}
      style={{ background: DARK }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-28 -top-44 h-[460px] w-[460px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 60%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 -left-28 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(5,150,105,0.22) 0%, transparent 60%)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/* ============================ Alt CTA bandı ============================ */

export function GradientCTA({
  title,
  desc,
  primaryHref = "/register",
  primaryLabel = "Erken erişime katıl",
  secondaryHref = "/login",
  secondaryLabel = "Giriş yap",
  note = "Kapalı beta: kayıt davet kodu ile açılıyor, kullanım ücretsiz.",
}: {
  title: string;
  desc: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  note?: string;
}) {
  return (
    <Section className="py-12">
      <div
        className="relative overflow-hidden rounded-[28px] px-6 py-14 text-white sm:px-12"
        style={{ background: GRAD }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 h-[460px] w-[460px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 60%)" }}
        />
        <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <SectionTitle light className="!text-[clamp(1.7rem,4vw,2.8rem)]">
              {title}
            </SectionTitle>
            <p className="mt-3 max-w-lg text-[15px]" style={{ color: "rgba(255,255,255,0.9)" }}>
              {desc}
            </p>
            {note && (
              <p className="mt-3 max-w-lg text-[13px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                {note}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <CTAButton href={primaryHref} variant="white" size="lg" arrow>
              {primaryLabel}
            </CTAButton>
            <CTAButton href={secondaryHref} variant="ghostWhite" size="lg">
              {secondaryLabel}
            </CTAButton>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ============================ Güven şeridi ============================ */

export function StatStrip({
  items,
}: {
  items: { n: string; l: string; s: string }[];
}) {
  return (
    <div
      className="grid grid-cols-2 overflow-hidden rounded-[20px] border bg-white lg:grid-cols-4"
      style={{ borderColor: LINE, boxShadow: SHADOW_SM }}
    >
      {items.map((s) => (
        <div key={s.l} className="p-6">
          <div
            className="text-[clamp(1.4rem,3vw,2rem)] font-bold leading-none tracking-tight"
            style={{ fontFamily: F.display, color: BLUE }}
          >
            {s.n}
          </div>
          <div className="mt-2 text-sm font-semibold" style={{ color: INK }}>
            {s.l}
          </div>
          <div className="mt-0.5 text-[11px]" style={{ fontFamily: F.mono, color: MUTED }}>
            {s.s}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================ Arka plan glow'ları ============================ */

export function PageGlows() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-56 h-[680px] w-[680px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-52 top-[440px] h-[560px] w-[560px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(5,150,105,0.10) 0%, transparent 60%)" }}
      />
    </>
  );
}

/* ============================ Paylaşılan animasyonlar ============================ */

export function MarketingStyles() {
  return (
    <style>{`
      .fin-float { animation: finFloat 6.5s ease-in-out infinite; }
      .fin-floatb { animation: finFloatB 5s ease-in-out infinite; }
      @keyframes finFloat { 0%,100%{transform:translateY(0) rotate(-1.4deg)} 50%{transform:translateY(-16px) rotate(1.4deg)} }
      @keyframes finFloatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
      @media (prefers-reduced-motion: reduce){ .fin-float,.fin-floatb{animation:none!important} }
    `}</style>
  );
}
