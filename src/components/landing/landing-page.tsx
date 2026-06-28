import Link from "next/link";
import { Space_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import {
  ShieldCheck,
  Gauge,
  CreditCard,
  ReceiptText,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Check,
  FileText,
} from "lucide-react";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

// --- Yeni fintech paleti (serin slate + güven mavisi + zümrüt) ---
const INK = "#0F172A";
const BG = "#F8FAFC";
const MUTED = "#64748B";
const SUBTLE = "#475569";
const LINE = "#E2E8F0";
const BLUE = "#2563EB";
const EMERALD = "#059669";
const GRAD = "linear-gradient(120deg, #2563EB 0%, #0EA5E9 100%)";
const DARK = "linear-gradient(155deg, #0F172A 0%, #172554 100%)";

const F = { display: "var(--font-display)", mono: "var(--font-mono)" };

/* ---------- parçalar ---------- */

function Brand({ light }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] font-bold text-white"
        style={{ background: GRAD, fontFamily: F.display, letterSpacing: "-0.04em", fontSize: 15 }}
      >
        Fo
      </span>
      <span
        className="text-xl font-bold tracking-tight"
        style={{ fontFamily: F.display, color: light ? "#F8FAFC" : INK }}
      >
        FinOptima
      </span>
    </span>
  );
}

function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "blue" | "green";
}) {
  const tones = {
    muted: { bg: "rgba(15,23,42,0.05)", fg: SUBTLE },
    blue: { bg: "rgba(37,99,235,0.1)", fg: BLUE },
    green: { bg: "rgba(5,150,105,0.1)", fg: EMERALD },
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

/* iPhone mockup — kredi notu ekranı, hafifçe süzülür */
function ScorePhone() {
  return (
    <div className="relative flex justify-center">
      {/* arka glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 h-[440px] w-[440px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(37,99,235,0.16) 0%, rgba(5,150,105,0.10) 45%, transparent 70%)",
        }}
      />

      <div
        className="fin-float relative z-10 w-[286px] rounded-[44px] p-2.5 sm:w-[306px]"
        style={{ background: INK, boxShadow: "0 50px 110px rgba(15,23,42,0.28)" }}
      >
        <div className="relative overflow-hidden rounded-[34px]" style={{ background: BG }}>
          <div className="absolute left-1/2 top-3.5 z-10 h-6 w-20 -translate-x-1/2 rounded-full bg-black" />
          <div className="px-4 pb-6 pt-12">
            <div className="flex items-center justify-between">
              <div className="text-[13px] font-semibold" style={{ color: INK }}>
                Merhaba, Doğukan
              </div>
              <span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: GRAD }}>
                D
              </span>
            </div>

            {/* skor kartı */}
            <div className="relative mt-3 overflow-hidden rounded-[20px] p-4 text-white" style={{ background: DARK }}>
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(37,99,235,0.5) 0%, transparent 60%)" }}
              />
              <div className="relative flex items-center gap-4">
                <ScoreRing value={1420} max={1900} />
                <div>
                  <div className="text-[10px] font-semibold tracking-[0.1em]" style={{ fontFamily: F.mono, color: "rgba(248,250,252,0.6)" }}>
                    FINDEKS (TAHMİNİ)
                  </div>
                  <div className="mt-0.5 text-[30px] font-extrabold leading-none tracking-tight" style={{ fontFamily: F.display }}>
                    1.420
                  </div>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: "rgba(16,185,129,0.22)", color: "#34D399", fontFamily: F.mono }}>
                    +38 ↑ · İyi
                  </span>
                </div>
              </div>
            </div>

            {/* faktörler */}
            <div className="mt-3.5 space-y-2">
              {[
                { l: "Ödeme düzeni", v: 92 },
                { l: "Kart kullanımı", v: 76 },
                { l: "Borç / gelir", v: 84 },
              ].map((r) => (
                <div key={r.l}>
                  <div className="flex justify-between text-[11.5px] font-medium" style={{ color: SUBTLE }}>
                    <span>{r.l}</span>
                    <span style={{ fontFamily: F.mono, color: MUTED }}>{r.v}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "#E2E8F0" }}>
                    <div className="h-full rounded-full" style={{ width: `${r.v}%`, background: r.v >= 85 ? EMERALD : BLUE }} />
                  </div>
                </div>
              ))}
            </div>

            {/* bu ay yap */}
            <div className="mt-3.5 flex items-center gap-2.5 rounded-2xl border p-2.5" style={{ borderColor: "rgba(37,99,235,0.25)", background: "rgba(37,99,235,0.06)" }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: BLUE }}>
                <Sparkles size={15} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[12px] font-bold" style={{ color: INK }}>
                  Garanti kart borcunu kapat
                </div>
                <div className="text-[10.5px]" style={{ color: MUTED }}>
                  bu ay önceliğin · +15-20 puan
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full opacity-30" style={{ background: INK }} />
        </div>
      </div>

      {/* yüzen rozetler — yalnız geniş ekran */}
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

