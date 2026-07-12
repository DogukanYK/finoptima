import type { Metadata } from "next";
import {
  PageGlows,
  Section,
  SectionTitle,
  Lead,
  Pill,
  CTAButton,
  Card,
  FeatureCard,
  DarkPanel,
  GradientCTA,
  CheckItem,
} from "@/components/marketing/kit";
import { BigGauge } from "@/components/marketing/score-phone";
import { INK, SUBTLE, MUTED, BLUE, EMERALD, CYAN, LINE, GRAD } from "@/components/marketing/theme";
import { F } from "@/components/marketing/fonts";
import {
  Gauge,
  ShieldCheck,
  CreditCard,
  CalendarClock,
  Scale,
  History,
  FileCheck2,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Building2,
  Info,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Kredi Notu",
  description:
    "Kredi notun ev kredisinden kart limitine kadar her kapıyı açar. FinOptima Findeks notunu davranışlarından tahmin eder ve onu yükselten somut adımları sıralar.",
};

/* Findeks 1-1900 ölçeğindeki risk bölgeleri — eğitim amaçlı görsel */
const BANDS = [
  { l: "En düşük", r: "1 – 699", tone: "#EF4444", d: "Kredi başvuruları çoğunlukla reddedilir." },
  { l: "Orta", r: "700 – 1099", tone: "#F59E0B", d: "Onay ihtimali var ama faiz ve limitler zayıf." },
  { l: "İyi", r: "1100 – 1499", tone: CYAN, d: "Çoğu üründe onay, makul faiz." },
  { l: "Çok iyi", r: "1500 – 1699", tone: BLUE, d: "Yüksek limit, avantajlı faiz." },
  { l: "En yüksek", r: "1700 – 1900", tone: EMERALD, d: "En düşük faiz, en geniş limit." },
];

/* Notu belirleyen faktörler — landing paneliyle aynı ağırlıklar */
const FACTORS = [
  { l: "Ödeme düzeni", v: 92, note: "Faturaları ve taksitleri zamanında ödemek" },
  { l: "Kart kullanımı", v: 76, note: "Kartın limitine göre kullanım oranın" },
  { l: "Borç / gelir", v: 84, note: "Toplam borç yükünün gelirine oranı" },
  { l: "Kredi yaşı", v: 68, note: "Hesaplarının ve ödeme geçmişinin uzunluğu" },
];

