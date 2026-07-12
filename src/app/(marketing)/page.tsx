import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShieldCheck,
  Check,
  FileText,
  Gauge,
  TrendingUp,
  ReceiptText,
  CreditCard,
  Sparkles,
  ArrowRight,
  Bot,
  Lock,
  CalendarClock,
} from "lucide-react";
import { auth } from "@/auth";
import {
  Pill,
  Section,
  SectionTitle,
  Lead,
  CTAButton,
  FeatureCard,
  Card,
  DarkPanel,
  GradientCTA,
  StatStrip,
  PageGlows,
} from "@/components/marketing/kit";
import { ScorePhone, BigGauge } from "@/components/marketing/score-phone";
import { INK, SUBTLE, MUTED, BLUE, EMERALD, LINE, DARK, GRAD } from "@/components/marketing/theme";
import { F } from "@/components/marketing/fonts";

export const metadata: Metadata = {
  title: { absolute: "FinOptima — Kredi notunu yükselt, paranı kontrol et" },
  description:
    "Tahmini Findeks kredi notu, banka ekstresi okuyan yapay zekâ ve bu ay ne yapman gerektiğini söyleyen kişisel koçluk. Ücretsiz başla.",
};

const STEPS = [
  { n: "01", t: "Ekle", d: "Banka ekstreni yükle ya da harcamanı anlat. Hangi banka olursa olsun yapay zekâ okur, kategoriye ayırır.", Icon: FileText },
  { n: "02", t: "Gör", d: "Kredi sağlığını, borçlarını ve hangi alışkanlığın puanını düşürdüğünü tek ekranda gör.", Icon: Gauge },
  { n: "03", t: "Yükselt", d: "Bu ay ne yapman gerektiğini sırayla söyleriz: hangi kartı kapat, hangi faturayı zamanında öde.", Icon: TrendingUp },
];

const FEATURES = [
  { Icon: Gauge, title: "Kredi notu koçluğu", desc: "Tahmini Findeks skorun + onu yükseltmek için bu ay yapılacaklar, önem sırasıyla.", c: BLUE },
  { Icon: Bot, title: "AI asistan", desc: "“Dün markete 350 verdim” de, senin için işlemi girsin. Sorularını eldeki verinle yanıtlasın.", c: EMERALD },
  { Icon: FileText, title: "Her banka ekstresi", desc: "Garanti, Enpara, Yapı Kredi ya da tanımadığın banka — yapay zekâ ekstreni/dekontunu okur.", c: BLUE },
  { Icon: ReceiptText, title: "Fiş & fatura okuma", desc: "Fişin fotoğrafını çek; tutar, tarih, satıcı otomatik çıkar. Faturalarını takvimle izle.", c: EMERALD },
  { Icon: CreditCard, title: "Kart & taksit takibi", desc: "Kredi kartı, taksit, kredi — Türkiye'nin taksit kültürüne göre tek panel.", c: BLUE },
  { Icon: ShieldCheck, title: "Gizlilik & KVKK", desc: "Argon2 şifre, 2FA, denetim günlüğü. Verilerin Türkiye standartlarında korunur.", c: EMERALD },
];