/* ---------- sayfa ---------- */

export function LandingPage() {
  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} relative min-h-dvh overflow-hidden`}
      style={{ background: BG, color: INK, fontFamily: "var(--font-body)" }}
    >
      <style>{`
        .fin-float { animation: finFloat 6.5s ease-in-out infinite; }
        .fin-floatb { animation: finFloatB 5s ease-in-out infinite; }
        @keyframes finFloat { 0%,100%{transform:translateY(0) rotate(-1.4deg)} 50%{transform:translateY(-16px) rotate(1.4deg)} }
        @keyframes finFloatB { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
        @media (prefers-reduced-motion: reduce){ .fin-float,.fin-floatb{animation:none!important} }
      `}</style>

      {/* arka glow'lar */}
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-56 h-[680px] w-[680px] rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)" }} />
      <div aria-hidden className="pointer-events-none absolute -left-52 top-[440px] h-[560px] w-[560px] rounded-full" style={{ background: "radial-gradient(circle, rgba(5,150,105,0.10) 0%, transparent 60%)" }} />

      {/* nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Brand />
        <nav className="hidden gap-7 text-sm font-medium md:flex" style={{ color: SUBTLE }}>
          <a href="#nasil" className="transition-colors hover:text-[#2563EB]">Nasıl çalışır</a>
          <a href="#findeks" className="transition-colors hover:text-[#2563EB]">Kredi notu</a>
          <a href="#ozellikler" className="transition-colors hover:text-[#2563EB]">Özellikler</a>
          <a href="#fiyat" className="transition-colors hover:text-[#2563EB]">Fiyat</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium transition-colors hover:text-[#2563EB]" style={{ color: SUBTLE }}>
            Giriş yap
          </Link>
          <Link
            href="/register"
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: BLUE, boxShadow: "0 12px 26px rgba(37,99,235,0.28)" }}
          >
            Kayıt ol
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-[5] mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_1fr]">
          <div>
            <Pill tone="blue">
              <ShieldCheck size={13} /> ÜCRETSİZ · FINDEKS TAHMİNİ + KOÇLUK
            </Pill>
            <h1
              className="mt-6 text-[clamp(2.5rem,7vw,5.2rem)] font-bold leading-[1.03] tracking-[-0.035em] [overflow-wrap:anywhere]"
              style={{ fontFamily: F.display }}
            >
              Kredi notunu{" "}
              <span style={{ background: "linear-gradient(120deg,#2563EB,#059669)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                yükselt
              </span>
              , hak ettiğin krediyi al.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed" style={{ color: SUBTLE }}>
              FinOptima kredi sağlığını tahmin eder, kart borçlarını, taksitlerini ve
              faturalarını tek ekranda toplar ve <strong style={{ color: INK }}>bu ay tam olarak
              ne yapman gerektiğini</strong> söyler. Daha iyi krediye ve daha düşük faize giden
              yol burada başlar.
            </p>

            {/* iki buton — taslaktaki gibi */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
                style={{ background: BLUE, boxShadow: "0 14px 32px rgba(37,99,235,0.3)" }}
              >
                Kayıt ol <ArrowRight size={18} />
              </Link>
              <a
                href="#nasil"
                className="inline-flex items-center gap-2 rounded-full border px-7 py-4 text-base font-semibold transition-colors hover:bg-[rgba(15,23,42,0.03)]"
                style={{ borderColor: "rgba(15,23,42,0.14)", color: INK }}
              >
                Bilgi al
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Pill tone="green"><Check size={13} /> Banka ekstresini AI okur</Pill>
              <Pill>KVKK uyumlu</Pill>
              <Pill>Türkiye için</Pill>
            </div>
          </div>

          <ScorePhone />
        </div>

        {/* güven şeridi */}
        <div className="mt-16 grid grid-cols-2 overflow-hidden rounded-[20px] border bg-white lg:grid-cols-4" style={{ borderColor: LINE, boxShadow: "0 10px 28px rgba(15,23,42,0.05)" }}>
          {[
            { n: "Ücretsiz", l: "Kredi notu takibi", s: "tahmini Findeks skoru" },
            { n: "Her banka", l: "Ekstre / dekont okuma", s: "yapay zekâ ile, her dil" },
            { n: "Aylık", l: "Kişisel eylem planı", s: "ne yapacağını söyler" },
            { n: "Tek ekran", l: "Borç · kart · fatura", s: "hepsi bir arada" },
          ].map((s) => (
            <div key={s.l} className="p-6">
              <div className="text-[clamp(1.4rem,3vw,2rem)] font-bold leading-none tracking-tight" style={{ fontFamily: F.display, color: BLUE }}>
                {s.n}
              </div>
              <div className="mt-2 text-sm font-semibold" style={{ color: INK }}>{s.l}</div>
              <div className="mt-0.5 text-[11px]" style={{ fontFamily: F.mono, color: MUTED }}>{s.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* nasıl çalışır */}
      <section id="nasil" className="relative z-[3] mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <Pill>NASIL ÇALIŞIR</Pill>
        <h2 className="mt-5 max-w-2xl text-[clamp(1.7rem,4vw,3.2rem)] font-bold leading-tight tracking-[-0.03em]" style={{ fontFamily: F.display }}>
          Üç adımda kredi sağlığını ele al.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { n: "01", t: "Ekle", d: "Banka ekstreni at ya da harcamanı gir. Hangi banka olursa olsun yapay zekâ okur, kategoriye ayırır.", Icon: FileText },
            { n: "02", t: "Gör", d: "Kredi sağlığını, borçlarını ve hangi alışkanlığın puanını düşürdüğünü tek ekranda gör.", Icon: Gauge },
            { n: "03", t: "Yükselt", d: "Bu ay ne yapman gerektiğini sırayla söyleriz: hangi kartı kapat, hangi faturayı zamanında öde.", Icon: TrendingUp },
          ].map((s) => (
            <div key={s.n} className="rounded-[20px] border bg-white p-7" style={{ borderColor: LINE, boxShadow: "0 10px 28px rgba(15,23,42,0.05)" }}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: GRAD }}>
                <s.Icon size={22} />
              </span>
              <div className="mt-4 text-xs font-bold tracking-[0.1em]" style={{ fontFamily: F.mono, color: MUTED }}>{s.n}</div>
              <h3 className="mt-1 text-2xl font-bold tracking-[-0.02em]" style={{ fontFamily: F.display }}>{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: SUBTLE }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* findeks kredi notu */}
      <section id="findeks" className="relative z-[3] mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="relative overflow-hidden rounded-[28px] px-6 py-12 text-white sm:px-10" style={{ background: DARK }}>
          <div aria-hidden className="pointer-events-none absolute -right-28 -top-44 h-[460px] w-[460px] rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 60%)" }} />
          <div aria-hidden className="pointer-events-none absolute -bottom-44 -left-28 h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(circle, rgba(5,150,105,0.22) 0%, transparent 60%)" }} />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <span className="inline-flex rounded-full bg-[rgba(255,255,255,0.12)] px-3.5 py-1.5 text-xs font-semibold">
                KREDİ NOTU = DAHA İYİ KREDİ
              </span>
              <h2 className="mt-5 text-[clamp(1.7rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.03em]" style={{ fontFamily: F.display }}>
                Türkiye&apos;de kredi notun kapıları açar.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed" style={{ color: "rgba(248,250,252,0.78)" }}>
                Ev kredisi, taşıt kredisi, daha yüksek kart limiti, daha düşük faiz —
                hepsi kredi notuna bakar. FinOptima notunu tahmin eder ve onu yükselten
                somut adımları sıralar. Resmî Findeks raporunu da yükleyebilirsin.
              </p>
              <ul className="mt-6 grid gap-2.5">
                {[
                  "Yüksek faizli kart borcunu önce kapat",
                  "Kart kullanımını limitin %30 altında tut",
                  "Elektrik, doğalgaz, faturaları zamanında öde",
                  "Taksitlerini ve kredilerini tek yerde izle",
                ].map((p) => (
                  <li key={p} className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)" }}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(52,211,153,0.18)", color: "#34D399" }}>
                      <Check size={13} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-center gap-6 rounded-[22px] bg-[rgba(255,255,255,0.05)] p-7">
              <BigGauge />
              <div className="flex-1">
                {[
                  { l: "Ödeme düzeni", v: 92 },
                  { l: "Kart kullanımı", v: 76 },
                  { l: "Borç / gelir", v: 84 },
                  { l: "Kredi yaşı", v: 68 },
                ].map((r) => (
                  <div key={r.l} className="mb-2.5">
                    <div className="flex justify-between text-[13px] font-medium">
                      <span>{r.l}</span>
                      <span className="text-[11px]" style={{ fontFamily: F.mono, color: "rgba(248,250,252,0.6)" }}>{r.v}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)]">
                      <div className="h-full rounded-full" style={{ width: `${r.v}%`, background: r.v >= 85 ? "#34D399" : "#60A5FA" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* özellikler */}
      <section id="ozellikler" className="relative z-[3] mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <Pill>ÖZELLİKLER</Pill>
        <h2 className="mt-5 max-w-2xl text-[clamp(1.7rem,4vw,3.2rem)] font-bold leading-tight tracking-[-0.03em]" style={{ fontFamily: F.display }}>
          Türk cüzdanına göre tasarlandı.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { Icon: Gauge, title: "Kredi notu koçluğu", desc: "Tahmini Findeks skorun + onu yükseltmek için bu ay yapılacaklar, önem sırasıyla.", c: BLUE },
            { Icon: FileText, title: "Her banka ekstresi", desc: "Garanti, Enpara, Yapı Kredi ya da tanımadığın banka — yapay zekâ ekstreni/dekontunu okur.", c: EMERALD },
            { Icon: ReceiptText, title: "Fiş & fatura okuma", desc: "Fişin fotoğrafını çek; tutar, tarih, satıcı otomatik çıkar. Faturalarını takvimle izle.", c: BLUE },
            { Icon: CreditCard, title: "Kart & taksit takibi", desc: "Kredi kartı, taksit, kredi — Türkiye'nin taksit kültürüne göre tek panel.", c: EMERALD },
            { Icon: TrendingUp, title: "Borç kapatma planı", desc: "Hangi borcu önce kapatmalısın? Faiz yükünü düşüren sırayı hesaplarız.", c: BLUE },
            { Icon: ShieldCheck, title: "Gizlilik & KVKK", desc: "Argon2 şifre, 2FA, denetim günlüğü. Verilerin Türkiye standartlarında korunur.", c: EMERALD },
          ].map((f) => (
            <div key={f.title} className="rounded-[20px] border bg-white p-6 transition-shadow hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]" style={{ borderColor: LINE, boxShadow: "0 10px 28px rgba(15,23,42,0.05)" }}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: f.c }}>
                <f.Icon size={20} />
              </span>
              <h3 className="mt-4 text-xl font-bold tracking-[-0.02em]" style={{ fontFamily: F.display }}>{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: SUBTLE }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* fiyat */}
      <section id="fiyat" className="relative z-[3] mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <Pill>FİYAT</Pill>
        <h2 className="mt-5 max-w-xl text-[clamp(1.7rem,4vw,2.8rem)] font-bold leading-tight tracking-[-0.03em]" style={{ fontFamily: F.display }}>
          Başlamak ücretsiz.
        </h2>
        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          {[
            { name: "ÜCRETSİZ", price: "₺0", desc: "Kredi notu koçluğu ve temel takip.", features: ["Tahmini Findeks notu + koçluk", "Banka ekstresi okuma", "Fiş & fatura takibi", "Borç & kart yönetimi", "Sınırsız işlem"], pro: false },
            { name: "PRO", price: "Yakında", desc: "Daha derin otomasyon ve aile hesabı.", features: ["Resmî Findeks rapor yükleme", "Otomatik kategori öğrenme", "Çok hesaplı aile", "İleri borç stratejisi", "Öncelikli destek"], pro: true },
          ].map((p) => (
            <div key={p.name} className="relative overflow-hidden rounded-[24px] p-8" style={{ background: p.pro ? DARK : "#FFFFFF", color: p.pro ? "#F8FAFC" : INK, border: p.pro ? "none" : `1px solid ${LINE}` }}>
              {p.pro && <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 60%)" }} />}
              <div className="relative">
                <div className="text-xs font-semibold tracking-wide" style={{ fontFamily: F.mono, color: p.pro ? "#60A5FA" : BLUE }}>PLAN · {p.name}</div>
                <div className="mt-3 text-[clamp(2.4rem,6vw,3.6rem)] font-extrabold tracking-tight" style={{ fontFamily: F.display }}>
                  {p.price}
                  {!p.pro && <span className="ml-1 text-base font-normal" style={{ color: MUTED }}>/ ay</span>}
                </div>
                <p className="mt-2 text-[15px]" style={{ color: p.pro ? "rgba(248,250,252,0.78)" : SUBTLE }}>{p.desc}</p>
                <ul className="my-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-md" style={{ background: p.pro ? "rgba(248,250,252,0.12)" : "rgba(5,150,105,0.1)", color: p.pro ? "#F8FAFC" : EMERALD }}>
                        <Check size={11} />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="block rounded-full py-3.5 text-center text-[15px] font-bold transition-transform hover:-translate-y-0.5" style={{ background: p.pro ? "#F8FAFC" : BLUE, color: p.pro ? INK : "#FFFFFF" }}>
                  {p.pro ? "Haber ver" : "Ücretsiz kayıt ol"} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-[3] mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="relative overflow-hidden rounded-[28px] px-6 py-14 text-white sm:px-12" style={{ background: GRAD }}>
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-[460px] w-[460px] rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 60%)" }} />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-[clamp(1.7rem,4vw,2.8rem)] font-bold leading-tight tracking-[-0.03em]" style={{ fontFamily: F.display }}>
                Kredi notunu bugün öğren.
              </h2>
              <p className="mt-3 max-w-lg text-[15px]" style={{ color: "rgba(255,255,255,0.9)" }}>
                Birkaç dakikada kurulur. Ücretsiz başla, notunu yükseltmeye başla.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link href="/register" className="rounded-full bg-white px-8 py-4 text-base font-bold" style={{ color: BLUE, boxShadow: "0 14px 30px rgba(0,0,0,0.16)" }}>
                Kayıt ol →
              </Link>
              <Link href="/login" className="rounded-full border border-white/40 px-7 py-4 text-base font-semibold text-white">
                Giriş yap
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-[3] mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-8">
        <div className="grid gap-8 border-t py-9 sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
          <div>
            <Brand />
            <p className="mt-3.5 max-w-[240px] text-sm leading-relaxed" style={{ color: SUBTLE }}>
              Kredi notunu yükselt, paranı kontrol et.
            </p>
          </div>
          {[
            { h: "ÜRÜN", items: ["Kredi notu", "Özellikler", "Fiyat"] },
            { h: "ŞİRKET", items: ["Hakkımızda", "İletişim"] },
            { h: "YASAL", items: ["Gizlilik", "KVKK", "Çerezler"] },
          ].map((col) => (
            <div key={col.h}>
              <div className="mb-3.5 text-[12.5px] font-bold tracking-[0.06em]" style={{ color: INK }}>{col.h}</div>
              {col.items.map((l) => (
                <Link key={l} href="/gizlilik" className="block py-1 text-sm font-medium transition-colors hover:text-[#2563EB]" style={{ color: SUBTLE }}>
                  {l}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 border-t pt-4 text-[13px] sm:flex-row sm:justify-between" style={{ borderColor: "rgba(15,23,42,0.08)", color: MUTED }}>
          <span>© 2026 FinOptima · Türkiye&apos;de geliştirildi</span>
          <span>BETA</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- görseller ---------- */

function ScoreRing({ value, max }: { value: number; max: number }) {
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

function BigGauge() {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const pct = 1420 / 1900;
  return (
    <div className="relative hidden h-36 w-36 shrink-0 sm:block">
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
        <span className="text-[32px] font-extrabold leading-none tracking-tight" style={{ fontFamily: F.display }}>1.420</span>
        <span className="text-[11px] font-semibold" style={{ color: "#34D399" }}>+38 ↑ İyi</span>
      </div>
    </div>
  );
}