export default function Page() {
  return (
    <>
      <PageGlows />

      {/* ===== 1. Hero ===== */}
      <Section className="pt-10 pb-8 lg:pt-16">
        <Pill tone="blue">
          <Gauge size={14} /> KREDİ NOTU
        </Pill>
        <SectionTitle as="h1" className="mt-6 max-w-3xl">
          Kredi notun kapıları açar
        </SectionTitle>
        <Lead className="mt-6 max-w-2xl">
          Ev kredisi, taşıt kredisi, daha yüksek bir kart limiti ya da daha düşük bir faiz —
          Türkiye&apos;de her banka önce kredi notuna bakar. Aynı maaş, aynı iş: fark, notunda. FinOptima
          notunu davranışlarından tahmin eder, seni nelerin geri çektiğini gösterir ve onu yükselten
          somut adımları tek tek sıralar.
        </Lead>
        <div className="mt-8 flex flex-wrap gap-3">
          <CTAButton href="/register" variant="accent" size="lg" arrow>
            Notunu ücretsiz tahmin et
          </CTAButton>
          <CTAButton href="/ozellikler" variant="outline" size="lg">
            Tüm özellikler
          </CTAButton>
        </div>
        <p className="mt-4 text-[13px]" style={{ fontFamily: F.mono, color: MUTED }}>
          Kart bilgisi istemeden · birkaç dakikada · tamamen Türkçe
        </p>
      </Section>

      {/* ===== 2. Notunu neler belirler (BigGauge + faktör barları) ===== */}
      <Section className="py-8">
        <DarkPanel>
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <Pill tone="white">DÖRT ANA FAKTÖR</Pill>
              <SectionTitle light className="mt-5">
                Notunu neler belirler
              </SectionTitle>
              <Lead light className="mt-4 max-w-md !text-[15px]">
                Kredi notu tek bir sayı değil; ödeme alışkanlıklarının bir özetidir. FinOptima bu
                dört sinyali okur, her birinin notuna ne kadar dokunduğunu ayrı ayrı gösterir ve en
                zayıf halkadan başlamanı önerir.
              </Lead>
              <div className="mt-6">
                <CTAButton href="/register" variant="white" arrow>
                  Kendi faktörlerini gör
                </CTAButton>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 rounded-[22px] bg-[rgba(255,255,255,0.05)] p-7 sm:flex-row sm:gap-7">
              <div className="shrink-0">
                <BigGauge />
              </div>
              <div className="w-full flex-1">
                {FACTORS.map((r) => (
                  <div key={r.l} className="mb-3.5 last:mb-0">
                    <div className="flex justify-between text-[13px] font-medium text-white">
                      <span>{r.l}</span>
                      <span className="text-[11px]" style={{ fontFamily: F.mono, color: "rgba(248,250,252,0.6)" }}>
                        {r.v}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.12)]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${r.v}%`, background: r.v >= 85 ? "#34D399" : "#60A5FA" }}
                      />
                    </div>
                    <div className="mt-1 text-[11.5px]" style={{ color: "rgba(248,250,252,0.55)" }}>
                      {r.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DarkPanel>
      </Section>

      {/* ===== 3. Findeks nedir ===== */}
      <Section className="py-16">
        <div className="max-w-2xl">
          <Pill>FINDEKS NEDİR</Pill>
          <SectionTitle className="mt-5">Türkiye&apos;nin kredi notu sistemi</SectionTitle>
          <Lead className="mt-5">
            Findeks, Kredi Kayıt Bürosu&apos;nun (KKB) bireysel kredi notudur. Bankalar ve finans
            kuruluşları; kredi, kredi kartı, KMH ya da limit artışı başvurunu değerlendirirken bu
            nota bakar. Not, geçmiş ödeme davranışını <strong>1 ile 1900</strong> arasında tek bir
            sayıya indirir: rakam büyüdükçe risk düşer, kapılar açılır.
          </Lead>
        </div>

        {/* 1-1900 risk ölçeği */}
        <div className="mt-9 overflow-hidden rounded-[24px] border bg-white" style={{ borderColor: LINE }}>
          <div className="flex h-2.5 w-full">
            {BANDS.map((b) => (
              <div key={b.l} className="flex-1" style={{ background: b.tone }} />
            ))}
          </div>
          <div className="grid gap-px sm:grid-cols-3 lg:grid-cols-5" style={{ background: LINE }}>
            {BANDS.map((b) => (
              <div key={b.l} className="bg-white p-5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full align-middle"
                  style={{ background: b.tone }}
                />
                <span className="ml-2 align-middle text-[13px] font-bold" style={{ color: INK }}>
                  {b.l}
                </span>
                <div className="mt-1 text-[12px] font-semibold" style={{ fontFamily: F.mono, color: MUTED }}>
                  {b.r}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed" style={{ color: SUBTLE }}>
                  {b.d}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bankalar neye bakar */}
        <div className="mt-10">
          <h3 className="text-xl font-bold tracking-[-0.02em]" style={{ fontFamily: F.display, color: INK }}>
            Bir banka başvurunda neye bakar?
          </h3>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            <FeatureCard
              icon={<CalendarClock size={20} />}
              title="Ödeme geçmişi"
              desc="Kredi ve kartlarını zamanında mı ödedin, gecikme ya da yasal takip var mı? En ağır basan sinyal budur."
              color={EMERALD}
            />
            <FeatureCard
              icon={<Wallet size={20} />}
              title="Mevcut borç yükü"
              desc="Üzerinde ne kadar kredi ve kart borcu var, gelirine göre bu yük ne durumda?"
              color={BLUE}
            />
            <FeatureCard
              icon={<Building2 size={20} />}
              title="Başvuru yoğunluğu"
              desc="Kısa sürede çok sayıda kredi/kart başvurusu, acil nakit ihtiyacı gibi okunur ve notu baskılar."
              color={CYAN}
            />
          </div>
        </div>
      </Section>

      {/* ===== 4. FinOptima nasıl tahmin eder ===== */}
      <Section className="py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <Pill tone="green">TAHMİN MOTORU</Pill>
            <SectionTitle className="mt-5">FinOptima notunu nasıl tahmin eder</SectionTitle>
            <Lead className="mt-5">
              Resmî Findeks raporun elinde olmasa bile, gündelik para hareketlerin notunun nabzını
              tutar. FinOptima harcamalarını, faturalarını ve borçlarını okuyup dört davranış
              sinyalinden <strong>tahmini bir skor</strong> üretir — ve bu skor sen ödedikçe,
              borcunu azalttıkça canlı olarak değişir.
            </Lead>
          </div>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2">
          <FeatureCard
            icon={<CalendarClock size={20} />}
            title="Ödeme düzeni"
            desc="Fatura, taksit ve kart ödemelerini vaktinde mi yapıyorsun? Düzenli ödeme, notu en çok yükselten davranıştır; tek bir gecikme bile iz bırakır."
            color={EMERALD}
          />
          <FeatureCard
            icon={<CreditCard size={20} />}
            title="Kart kullanım oranı"
            desc="Kart limitinin ne kadarını kullandığın (kullanım oranı) doğrudan okunur. Limitin dibine yakın gezmek, gelir ne olursa olsun notu aşağı çeker."
            color={BLUE}
          />
          <FeatureCard
            icon={<Scale size={20} />}
            title="Borç / gelir dengesi"
            desc="Aylık gelirine karşılık toplam borç ve taksit yükün. Denge bozuldukça yeni kredi kapasiten ve notun daralır."
            color={CYAN}
          />
          <FeatureCard
            icon={<History size={20} />}
            title="Kredi yaşı ve geçmiş"
            desc="Hesaplarının ne kadar eski olduğu ve ödeme geçmişinin uzunluğu. Uzun ve temiz bir sicil, notun için sağlam bir zemindir."
            color={INK}
          />
        </div>

        {/* Resmî rapor yükleme notu */}
        <Card className="mt-6 !p-0" hover>
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
              style={{ background: GRAD }}
            >
              <FileCheck2 size={22} />
            </span>
            <div className="flex-1">
              <h3 className="text-lg font-bold tracking-[-0.02em]" style={{ fontFamily: F.display, color: INK }}>
                Resmî Findeks raporunu da yükleyebilirsin
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: SUBTLE }}>
                Elindeki güncel Findeks raporunu FinOptima&apos;ya ekle; tahmini skoru gerçek notunla
                hizala, faktör kırılımını netleştir ve yükselme planını resmî veriyle çalıştır.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* ===== 5. Notunu yükselten 6 adım ===== */}
      <Section className="py-16">
        <div className="max-w-2xl">
          <Pill tone="blue">SOMUT ADIMLAR</Pill>
          <SectionTitle className="mt-5">Notunu yükselten 6 adım</SectionTitle>
          <Lead className="mt-5">
            Kredi notu bir gecede değişmez; ama doğru alışkanlıklar birkaç ekstre döngüsünde net fark
            yaratır. FinOptima bu adımların hangisinin sana en çok puan kazandıracağını hesaplar ve
            sırayla önüne koyar.
          </Lead>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<TrendingUp size={20} />}
            title="1 · Yüksek faizli borcu önce kapat"
            desc="En pahalı kart ve KMH borcundan başla. Faiz yükü hem cebini hem borç/gelir dengeni en hızlı toparlar."
            color={EMERALD}
          />
          <FeatureCard
            icon={<CreditCard size={20} />}
            title="2 · Kartı limitin %30 altında tut"
            desc="Kullanım oranını düşük tutmak notun için en görünür kazançlardan biri. Limitin dibinde gezme, ödemeleri ekstre öncesine yay."
            color={BLUE}
          />
          <FeatureCard
            icon={<CalendarClock size={20} />}
            title="3 · Faturaları zamanında öde"
            desc="Tek bir gecikme bile aylarca iz bırakır. Otomatik ödeme talimatı ve hatırlatıcılarla son ödeme gününü asla kaçırma."
            color={CYAN}
          />
          <FeatureCard
            icon={<AlertTriangle size={20} />}
            title="4 · Gereksiz başvurudan kaçın"
            desc="Kısa sürede üst üste kredi/kart başvurusu notu baskılar. Yalnızca gerçekten ihtiyaç duyduğunda ve hazırken başvur."
            color="#F59E0B"
          />
          <FeatureCard
            icon={<History size={20} />}
            title="5 · Eski kartı kapatma"
            desc="Yıllardır kullandığın kart, kredi geçmişinin yaşını taşır. Aidatı sorun değilse açık tutmak sicilini güçlendirir."
            color={INK}
          />
          <FeatureCard
            icon={<Wallet size={20} />}
            title="6 · Taksitleri tek yerde izle"
            desc="Dağınık taksit ve borçları tek panelde topla; hiçbir ödemeyi kaçırmadan, dengeyi görerek yönet."
            color={BLUE}
          />
        </div>

        <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
          <CheckItem>FinOptima her adımı senin verinle kişiselleştirir</CheckItem>
          <CheckItem>Bu ay en çok puan getirecek adımı öne çıkarır</CheckItem>
          <CheckItem>Ödedikçe tahmini skorun canlı güncellenir</CheckItem>
          <CheckItem>İlerlemeni son 30 / 90 günlük grafikte görürsün</CheckItem>
        </ul>
      </Section>

      {/* ===== 6. Uyarı: tahmini skor resmî Findeks değildir ===== */}
      <Section className="pb-8">
        <div
          className="flex flex-col gap-4 rounded-[24px] border p-6 sm:flex-row sm:items-start sm:gap-5 sm:p-7"
          style={{ borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.06)" }}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "rgba(245,158,11,0.15)", color: "#B45309" }}
          >
            <Info size={20} />
          </span>
          <div>
            <h3 className="text-base font-bold tracking-[-0.01em]" style={{ fontFamily: F.display, color: INK }}>
              Tahmini skor resmî Findeks notu değildir
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: SUBTLE }}>
              FinOptima&apos;nın gösterdiği skor, davranışlarından üretilen <strong>yönlendirici bir
              tahmindir</strong> — nereye baktığını ve neyi düzeltmen gerektiğini anlaman içindir.
              Bankaların kullandığı bağlayıcı not, yalnızca KKB / Findeks tarafından hesaplanır ve
              resmî raporunda yer alır. Kredi kararların için her zaman güncel resmî Findeks notunu
              esas al.
            </p>
          </div>
        </div>
      </Section>

      {/* ===== Alt CTA ===== */}
      <GradientCTA
        title="Notunu bugün öğren, adım adım yükselt"
        desc="Birkaç dakikada tahmini kredi notunu gör, seni geri çeken faktörü fark et ve FinOptima'nın kişisel planıyla yükselmeye başla."
        primaryLabel="Ücretsiz başla"
        secondaryLabel="Giriş yap"
      />
    </>
  );
}