const FAQ = [
  { q: "FinOptima ücretsiz mi?", a: "Evet. Kredi notu koçluğu, ekstre okuma, fiş/fatura takibi ve borç yönetimi ücretsiz. Pro plan daha derin otomasyon için yakında." },
  { q: "Findeks notumu görebiliyor musunuz?", a: "Hayır. Biz davranışlarından yola çıkarak tahmini bir skor üretiriz ve onu yükselten adımları öneririz. Resmî Findeks raporunu istersen kendin yükleyebilirsin." },
  { q: "Banka bilgilerimi bağlamam gerekir mi?", a: "Hayır. Hesap bağlama zorunluluğu yok — ekstre/dekont dosyanı yüklersin ya da harcamanı elle/asistanla girersin." },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <>
      <PageGlows />

      {/* ===== Hero ===== */}
      <Section className="pt-8 lg:pt-14">
        <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_1fr]">
          <div>
            <Pill tone="blue">
              <ShieldCheck size={13} /> ÜCRETSİZ · FINDEKS TAHMİNİ + KOÇLUK
            </Pill>
            <SectionTitle as="h1" className="mt-6">
              Kredi notunu{" "}
              <span style={{ background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                yükselt
              </span>
              , hak ettiğin krediyi al.
            </SectionTitle>
            <Lead className="mt-6 max-w-xl">
              FinOptima kredi sağlığını tahmin eder, kart borçlarını, taksitlerini ve
              faturalarını tek ekranda toplar ve{" "}
              <strong style={{ color: INK }}>bu ay tam olarak ne yapman gerektiğini</strong> söyler.
              Daha iyi krediye ve daha düşük faize giden yol burada başlar.
            </Lead>

            <div className="mt-8 flex flex-wrap gap-3">
              <CTAButton href="/register" size="lg" arrow>
                Ücretsiz kayıt ol
              </CTAButton>
              <CTAButton href="/nasil-calisir" variant="outline" size="lg">
                Nasıl çalışır?
              </CTAButton>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2.5">
              <Pill tone="green"><Check size={13} /> Banka ekstresini AI okur</Pill>
              <Pill>KVKK uyumlu</Pill>
              <Pill>Dakikalar içinde kurulur</Pill>
            </div>
          </div>

          <ScorePhone />
        </div>

        <div className="mt-16">
          <StatStrip
            items={[
              { n: "Ücretsiz", l: "Kredi notu takibi", s: "tahmini Findeks skoru" },
              { n: "Her banka", l: "Ekstre / dekont okuma", s: "yapay zekâ ile, her dil" },
              { n: "Aylık", l: "Kişisel eylem planı", s: "ne yapacağını söyler" },
              { n: "Tek ekran", l: "Borç · kart · fatura", s: "hepsi bir arada" },
            ]}
          />
        </div>
      </Section>

      {/* ===== Nasıl çalışır (teaser) ===== */}
      <Section id="nasil" className="py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Pill>NASIL ÇALIŞIR</Pill>
            <SectionTitle className="mt-5 max-w-2xl">Üç adımda kredi sağlığını ele al.</SectionTitle>
          </div>
          <Link href="/nasil-calisir" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BLUE }}>
            Adım adım anlat <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.n}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: GRAD }}>
                <s.Icon size={22} />
              </span>
              <div className="mt-4 text-xs font-bold tracking-[0.1em]" style={{ fontFamily: F.mono, color: MUTED }}>{s.n}</div>
              <h3 className="mt-1 text-2xl font-bold tracking-[-0.02em]" style={{ fontFamily: F.display }}>{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed" style={{ color: SUBTLE }}>{s.d}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ===== Findeks (teaser → /kredi-notu) ===== */}
      <Section className="py-8">
        <DarkPanel>
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <Pill tone="white">KREDİ NOTU = DAHA İYİ KREDİ</Pill>
              <SectionTitle light className="mt-5">Türkiye&apos;de kredi notun kapıları açar.</SectionTitle>
              <Lead light className="mt-4 max-w-md !text-[15px]">
                Ev kredisi, taşıt kredisi, daha yüksek kart limiti, daha düşük faiz — hepsi kredi
                notuna bakar. FinOptima notunu tahmin eder ve onu yükselten somut adımları sıralar.
              </Lead>
              <div className="mt-6">
                <CTAButton href="/kredi-notu" variant="white" arrow>
                  Kredi notu nasıl yükselir?
                </CTAButton>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 rounded-[22px] bg-[rgba(255,255,255,0.05)] p-7">
              <div className="hidden sm:block">
                <BigGauge />
              </div>
              <div className="flex-1">
                {[
                  { l: "Ödeme düzeni", v: 92 },
                  { l: "Kart kullanımı", v: 76 },
                  { l: "Borç / gelir", v: 84 },
                  { l: "Kredi yaşı", v: 68 },
                ].map((r) => (
                  <div key={r.l} className="mb-2.5">
                    <div className="flex justify-between text-[13px] font-medium text-white">
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
        </DarkPanel>
      </Section>

      {/* ===== Özellikler (teaser → /ozellikler) ===== */}
      <Section className="py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Pill>ÖZELLİKLER</Pill>
            <SectionTitle className="mt-5 max-w-2xl">Paranı yönetmenin daha akıllı yolu.</SectionTitle>
          </div>
          <Link href="/ozellikler" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BLUE }}>
            Tüm özellikler <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} icon={<f.Icon size={20} />} title={f.title} desc={f.desc} color={f.c} />
          ))}
        </div>
      </Section>

      {/* ===== Neden FinOptima ===== */}
      <Section className="py-8">
        <div className="rounded-[28px] border bg-white p-8 sm:p-12" style={{ borderColor: LINE, boxShadow: "0 10px 28px rgba(15,23,42,0.05)" }}>
          <Pill tone="green">NEDEN FINOPTIMA</Pill>
          <SectionTitle className="mt-5 max-w-2xl">Bir bütçe uygulaması değil — bir kredi koçu.</SectionTitle>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {[
              { Icon: TrendingUp, t: "Sadece takip değil, aksiyon", d: "Çoğu uygulama harcamanı gösterir. FinOptima ne yapman gerektiğini söyler — sırayla, önem derecesine göre." },
              { Icon: CalendarClock, t: "Günlük finans gerçekleri", d: "Taksit, KMH, kart aidatı, fatura döngüleri — hayatın gerçek finans akışına göre kurgulandı." },
              { Icon: Lock, t: "Verin sende kalır", d: "Zorunlu banka bağlama yok. Ekstreni sen yüklersin; şifren Argon2 ile, hassas alanlar şifreli saklanır." },
            ].map((b) => (
              <div key={b.t}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgba(37,99,235,0.1)", color: BLUE }}>
                  <b.Icon size={20} />
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-[-0.02em]" style={{ fontFamily: F.display, color: INK }}>{b.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: SUBTLE }}>{b.d}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== Fiyat (teaser → /fiyatlandirma) ===== */}
      <Section className="py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Pill>FİYAT</Pill>
            <SectionTitle className="mt-5 max-w-xl">Başlamak ücretsiz.</SectionTitle>
          </div>
          <Link href="/fiyatlandirma" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: BLUE }}>
            Fiyatlandırma detayları <ArrowRight size={15} />
          </Link>
        </div>
        <div className="mt-9 grid gap-4 lg:grid-cols-2">
          {[
            { name: "ÜCRETSİZ", price: "₺0", suffix: "/ ay", desc: "Kredi notu koçluğu ve temel takip.", features: ["Tahmini Findeks notu + koçluk", "Banka ekstresi okuma", "AI asistan ile işlem girişi", "Borç & kart yönetimi", "Sınırsız işlem"], pro: false },
            { name: "PRO", price: "Yakında", suffix: "", desc: "Daha derin otomasyon ve aile hesabı.", features: ["Resmî Findeks rapor yükleme", "Otomatik kategori öğrenme", "Çok hesaplı aile", "İleri borç stratejisi", "Öncelikli destek"], pro: true },
          ].map((p) => (
            <div key={p.name} className="relative overflow-hidden rounded-[24px] p-8" style={{ background: p.pro ? DARK : "#FFFFFF", color: p.pro ? "#F8FAFC" : INK, border: p.pro ? "none" : `1px solid ${LINE}` }}>
              {p.pro && <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,0.4) 0%, transparent 60%)" }} />}
              <div className="relative">
                <div className="text-xs font-semibold tracking-wide" style={{ fontFamily: F.mono, color: p.pro ? "#60A5FA" : BLUE }}>PLAN · {p.name}</div>
                <div className="mt-3 text-[clamp(2.4rem,6vw,3.6rem)] font-extrabold tracking-tight" style={{ fontFamily: F.display }}>
                  {p.price}
                  {p.suffix && <span className="ml-1 text-base font-normal" style={{ color: MUTED }}>{p.suffix}</span>}
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
      </Section>

      {/* ===== SSS (teaser → /sss) ===== */}
      <Section className="py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Pill>SIKÇA SORULANLAR</Pill>
            <SectionTitle className="mt-5">Aklında bir soru mu var?</SectionTitle>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: SUBTLE }}>
              En çok merak edilenler burada. Daha fazlası için tüm soruları gör.
            </p>
            <div className="mt-5">
              <CTAButton href="/sss" variant="outline" arrow>Tüm sorular</CTAButton>
            </div>
          </div>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <div key={f.q} className="rounded-2xl border bg-white p-5" style={{ borderColor: LINE }}>
                <div className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: BLUE }}>
                    <Sparkles size={13} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold" style={{ color: INK }}>{f.q}</h3>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: SUBTLE }}>{f.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ===== Alt CTA ===== */}
      <GradientCTA
        title="Kredi notunu bugün öğren."
        desc="Birkaç dakikada kurulur. Ücretsiz başla, notunu yükseltmeye başla."
      />
    </>
  );
}
