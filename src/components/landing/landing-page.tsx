import Link from "next/link";
import { Space_Grotesk, DM_Sans, JetBrains_Mono } from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const F = { display: "var(--font-display)", mono: "var(--font-mono)" };
const GRAD = "linear-gradient(120deg, #2046ff 0%, #7c5cff 100%)";

/* ---------- parçalar ---------- */

function Brand({ light }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-[11px] text-[17px] font-bold text-white"
        style={{ background: GRAD, fontFamily: F.display, letterSpacing: "-0.04em", fontSize: 14 }}
      >
        Fo
      </span>
      <span
        className="text-xl font-bold tracking-tight"
        style={{ fontFamily: F.display, color: light ? "#fafaf7" : "#0b0c10" }}
      >
        FinOptima
      </span>
    </span>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "violet" | "green";
}) {
  const tones = {
    default: "bg-[rgba(11,12,16,0.05)] text-[#2d3038]",
    accent: "bg-[rgba(32,70,255,0.1)] text-[#2046ff]",
    violet: "bg-[rgba(124,92,255,0.1)] text-[#7c5cff]",
    green: "bg-[rgba(14,138,71,0.1)] text-[#0e8a47]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/* iPhone mockup — basit panel içeriğiyle */
function HeroPhone() {
  return (
    <div className="relative flex justify-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-12 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background:
            "conic-gradient(from 90deg, rgba(32,70,255,0.1), rgba(124,92,255,0.1), rgba(32,70,255,0.1))",
        }}
      />
      <div
        className="relative z-10 w-[280px] rounded-[44px] p-2.5 sm:w-[300px]"
        style={{
          background: "#0b0c10",
          boxShadow: "0 50px 100px rgba(11,12,16,0.3)",
          animation: "nvFloat 6s ease-in-out infinite",
        }}
      >
        <div className="relative overflow-hidden rounded-[34px] bg-[#fafaf7]">
          <div className="absolute left-1/2 top-3.5 z-10 h-6 w-20 -translate-x-1/2 rounded-full bg-black" />
          <div className="px-4 pb-6 pt-12">
            <div className="text-[13px] font-medium text-[#7e8497]">
              Günaydın, Ada
            </div>
            {/* bakiye kartı */}
            <div
              className="relative mt-2 overflow-hidden rounded-[18px] p-4 text-[#fafaf7]"
              style={{ background: "linear-gradient(135deg, #0b0c10 0%, #1d2030 100%)" }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(32,70,255,0.4) 0%, transparent 60%)" }}
              />
              <div className="relative">
                <div className="text-[10px] font-semibold tracking-[0.08em] text-[rgba(250,250,247,0.6)]" style={{ fontFamily: F.mono }}>
                  TOPLAM BAKİYE
                </div>
                <div className="mt-1 text-[30px] font-extrabold tracking-tight" style={{ fontFamily: F.display }}>
                  ₺ 38.420
                </div>
                <span
                  className="mt-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold text-[#e6ff42]"
                  style={{ background: "rgba(230,255,66,0.2)", fontFamily: F.mono }}
                >
                  + 4.180 ↗
                </span>
              </div>
            </div>
            {/* hızlı aksiyonlar */}
            <div className="mt-3.5 grid grid-cols-4 gap-1.5">
              {[
                { i: "+", l: "Ekle", a: true },
                { i: "⇄", l: "Aktar" },
                { i: "▢", l: "OCR" },
                { i: "✦", l: "Plan" },
              ].map((q) => (
                <div key={q.l} className="text-center">
                  <div
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-[13px] text-base font-semibold"
                    style={{
                      background: q.a ? "#2046ff" : "#f3f2ec",
                      color: q.a ? "#fff" : "#0b0c10",
                    }}
                  >
                    {q.i}
                  </div>
                  <div className="mt-1 text-[10px] text-[#7e8497]">{q.l}</div>
                </div>
              ))}
            </div>
            {/* işlem listesi */}
            <div className="mt-3.5 space-y-1">
              {[
                { t: "Migros", c: "Market", v: "−₺ 540", e: "🛒" },
                { t: "Maaş", c: "Gelir", v: "+₺ 62.000", e: "💼" },
                { t: "Netflix", c: "Abonelik", v: "−₺ 199", e: "▶" },
              ].map((r) => (
                <div key={r.t} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3f2ec] text-sm">
                    {r.e}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] font-semibold text-[#0b0c10]">{r.t}</div>
                    <div className="text-[10px] text-[#7e8497]">{r.c}</div>
                  </div>
                  <span
                    className={`text-[12px] font-semibold ${r.v.startsWith("+") ? "text-[#0e8a47]" : "text-[#0b0c10]"}`}
                    style={{ fontFamily: F.mono }}
                  >
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-[#0b0c10] opacity-40" />
        </div>
      </div>

      {/* yüzen bildirimler — yalnız geniş ekran */}
      <div
        className="absolute right-0 top-16 hidden max-w-[230px] items-center gap-3 rounded-[18px] border border-[rgba(11,12,16,0.07)] bg-white p-3.5 shadow-[0_24px_50px_rgba(11,12,16,0.16)] lg:flex"
        style={{ animation: "nvSubtle 5s ease-in-out infinite 0.6s" }}
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
          style={{ background: GRAD }}
        >
          ✦
        </span>
        <div>
          <div className="text-[13px] font-semibold text-[#0b0c10]">Findeks +38 puan</div>
          <div className="text-[11.5px] text-[#7e8497]">son 7 gün</div>
        </div>
      </div>
      <div
        className="absolute -left-2 bottom-28 hidden max-w-[230px] items-center gap-3 rounded-[18px] border border-[rgba(11,12,16,0.07)] bg-white p-3.5 shadow-[0_24px_50px_rgba(11,12,16,0.16)] lg:flex"
        style={{ animation: "nvSubtle 5s ease-in-out infinite 1.4s" }}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(14,138,71,0.1)] text-lg text-[#0e8a47]">
          ✓
        </span>
        <div>
          <div className="text-[13px] font-semibold text-[#0b0c10]">Migros fişi okundu</div>
          <div className="text-[11.5px] text-[#7e8497]">cihazda · 0,6 sn</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- sayfa ---------- */

export function LandingPage() {
  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} relative min-h-dvh overflow-hidden bg-[#fafaf7] text-[#0b0c10]`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-60 h-[700px] w-[700px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(32,70,255,0.12) 0%, transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-52 top-[420px] h-[600px] w-[600px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,92,255,0.1) 0%, transparent 60%)" }}
      />

      {/* nav */}
      <header className="relative z-10 flex items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Brand />
        <nav className="hidden gap-7 text-sm font-medium text-[#2d3038] md:flex">
          <a href="#ozellikler" className="hover:text-[#2046ff]">Özellikler</a>
          <a href="#gizlilik" className="hover:text-[#2046ff]">Gizlilik</a>
          <a href="#findeks" className="hover:text-[#2046ff]">Findeks</a>
          <a href="#fiyat" className="hover:text-[#2046ff]">Fiyat</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-[#2d3038] hover:text-[#2046ff]">
            Giriş
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-[#0b0c10] px-5 py-2.5 text-sm font-semibold text-[#fafaf7] shadow-[0_14px_30px_rgba(11,12,16,0.18)] transition-transform hover:-translate-y-0.5"
          >
            Ücretsiz dene
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-[5] px-5 pt-8 sm:px-8 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Badge tone="accent">YENİ · BETA · DAVET KODU GEREKLİ</Badge>
            <h1
              className="mt-6 text-[clamp(2.4rem,7vw,5.5rem)] font-bold leading-[1.02] tracking-[-0.035em] [overflow-wrap:anywhere]"
              style={{ fontFamily: F.display }}
            >
              Paranı, borçlarını ve{" "}
              <span
                style={{
                  background: GRAD,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Findeks skorunu
              </span>{" "}
              tek yerde topla.
            </h1>
            <p className="mt-6 max-w-lg text-[17px] leading-relaxed text-[#2d3038]">
              FinOptima; harcama takibi, banka entegrasyonu, ajanda, senaryo
              simülasyonu ve Findeks tahmin motorunu tek uygulamada birleştirir.
              Türkiye&apos;de bu kadarını aynı anda çözen başka uygulama yok.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-[#0b0c10] px-7 py-4 text-base font-semibold text-[#fafaf7] shadow-[0_14px_30px_rgba(11,12,16,0.18)] transition-transform hover:-translate-y-0.5"
              >
                Davet kodumu kullan →
              </Link>
              <a
                href="#nasil"
                className="rounded-full border border-[rgba(11,12,16,0.12)] px-7 py-4 text-base font-medium text-[#0b0c10]"
              >
                Nasıl çalışır
              </a>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Badge tone="green">✓ Cihaz-içi OCR</Badge>
              <Badge>KVKK</Badge>
              <Badge>Davet kodu ile</Badge>
            </div>
          </div>
          <HeroPhone />
        </div>

        {/* güven şeridi */}
        <div className="mt-16 grid grid-cols-2 overflow-hidden rounded-[20px] border border-[#e9e8e2] bg-white shadow-[0_10px_28px_rgba(11,12,16,0.05)] lg:grid-cols-4">
          {[
            { n: "6", l: "Banka entegrasyonu", s: "Enpara · Garanti · YKB +3" },
            { n: "5", l: "Findeks faktörü", s: "5 faktörlü tahmin" },
            { n: "%100", l: "Cihaz-içi OCR", s: "Tesseract.js · WASM" },
            { n: "6 ay", l: "Öngörü ufku", s: "± güven aralığı" },
          ].map((s) => (
            <div key={s.l} className="p-6">
              <div className="text-[clamp(2rem,4vw,3rem)] font-bold leading-none tracking-tight" style={{ fontFamily: F.display }}>
                {s.n}
              </div>
              <div className="mt-2 text-sm font-semibold text-[#2d3038]">{s.l}</div>
              <div className="mt-0.5 text-[11px] text-[#7e8497]" style={{ fontFamily: F.mono }}>
                {s.s}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* nasıl çalışır */}
      <section id="nasil" className="relative z-[3] px-5 py-20 sm:px-8">
        <Badge>NASIL ÇALIŞIR</Badge>
        <h2
          className="mt-5 max-w-2xl text-[clamp(1.7rem,4vw,3.4rem)] font-bold leading-tight tracking-[-0.03em] [overflow-wrap:anywhere]"
          style={{ fontFamily: F.display }}
        >
          Üç adım. Bir ekran. Tüm finansın.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { n: "01", t: "Bağla", d: "Banka dökümünü sürükle bırak. Enpara, Garanti, YKB, Ziraat — kolon eşlemesi yok.", c: "#2046ff" },
            { n: "02", t: "Tara", d: "Fişi fotoğrafla. OCR senin telefonunda çalışır, fotoğraf sunucuya gitmez.", c: "#7c5cff" },
            { n: "03", t: "İzle", d: "FinOptima skoru, 6 ay öngörüyü ve öneriyi hazırlar. Sen sadece karar verirsin.", c: "#0e8a47" },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-[20px] border border-[#e9e8e2] bg-white p-7 shadow-[0_10px_28px_rgba(11,12,16,0.05)]"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
                style={{ background: s.c, fontFamily: F.mono }}
              >
                {s.n}
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-[-0.02em]" style={{ fontFamily: F.display }}>
                {s.t}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#2d3038]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* gizlilik */}
      <section id="gizlilik" className="relative z-[3] px-5 py-8 sm:px-8">
        <div
          className="relative overflow-hidden rounded-[32px] px-6 py-12 text-[#fafaf7] sm:px-10"
          style={{ background: "linear-gradient(135deg, #0b0c10 0%, #1d2030 100%)" }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-28 -top-44 h-[480px] w-[480px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(32,70,255,0.3) 0%, transparent 60%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-44 -left-28 h-[420px] w-[420px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(230,255,66,0.12) 0%, transparent 60%)" }}
          />
          <div className="relative">
            <span className="inline-flex rounded-full bg-[rgba(255,255,255,0.12)] px-3.5 py-1.5 text-xs font-semibold">
              GİZLİLİK MİMARİSİ
            </span>
            <h2
              className="mt-5 max-w-2xl text-[clamp(1.7rem,4vw,3.4rem)] font-bold leading-[1.06] tracking-[-0.03em] [overflow-wrap:anywhere]"
              style={{ fontFamily: F.display }}
            >
              Fiş fotoğrafı senin telefonundan çıkmaz.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[rgba(250,250,247,0.78)]">
              OCR sunucuda değil, Tesseract.js ile cihazda çalışır. Sunucuya
              yalnız işlenmiş üç alan gönderilir: tutar, tarih, satıcı.
              Fotoğrafın hiçbir bulutta saklanmaz.
            </p>
            <div className="mt-7 grid max-w-2xl gap-2.5">
              {[
                "Tesseract.js — cihaz-içi okuma",
                "Sunucuya yalnız 3 alan: tutar · tarih · satıcı",
                "Argon2id şifre hash · 2FA · JWT oturum",
                "Satır-bazlı izolasyon · Zod doğrulama",
                "Upstash hız sınırlama · denetim günlüğü",
              ].map((p) => (
                <div
                  key={p}
                  className="flex items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] px-4 py-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(63,212,122,0.18)] text-xs text-[#3fd47a]">
                    ✓
                  </span>
                  <span className="text-sm font-medium">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* özellikler */}
      <section id="ozellikler" className="relative z-[3] px-5 py-16 sm:px-8">
        <Badge>ÖZELLİKLER</Badge>
        <h2
          className="mt-5 max-w-2xl text-[clamp(1.7rem,4vw,3.4rem)] font-bold leading-tight tracking-[-0.03em] [overflow-wrap:anywhere]"
          style={{ fontFamily: F.display }}
        >
          Bankalarınla konuşan, ajandanı bilen, skorunu hesaplayan asistan.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { num: "01", title: "Harcama takibi", desc: "Manuel giriş, banka dökümü ve fiş — hepsi kurallarla otomatik kategorilenir.", c: "#2046ff" },
            { num: "02", title: "Takvim entegre", desc: "Faturalar, hatırlatmalar ve etkinlikler aynı zaman çizgisinde.", c: "#7c5cff" },
            { num: "03", title: "Cihaz-içi OCR", desc: "Fiş fotoğrafı telefonunda okunur; sunucuya yalnız veri gider.", c: "#0e8a47" },
            { num: "04", title: "6 aylık öngörü", desc: "Hareketli ortalama + trend ile nakit akışı tahmini ve belirsizlik bandı.", c: "#d97706" },
            { num: "05", title: "Findeks tahmini", desc: "Beş faktörlü tahmini skor. Resmî KKB raporu PDF'i de yüklenebilir.", c: "#ff6a4d" },
            { num: "06", title: "Borç & strateji", desc: "Kredi kartı, kredi, BES — agresif / dengeli / güvenli presetler.", c: "#2046ff" },
          ].map((f) => (
            <div
              key={f.num}
              className="rounded-[20px] border border-[#e9e8e2] bg-white p-6 shadow-[0_10px_28px_rgba(11,12,16,0.05)]"
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white"
                style={{ background: f.c, fontFamily: F.mono }}
              >
                {f.num}
              </div>
              <h3 className="mt-4 text-xl font-bold tracking-[-0.02em]" style={{ fontFamily: F.display }}>
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#2d3038]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* findeks + öngörü */}
      <section id="findeks" className="relative z-[3] grid gap-5 px-5 py-8 sm:px-8 lg:grid-cols-2">
        <div className="rounded-[20px] border border-[#e9e8e2] bg-white p-7 shadow-[0_10px_28px_rgba(11,12,16,0.05)]">
          <Badge tone="accent">FINDEKS TAHMİN MOTORU</Badge>
          <h3 className="mt-4 text-2xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-3xl" style={{ fontFamily: F.display }}>
            Skorunu izle, hangi alışkanlığın puanını düşürdüğünü gör.
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#2d3038]">
            Beş faktörlü model: ödeme düzenliliği, kart kullanımı, borç/gelir,
            kredi yaşı, çeşitlilik.
          </p>
          <div className="mt-6 flex items-center gap-5">
            <FindeksGauge />
            <div className="flex-1">
              {[
                { l: "Ödeme düzenliliği", v: 92 },
                { l: "Kart kullanımı", v: 76 },
                { l: "Borç / gelir", v: 84 },
                { l: "Kredi yaşı", v: 68 },
              ].map((r) => (
                <div key={r.l} className="mb-2.5">
                  <div className="flex justify-between text-[13px] font-medium">
                    <span>{r.l}</span>
                    <span className="text-[11px] text-[#7e8497]" style={{ fontFamily: F.mono }}>
                      {r.v}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f3f2ec]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${r.v}%`, background: r.v >= 80 ? "#0e8a47" : "#2046ff" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-[20px] border border-[#e9e8e2] bg-white p-7 shadow-[0_10px_28px_rgba(11,12,16,0.05)]">
          <Badge tone="violet">6 AYLIK NAKİT ÖNGÖRÜSÜ</Badge>
          <h3 className="mt-4 text-2xl font-bold tracking-[-0.02em] [overflow-wrap:anywhere] sm:text-3xl" style={{ fontFamily: F.display }}>
            Hangi ay sıfıra yaklaşıyorsun?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#2d3038]">
            Hareketli ortalama + trend + belirsizlik bandı. Yaklaşan faturalar
            takvimden çekilir.
          </p>
          <ForecastChart />
          <div className="mt-3 rounded-2xl bg-[rgba(255,106,77,0.1)] px-3.5 py-2.5 text-[13px] font-semibold text-[#ff6a4d]">
            ⚠ Ağustos bakiyesi ₺30K&apos;ye yaklaşıyor — tasarrufu gözden geçir.
          </div>
        </div>
      </section>

      {/* fiyat */}
      <section id="fiyat" className="relative z-[3] px-5 py-16 sm:px-8">
        <Badge>FİYAT</Badge>
        <h2
          className="mt-5 max-w-xl text-[clamp(1.7rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em] [overflow-wrap:anywhere]"
          style={{ fontFamily: F.display }}
        >
          Bireyler için ücretsiz. İleride pro modüller.
        </h2>
        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          {[
            {
              name: "ÜCRETSİZ",
              price: "₺0",
              desc: "Tüm temel modüller. Davet kodu ile kayıt.",
              features: ["Sınırsız işlem", "Banka dökümü içe aktarma", "Cihaz-içi fiş OCR", "Findeks tahmini", "6 aylık öngörü", "Tema kişiselleştirme"],
              pro: false,
            },
            {
              name: "PRO",
              price: "₺79",
              desc: "Çok hesaplı aile + ileri strateji modülleri.",
              features: ["Çoklu kullanıcı", "AI ödeme otomasyonu", "Resmî KKB rapor yükleme", "BES & yatırım takibi", "Öncelikli destek", "Erken erişim"],
              pro: true,
            },
          ].map((p) => (
            <div
              key={p.name}
              className="relative overflow-hidden rounded-[24px] p-8"
              style={{
                background: p.pro ? "linear-gradient(135deg, #0b0c10 0%, #1d2030 100%)" : "#ffffff",
                color: p.pro ? "#fafaf7" : "#0b0c10",
                border: p.pro ? "none" : "1px solid #e9e8e2",
              }}
            >
              {p.pro && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(124,92,255,0.4) 0%, transparent 60%)" }}
                />
              )}
              <div className="relative">
                <div
                  className="text-xs font-semibold tracking-wide"
                  style={{ fontFamily: F.mono, color: p.pro ? "#7c5cff" : "#2046ff" }}
                >
                  PLAN · {p.name}
                </div>
                <div className="mt-3 text-[clamp(2.6rem,7vw,4rem)] font-extrabold tracking-tight" style={{ fontFamily: F.display }}>
                  {p.price}
                  <span className="ml-1 text-base font-normal" style={{ color: p.pro ? "rgba(250,250,247,0.6)" : "#7e8497" }}>
                    / ay
                  </span>
                </div>
                <p className="mt-2 text-[15px]" style={{ color: p.pro ? "rgba(250,250,247,0.78)" : "#2d3038" }}>
                  {p.desc}
                </p>
                <ul className="my-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <span
                        className="flex h-[18px] w-[18px] items-center justify-center rounded-md text-[10px]"
                        style={{
                          background: p.pro ? "rgba(250,250,247,0.12)" : "rgba(14,138,71,0.1)",
                          color: p.pro ? "#fafaf7" : "#0e8a47",
                        }}
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="block rounded-full py-3.5 text-center text-[15px] font-bold"
                  style={{
                    background: p.pro ? "#fafaf7" : "#0b0c10",
                    color: p.pro ? "#0b0c10" : "#fafaf7",
                  }}
                >
                  {p.pro ? "Pro'ya geç" : "Davet kodumu kullan"} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA şeridi */}
      <section className="relative z-[3] px-5 py-8 sm:px-8">
        <div
          className="relative overflow-hidden rounded-[28px] px-6 py-14 text-white sm:px-12"
          style={{ background: GRAD }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-32 h-[460px] w-[460px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(230,255,66,0.38) 0%, transparent 60%)" }}
          />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-[clamp(1.7rem,4vw,3rem)] font-bold leading-tight tracking-[-0.03em]" style={{ fontFamily: F.display }}>
                Paranı tanı. Geleceğini planla.
              </h2>
              <p className="mt-3 max-w-lg text-[15px] text-[rgba(255,255,255,0.85)]">
                Davet kodun varsa hemen başla — birkaç dakikada kurulur.
              </p>
            </div>
            <Link
              href="/register"
              className="shrink-0 rounded-full bg-white px-8 py-4 text-base font-bold text-[#2046ff] shadow-[0_14px_30px_rgba(0,0,0,0.18)]"
            >
              Hemen başla →
            </Link>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-[3] px-5 pb-10 pt-8 sm:px-8">
        <div className="grid gap-8 border-t border-[rgba(11,12,16,0.07)] py-9 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Brand />
            <p className="mt-3.5 max-w-[240px] text-sm leading-relaxed text-[#2d3038]">
              Paranı tanı, geleceğini planla.
            </p>
          </div>
          {[
            { h: "ÜRÜN", items: ["Özellikler", "Findeks", "Fiyat"] },
            { h: "ŞİRKET", items: ["Hakkımızda", "İletişim"] },
            { h: "YASAL", items: ["Gizlilik", "KVKK", "Çerezler"] },
          ].map((col) => (
            <div key={col.h}>
              <div className="mb-3.5 text-[12.5px] font-bold tracking-[0.06em] text-[#0b0c10]">
                {col.h}
              </div>
              {col.items.map((l) => (
                <Link
                  key={l}
                  href="/gizlilik"
                  className="block py-1 text-sm font-medium text-[#2d3038] hover:text-[#2046ff]"
                >
                  {l}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-1 border-t border-[rgba(11,12,16,0.07)] pt-4 text-[13px] text-[#7e8497] sm:flex-row sm:justify-between">
          <span>© 2026 FinOptima · Made in Türkiye</span>
          <span>v 0.3.0 · BETA</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- görseller ---------- */

function FindeksGauge() {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const pct = 1642 / 1900;
  return (
    <div className="relative hidden h-36 w-36 shrink-0 sm:block">
      <svg viewBox="0 0 150 150" className="h-full w-full">
        <defs>
          <linearGradient id="lg-fg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#2046ff" />
            <stop offset="100%" stopColor="#7c5cff" />
          </linearGradient>
        </defs>
        <circle cx="75" cy="75" r={r} fill="none" stroke="#f3f2ec" strokeWidth="11" />
        <circle
          cx="75"
          cy="75"
          r={r}
          fill="none"
          stroke="url(#lg-fg)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          transform="rotate(-90 75 75)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ fontFamily: F.mono }}>
        <span className="text-[9px] font-semibold tracking-[0.1em] text-[#7e8497]">FINDEKS</span>
        <span className="text-[34px] font-extrabold leading-none tracking-tight" style={{ fontFamily: F.display }}>
          1642
        </span>
        <span className="text-[11px] font-semibold text-[#0e8a47]">+38 ↑</span>
      </div>
    </div>
  );
}

function ForecastChart() {
  const w = 520;
  const h = 190;
  const vals = [38, 36, 32, 30, 33, 31];
  const months = ["MAY", "HAZ", "TEM", "AĞU", "EYL", "EKİ"];
  const max = 48;
  const min = 18;
  const sx = (i: number) => 28 + (i * (w - 56)) / (vals.length - 1);
  const sy = (v: number) => h - 34 - ((v - min) / (max - min)) * (h - 64);
  const line = vals.map((v, i) => (i === 0 ? "M " : "L ") + sx(i) + " " + sy(v)).join(" ");
  const upper = vals.map((v) => v + 6);
  const lower = vals.map((v) => v - 5);
  const band =
    upper.map((v, i) => (i === 0 ? "M " : "L ") + sx(i) + " " + sy(v)).join(" ") +
    " " +
    lower.map((_, i) => "L " + sx(lower.length - 1 - i) + " " + sy(lower[lower.length - 1 - i])).join(" ") +
    " Z";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-5 w-full">
      {[20, 30, 40].map((y) => (
        <line key={y} x1={28} x2={w - 28} y1={sy(y)} y2={sy(y)} stroke="rgba(11,12,16,0.07)" strokeWidth="0.5" />
      ))}
      <path d={band} fill="#7c5cff" opacity={0.14} />
      <path d={line} fill="none" stroke="#2046ff" strokeWidth="2.4" />
      {vals.map((v, i) => (
        <circle key={i} cx={sx(i)} cy={sy(v)} r={4} fill="#ffffff" stroke="#2046ff" strokeWidth="2" />
      ))}
      {months.map((m, i) => (
        <text key={m} x={sx(i)} y={h - 10} fontFamily="var(--font-mono)" fontSize="10" textAnchor="middle" fill="#7e8497">
          {m}
        </text>
      ))}
    </svg>
  );
}
