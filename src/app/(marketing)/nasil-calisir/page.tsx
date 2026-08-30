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
import { INK, SUBTLE, MUTED, BLUE, EMERALD, LINE, GRAD } from "@/components/marketing/theme";
import { F } from "@/components/marketing/fonts";
import {
  FileText,
  Bot,
  PencilLine,
  Gauge,
  PieChart,
  AlertTriangle,
  ListChecks,
  ScanLine,
  Landmark,
  Tags,
  CopyCheck,
  CreditCard,
  Receipt,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Nasıl Çalışır",
  description:
    "FinOptima üç adımda çalışır: harcamalarını ekle, kredi sağlığını gör, koçun söylediği adımlarla puanını yükselt. Ekstre okuyan yapay zekâ ve aylık eylem planı nasıl işliyor, baştan sona anlattık.",
};

/* --------- Adım 1: EKLE — üç yol --------- */
const ADD_WAYS = [
  {
    Icon: FileText,
    t: "Ekstre veya dekont yükle",
    d: "Bankandan indirdiğin PDF/ekran görüntüsünü yükle. Garanti, Enpara, Yapı Kredi ya da tanımadığın bir banka — yapay zekâ okur, işlemleri tek tek çıkarır.",
    c: BLUE,
  },
  {
    Icon: Bot,
    t: "AI asistana anlat",
    d: "“Dün markete 350 verdim”, “kart aidatı 289 kesildi” diye yaz; asistan tutarı, tarihi ve kategoriyi çıkarıp işlemi senin için girer.",
    c: EMERALD,
  },
  {
    Icon: PencilLine,
    t: "Elle gir",
    d: "İstersen klasik yol: gelir–gider, taksit, KMH ya da fatura kalemini tek tek kendin ekle. Hesap bağlama zorunluluğu yok.",
    c: BLUE,
  },
];

/* --------- Adım 2: GÖR — dört içgörü --------- */
const SEE_ITEMS = [
  {
    Icon: Gauge,
    t: "Kredi sağlığı",
    d: "Davranışlarından üretilen tahmini bir skor: ödeme düzenin, kart doluluk oranın ve borç yükün tek göstergede.",
    c: BLUE,
  },
  {
    Icon: CreditCard,
    t: "Borçların",
    d: "Kredi kartı, taksit, KMH ve krediler bir arada; hangisi ne zaman, ne kadar ödenecek — Türkiye'nin taksit kültürüne göre.",
    c: EMERALD,
  },
  {
    Icon: PieChart,
    t: "Kategori dağılımı",
    d: "Market, fatura, ulaşım, eğlence, abonelik… Paran nereye gidiyor, hangi kalem şişmiş, geçen aya göre ne değişmiş.",
    c: BLUE,
  },
  {
    Icon: AlertTriangle,
    t: "Puanı düşüren alışkanlık",
    d: "Kartı sürekli limit sınırında gezdirmek mi, geciken faturalar mı? Notunu aşağı çeken davranışı isimlendirir.",
    c: EMERALD,
  },
];

/* --------- Adım 3 için aylık plan örnekleri --------- */
const PLAN_ITEMS = [
  "En yüksek faizli kredi kartını bu ay öncelikli kapat — asgari değil, mümkün olduğunca fazla öde.",
  "Doluluk oranı yüksek kartın limitinin altına in; kullanım oranını düşürmek skoru en hızlı toparlayan adımlardan biri.",
  "Elektrik ve internet faturanı son ödeme gününden önce planla; bir gecikme bile ödeme düzenini bozar.",
  "Kullanmadığın aboneliği iptal et — küçük ama düzenli sızıntılar aylık bütçende toplamda büyük yer tutuyor.",
  "Yaklaşan taksitleri takvime al; nakit akışını önceden gör, ay sonu sürprizini engelle.",
];

/* --------- Veri işleme akışı (DarkPanel) --------- */
const PIPELINE = [
  {
    Icon: ScanLine,
    t: "Ekstreyi okur",
    d: "Yüklediğin PDF, ekran görüntüsü ya da fiş fotoğrafını yapay zekâ satır satır tarar.",
  },
  {
    Icon: Landmark,
    t: "Bankayı tanır",
    d: "Belgenin hangi bankaya ait olduğunu ve formatını anlar; her banka için ayrı ayar gerekmez.",
  },
  {
    Icon: Tags,
    t: "Kategoriye ayırır",
    d: "Her işlemi market, fatura, ulaşım gibi kategorilere yerleştirir; tutar ve tarihi düzenler.",
  },
  {
    Icon: CopyCheck,
    t: "Mükerreri eler",
    d: "Aynı işlem iki farklı belgeden geldiyse tekrarı ayıklar; çift kayıt tablonu bozmaz.",
  },
];

