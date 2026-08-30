import type { Metadata } from "next";
import {
  PageGlows,
  Section,
  SectionTitle,
  Lead,
  Pill,
  CTAButton,
  Card,
  DarkPanel,
  GradientCTA,
  CheckItem,
} from "@/components/marketing/kit";
import {
  INK,
  SUBTLE,
  MUTED,
  BLUE,
  EMERALD,
  LINE,
} from "@/components/marketing/theme";
import { F } from "@/components/marketing/fonts";
import { Check, Minus, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description:
    "FinOptima'da bugün canlıda olan her şey ücretsiz: resmî Findeks raporu yükleme, kredi notu koçluğu, banka ekstresi okuma, AI asistan ve borç planı. Kart bilgisi istemez.",
};

/* Karşılaştırma tablosu satırları: [özellik, ücretsiz, pro] — true/false/metin
   Kural: bugün uygulamada çalışan her özellik ücretsiz sütununda işaretlidir.
   Pro sütununda yalnızca henüz yazılmamış özellikler "yakında" olarak durur. */
const COMPARE: { label: string; free: boolean | string; pro: boolean | string }[] = [
  { label: "Tahmini Findeks kredi notu", free: true, pro: true },
  { label: "Resmî Findeks raporu (PDF) yükleme", free: true, pro: true },
  { label: "Kişiselleştirilmiş kredi notu koçluğu", free: true, pro: true },
  { label: "Banka ekstresi / dekont okuma", free: true, pro: true },
  { label: "AI finans asistanı", free: true, pro: true },
  { label: "Fiş & fatura tarama", free: true, pro: true },
  { label: "Otomatik kategorileme", free: true, pro: true },
  { label: "Borç & kredi kartı takibi", free: true, pro: true },
  { label: "Borç kapatma planı (faiz önceliğine göre)", free: true, pro: true },
  { label: "Fatura & ödeme takvimi", free: true, pro: true },
  { label: "Aylık işlem limiti", free: "Sınırsız", pro: "Sınırsız" },
  { label: "KVKK uyumlu veri koruması + veri dışa aktarma", free: true, pro: true },
  { label: "Alışkanlığından öğrenen kategori motoru", free: false, pro: "Yakında" },
  { label: "Senaryo simülasyonları", free: false, pro: "Yakında" },
  { label: "Çok hesaplı aile paneli", free: false, pro: "Yakında" },
  { label: "Destek", free: "Uygulama içi", pro: "Öncelikli" },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true)
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: "rgba(5,150,105,0.1)", color: EMERALD }}
      >
        <Check size={16} strokeWidth={3} />
      </span>
    );
  if (value === false)
    return (
      <span
        className="inline-flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: "rgba(15,23,42,0.05)", color: MUTED }}
      >
        <Minus size={16} strokeWidth={2.5} />
      </span>
    );
  return (
    <span className="text-sm font-semibold" style={{ color: INK }}>
      {value}
    </span>
  );
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "FinOptima gerçekten ücretsiz mi?",
    a: "Evet. Bugün uygulamada çalışan her şey — resmî Findeks raporu yükleme dahil — hiçbir ücret olmadan kullanılabilir. Ücretsiz plan bir deneme süresi değil; süresiz olarak ücretsizdir.",
  },
  {
    q: "Kayıt herkese açık mı?",
    a: "Şu an kapalı betadayız: kayıt davet koduyla açılıyor. Bunu bilinçli tercih ettik — her yeni kullanıcıyla birlikte kredi koçluğunun kalitesini ölçüyor, altyapıyı kontrollü büyütüyoruz. Davet kodu için iletişim sayfasından bize yazabilirsiniz.",
  },
  {
    q: "Başlamak için kredi kartımı girmem gerekir mi?",
    a: "Hayır. Kayıt olurken hiçbir kart veya ödeme bilgisi istemiyoruz. E-posta ve davet kodunuzla hesap açar, dakikalar içinde kullanmaya başlarsınız. Pro planı geldiğinde bile geçiş tamamen sizin tercihinizde olacak.",
  },
  {
    q: "Resmî Findeks raporumu yükleyebilir miyim?",
    a: "Evet, bugün yükleyebilirsiniz ve bunun için ücret ödemezsiniz. Findeks'ten indirdiğiniz Risk Raporu PDF'ini yüklediğinizde uygulama gerçek skorunuzu, limit ve kart verilerinizi okur; tavsiyeler tahmini skor yerine bu gerçek veriyle üretilir.",
  },
  {
    q: "Pro planı ne zaman gelecek?",
    a: "Pro üzerinde çalışıyoruz; içinde yalnızca bugün henüz yazmadığımız özellikler var: çok hesaplı aile paneli, alışkanlığınızdan öğrenen kategori motoru, senaryo simülasyonları ve öncelikli destek. Bugün ücretsiz kullandığınız hiçbir özellik Pro'ya taşınmayacak.",
  },
  {
    q: "İstediğim zaman ayrılabilir miyim?",
    a: "Elbette. Hesabınızı ve verilerinizi dilediğiniz an silebilirsiniz; KVKK kapsamında verileriniz size aittir. Ücretsiz planda taahhüt yoktur, Pro geldiğinde de aboneliği tek tıkla iptal edebileceksiniz.",
  },
  {
    q: "Verilerim güvende mi?",
    a: "Banka ekstreleriniz ve finansal verileriniz şifreli olarak saklanır ve yalnızca size özel analiz için kullanılır. Verilerinizi üçüncü taraflarla paylaşmayız ve KVKK ilkelerine uygun hareket ederiz.",
  },
];