/* --------- Kimler için --------- */
const WHO = [
  {
    Icon: TrendingUp,
    t: "Kredi çekmek isteyen",
    d: "Konut, taşıt ya da ihtiyaç kredisi öncesi notunu toparlamak, başvuru öncesi hazır olmak isteyenler.",
    c: BLUE,
  },
  {
    Icon: CreditCard,
    t: "Borç yöneten",
    d: "Birden çok kart, taksit ve KMH arasında hangisini önce kapatacağını netleştirmek isteyenler.",
    c: EMERALD,
  },
  {
    Icon: Receipt,
    t: "Harcamasını görmek isteyen",
    d: "Ay sonunda “para nereye gitti?” demeden, gelir–giderini net görmek isteyenler.",
    c: BLUE,
  },
];

export default function Page() {
  return (
    <>
      <PageGlows />

      {/* ============ Hero ============ */}
      <Section className="pt-10 pb-8 lg:pt-16">
        <Pill tone="blue">NASIL ÇALIŞIR</Pill>
        <SectionTitle as="h1" className="mt-6 max-w-4xl">
          Üç adımda kredi sağlığını ele al
        </SectionTitle>
        <Lead className="mt-6 max-w-2xl">
          FinOptima karmaşık tablolar ya da finans jargonu istemez. Harcamalarını{" "}
          <strong style={{ color: INK }}>ekle</strong>, kredi sağlığını{" "}
          <strong style={{ color: INK }}>gör</strong>, koçun sıraladığı adımlarla puanını{" "}
          <strong style={{ color: INK }}>yükselt</strong>. Aşağıda bu üç adımın ve arka
          plandaki yapay zekânın nasıl işlediğini baştan sona anlattık.
        </Lead>
        <div className="mt-8 flex flex-wrap gap-3">
          <CTAButton href="/register" variant="primary" size="lg" arrow>
            Erken erişime katıl
          </CTAButton>
          <CTAButton href="/ozellikler" variant="outline" size="lg">
            Tüm özellikler
          </CTAButton>
        </div>
      </Section>

      {/* ============ Üç büyük adım ============ */}

      {/* Adım 1 — EKLE */}
      <Section className="py-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div>
            <span
              className="inline-flex items-center gap-3 text-sm font-semibold"
              style={{ color: MUTED, fontFamily: F.mono }}
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                style={{ background: GRAD, fontFamily: F.display }}
              >
                1
              </span>
              ADIM 01
            </span>
            <SectionTitle as="h2" className="mt-5">
              Ekle
            </SectionTitle>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: SUBTLE }}>
              Verini üç yoldan istediğinle gir. Hangisini seçersen seç, sonuç aynı: işlemlerin
              düzenli, kategorili ve okunmaya hazır olur.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {ADD_WAYS.map(({ Icon, t, d, c }) => (
              <FeatureCard key={t} icon={<Icon size={20} />} title={t} desc={d} color={c} />
            ))}
          </div>
        </div>
      </Section>

      {/* Adım 2 — GÖR */}
      <Section className="py-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div>
            <span
              className="inline-flex items-center gap-3 text-sm font-semibold"
              style={{ color: MUTED, fontFamily: F.mono }}
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                style={{ background: GRAD, fontFamily: F.display }}
              >
                2
              </span>
              ADIM 02
            </span>
            <SectionTitle as="h2" className="mt-5">
              Gör
            </SectionTitle>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: SUBTLE }}>
              Girdiğin veri tek bir panele dönüşür. Nerede olduğunu ve neyin puanını etkilediğini
              tahmin etmeden, tek bakışta anlarsın.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SEE_ITEMS.map(({ Icon, t, d, c }) => (
              <FeatureCard key={t} icon={<Icon size={20} />} title={t} desc={d} color={c} />
            ))}
          </div>
        </div>
      </Section>

      {/* Adım 3 — YÜKSELT */}
      <Section className="py-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <div>
            <span
              className="inline-flex items-center gap-3 text-sm font-semibold"
              style={{ color: MUTED, fontFamily: F.mono }}
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                style={{ background: GRAD, fontFamily: F.display }}
              >
                3
              </span>
              ADIM 03
            </span>
            <SectionTitle as="h2" className="mt-5">
              Yükselt
            </SectionTitle>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: SUBTLE }}>
              Koç, bu ay atman gereken adımları <strong style={{ color: INK }}>önem sırasıyla</strong>{" "}
              listeler. Hangi kartı önce kapatacağın, hangi faturayı zamanında ödeyeceğin nettir —
              tahmin yok, sıraya göre uygula.
            </p>
          </div>
          <Card className="!p-6 sm:!p-8">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                style={{ background: EMERALD }}
              >
                <ListChecks size={18} />
              </span>
              <span className="text-sm font-semibold" style={{ color: INK }}>
                Bu ay yapılacaklar
              </span>
            </div>
            <ol className="mt-5 grid gap-3">
              {PLAN_ITEMS.slice(0, 4).map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed"
                  style={{ borderColor: LINE, color: SUBTLE }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: BLUE, fontFamily: F.mono }}
                  >
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </Section>

      {/* ============ Veri nasıl işleniyor ============ */}
      <Section className="py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Pill tone="green">PERDE ARKASI</Pill>
          <SectionTitle as="h2" className="mt-5">
            Veri nasıl işleniyor?
          </SectionTitle>
          <Lead className="mt-4">
            “Ekstreni yükle” dediğimizde arka planda dört adımlık bir akış çalışır. Sen tek dosya
            atarsın; gerisini yapay zekâ halleder.
          </Lead>
        </div>

        <DarkPanel className="mt-8">
          <div className="grid gap-6 md:grid-cols-4">
            {PIPELINE.map(({ Icon, t, d }, i) => (
              <div key={t} className="relative">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.1)", color: "#7DD3FC" }}
                  >
                    <Icon size={20} />
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "rgba(248,250,252,0.5)", fontFamily: F.mono }}
                  >
                    0{i + 1}
                  </span>
                </div>
                <h3
                  className="mt-4 text-lg font-bold tracking-[-0.02em]"
                  style={{ fontFamily: F.display, color: "#F8FAFC" }}
                >
                  {t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(248,250,252,0.72)" }}>
                  {d}
                </p>
                {i < PIPELINE.length - 1 && (
                  <ArrowRight
                    size={18}
                    aria-hidden
                    className="absolute -right-4 top-3 hidden md:block"
                    style={{ color: "rgba(248,250,252,0.28)" }}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="mt-9 text-sm leading-relaxed" style={{ color: "rgba(248,250,252,0.62)" }}>
            Not: Hesap bağlama zorunluluğu yoktur. Findeks&apos;e senin adına bağlanmayız; varsayılan
            skorumuz girdiğin veriden üretilen bir{" "}
            <strong style={{ color: "#F8FAFC" }}>tahmindir</strong>. Resmî notunla çalışmak istersen
            Findeks Risk Raporu PDF&apos;ini kendin yükleyebilirsin — uygulama raporu okur ve planı
            gerçek veriyle kurar.
          </p>
        </DarkPanel>
      </Section>

      {/* ============ Aylık eylem planı ============ */}
      <Section className="py-8">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="lg:sticky lg:top-24">
            <Pill tone="blue">AYLIK EYLEM PLANI</Pill>
            <SectionTitle as="h2" className="mt-5">
              Her ay yeni bir öncelik listesi
            </SectionTitle>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: SUBTLE }}>
              Koç, verinin her ay güncel halini okur ve o ay için en çok fark yaratacak adımları
              öne çıkarır. Liste sabit değildir — borçların azaldıkça, alışkanlıkların
              düzeldikçe öncelikler de değişir.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: SUBTLE }}>
              Aşağıdaki maddeler örnektir; senin planın kendi kartların, faturaların ve taksitlerin
              üzerinden kurulur.
            </p>
            <div className="mt-6">
              <CTAButton href="/kredi-notu" variant="outline" arrow>
                Kredi notu koçluğu
              </CTAButton>
            </div>
          </div>
          <ul className="grid gap-2.5">
            {PLAN_ITEMS.map((item, i) => (
              <CheckItem key={i}>{item}</CheckItem>
            ))}
          </ul>
        </div>
      </Section>

      {/* ============ Kimler için ============ */}
      <Section className="py-12">
        <div className="mx-auto max-w-2xl text-center">
          <Pill tone="green">KİMLER İÇİN</Pill>
          <SectionTitle as="h2" className="mt-5">
            FinOptima kime göre?
          </SectionTitle>
          <Lead className="mt-4">
            Finansını profesyonelce yönetmene gerek yok. Şu üç ihtiyaçtan biri sende varsa,
            FinOptima tam sana göre.
          </Lead>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {WHO.map(({ Icon, t, d, c }) => (
            <FeatureCard key={t} icon={<Icon size={20} />} title={t} desc={d} color={c} />
          ))}
        </div>
      </Section>

      <GradientCTA
        title="Bugün ilk ekstreni yükle"
        desc="Davetinle kaydol, harcamanı ekle ve dakikalar içinde kredi sağlığını gör. Ücretsiz, hesap bağlama yok."
      />
    </>
  );
}