export default function Page() {
  return (
    <>
      <PageGlows />

      {/* 1) Hero */}
      <Section className="pt-10 pb-8 lg:pt-16">
        <Pill tone="blue">
          <Sparkles size={13} /> FİYAT
        </Pill>
        <SectionTitle as="h1" className="mt-6 max-w-3xl">
          Bugün canlıda olan her şey ücretsiz
        </SectionTitle>
        <Lead className="mt-6 max-w-2xl">
          Resmî Findeks raporu yükleme, kredi notu koçluğu, banka ekstresi okuma,
          AI asistan ve borç kapatma planı — hepsi bugün ücretsiz. Kart bilgisi
          istemiyoruz. Kapalı betada olduğumuz için kayıt davet koduyla açılıyor.
        </Lead>
      </Section>

      {/* 2) İki plan kartı */}
      <Section className="pb-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ücretsiz */}
          <Card className="flex flex-col !p-8">
            <div className="flex items-center justify-between">
              <Pill tone="green">EN POPÜLER</Pill>
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ fontFamily: F.mono, color: MUTED }}
              >
                Bireysel
              </span>
            </div>
            <h2
              className="mt-5 text-2xl font-bold tracking-[-0.02em]"
              style={{ fontFamily: F.display, color: INK }}
            >
              Ücretsiz
            </h2>
            <div className="mt-3 flex items-end gap-1.5">
              <span
                className="text-[3rem] font-bold leading-none tracking-tight"
                style={{ fontFamily: F.display, color: INK }}
              >
                ₺0
              </span>
              <span className="mb-1.5 text-sm font-medium" style={{ color: MUTED }}>
                /ay
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: SUBTLE }}>
              Kredi notunu anlamak ve finansını toparlamak isteyen herkes için.
              Süre sınırı yok, kart bilgisi yok.
            </p>

            <ul className="mt-6 grid gap-2.5">
              <CheckItem>Tahmini Findeks kredi notu + AI koçluk</CheckItem>
              <CheckItem>Resmî Findeks raporu (PDF) yükleme</CheckItem>
              <CheckItem>Banka ekstresi / dekont okuma</CheckItem>
              <CheckItem>AI finans asistanı</CheckItem>
              <CheckItem>Fiş & fatura tarama, otomatik kategorileme</CheckItem>
              <CheckItem>Borç kapatma planı & kart takibi</CheckItem>
              <CheckItem>Fatura & ödeme takvimi</CheckItem>
              <CheckItem>Sınırsız işlem kaydı</CheckItem>
              <CheckItem>KVKK uyumlu veri koruması</CheckItem>
            </ul>

            <div className="mt-8 pt-2">
              <CTAButton href="/register" variant="primary" size="lg" arrow className="w-full">
                Erken erişime katıl
              </CTAButton>
              <p className="mt-3 text-center text-xs leading-relaxed" style={{ color: MUTED }}>
                Kapalı beta: kayıt davet kodu ile açılıyor.
              </p>
            </div>
          </Card>

          {/* Pro (Yakında) */}
          <DarkPanel className="flex flex-col !px-8 !py-8">
            <div className="flex items-center justify-between">
              <Pill tone="white">YAKINDA</Pill>
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ fontFamily: F.mono, color: "rgba(248,250,252,0.6)" }}
              >
                Pro
              </span>
            </div>
            <h2
              className="mt-5 text-2xl font-bold tracking-[-0.02em]"
              style={{ fontFamily: F.display, color: "#F8FAFC" }}
            >
              Pro
            </h2>
            <div className="mt-3 flex items-end gap-2">
              <span
                className="text-[3rem] font-bold leading-none tracking-tight"
                style={{ fontFamily: F.display, color: "#F8FAFC" }}
              >
                Yakında
              </span>
            </div>
            <p
              className="mt-3 text-sm leading-relaxed"
              style={{ color: "rgba(248,250,252,0.78)" }}
            >
              Ücretsiz planın tüm gücü, üzerine hane bazlı yönetim ve derin
              otomasyon. Aşağıdaki maddeler henüz yazılmadı; hazır olduklarında
              fiyatlandırma da netleşecek.
            </p>

            <ul className="mt-6 grid gap-2.5">
              <CheckItem light>Ücretsiz plandaki her şey</CheckItem>
              <CheckItem light>Çok hesaplı aile paneli</CheckItem>
              <CheckItem light>Alışkanlığından öğrenen kategori motoru</CheckItem>
              <CheckItem light>Senaryo simülasyonları</CheckItem>
              <CheckItem light>Öncelikli destek</CheckItem>
            </ul>

            <div className="mt-8 pt-2">
              <CTAButton href="/iletisim" variant="white" size="lg" arrow className="w-full">
                Pro çıkınca haber ver
              </CTAButton>
            </div>
          </DarkPanel>
        </div>
      </Section>

      {/* 3) Karşılaştırma tablosu */}
      <Section className="py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Pill tone="muted">KARŞILAŞTIRMA</Pill>
          <SectionTitle as="h2" className="mt-5">
            Ücretsiz ve Pro
          </SectionTitle>
          <Lead className="mx-auto mt-4">
            Basit bir kuralımız var: bugün uygulamada çalışan her özellik ücretsiz
            sütununda. Pro&apos;da yalnızca henüz yazmadığımız maddeler duruyor ve
            ücretsizden hiçbir şey oraya taşınmayacak.
          </Lead>
        </div>

        <div
          className="mt-10 overflow-x-auto rounded-[24px] border bg-white"
          style={{ borderColor: LINE }}
        >
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.03)" }}>
                <th
                  className="px-6 py-4 text-sm font-semibold"
                  style={{ color: INK, fontFamily: F.display }}
                >
                  Özellik
                </th>
                <th
                  className="px-6 py-4 text-center text-sm font-semibold"
                  style={{ color: INK, fontFamily: F.display }}
                >
                  Ücretsiz
                </th>
                <th
                  className="px-6 py-4 text-center text-sm font-semibold"
                  style={{ color: BLUE, fontFamily: F.display }}
                >
                  Pro
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((row, i) => (
                <tr
                  key={row.label}
                  style={{ borderTop: i === 0 ? undefined : `1px solid ${LINE}` }}
                >
                  <td className="px-6 py-3.5 text-sm font-medium" style={{ color: INK }}>
                    {row.label}
                  </td>
                  <td className="px-6 py-3.5 text-center align-middle">
                    <Cell value={row.free} />
                  </td>
                  <td className="px-6 py-3.5 text-center align-middle">
                    <Cell value={row.pro} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 4) Fiyatlandırma SSS */}
      <Section className="pb-16">
        <div className="mx-auto max-w-2xl text-center">
          <Pill tone="blue">SSS</Pill>
          <SectionTitle as="h2" className="mt-5">
            Fiyatlandırma hakkında
          </SectionTitle>
          <Lead className="mx-auto mt-4">
            Ücret, kart ve gelecek plan hakkında en çok merak edilenler.
          </Lead>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4">
          {FAQ.map((item) => (
            <Card key={item.q} className="!p-6">
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgba(37,99,235,0.1)", color: BLUE }}
                >
                  <Check size={14} strokeWidth={3} />
                </span>
                <div>
                  <h3
                    className="text-base font-bold tracking-[-0.01em]"
                    style={{ fontFamily: F.display, color: INK }}
                  >
                    {item.q}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: SUBTLE }}>
                    {item.a}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <GradientCTA
        title="Erken erişime katıl"
        desc="Kart bilgisi olmadan dakikalar içinde kur; kredi notunu, harcamalarını ve borçlarını tek panelde topla."
      />
    </>
  );
}
