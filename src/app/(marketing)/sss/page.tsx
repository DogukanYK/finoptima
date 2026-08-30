import type { Metadata } from "next";
import {
  PageGlows,
  Section,
  SectionTitle,
  Lead,
  Pill,
  CTAButton,
  Card,
  GradientCTA,
} from "@/components/marketing/kit";
import { INK, SUBTLE, MUTED, BLUE, EMERALD, LINE } from "@/components/marketing/theme";
import { F } from "@/components/marketing/fonts";
import {
  HelpCircle,
  Gauge,
  ShieldCheck,
  CreditCard,
  MessageCircleQuestion,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular",
  description:
    "FinOptima hakkında en çok merak edilenler: kredi notu tahmini, veri güvenliği ve KVKK, ücretlendirme ve hesap yönetimi. Aradığın yanıt burada.",
};

type QA = { q: string; a: string };
type Group = { title: string; icon: React.ReactNode; tone: "blue" | "green" | "muted"; items: QA[] };

const GROUPS: Group[] = [
  {
    title: "Genel",
    icon: <Gauge size={18} />,
    tone: "blue",
    items: [
      {
        q: "FinOptima nedir?",
        a: "FinOptima, Türkiye'deki bireylerin finansal sağlığını tek ekranda toplayan bir kişisel finans uygulamasıdır. Tahmini kredi notunu gösterir, notu etkileyen kalemleri (kredi kartı doluluk oranı, KMH kullanımı, kart aidatı, düzenli fatura ödemeleri, mevcut kredi taksitleri) ayrıştırır ve notu yukarı taşımak için sıraya konmuş, uygulanabilir adımlar sunar. Amaç, bankaya gitmeden önce nerede durduğunu net görmeni sağlamaktır.",
      },
      {
        q: "FinOptima ücretsiz mi?",
        a: "Evet. Bugün uygulamada çalışan her şey ücretsizdir: tahmini kredi notu, resmî Findeks raporu yükleme, notu etkileyen faktörlerin dökümü, banka ekstresi okuma, AI asistan, borç kapatma planı ve kişisel iyileştirme önerileri. İleride yayına alacağımız Pro paketi ise bugün henüz olmayan özellikleri (aile paneli, senaryo simülasyonları, öğrenen kategori motoru) ekleyecek; bugün ücretsiz kullandığın hiçbir özellik Pro'ya taşınmayacak.",
      },
      {
        q: "Kayıt herkese açık mı?",
        a: "Şu an kapalı betadayız: kayıt davet koduyla açılıyor. Bunu bilinçli seçtik — kullanıcı sayısını kontrollü artırdığımız için her yeni kullanıcının kredi koçluğu çıktısını tek tek ölçebiliyor, geri bildirimi doğrudan ürüne yansıtabiliyoruz. Davet kodu istemek için iletişim sayfasından bize yazabilirsin.",
      },
      {
        q: "Kimler kullanabilir?",
        a: "18 yaşını doldurmuş herkes kullanabilir. İlk kez kredi kartı ya da kredi düşünen biri de, mevcut borçlarını düzenlemek isteyen biri de FinOptima'dan yararlanır. Uygulama tamamen Türkçedir ve taksit, KMH, kart aidatı, Findeks gibi günlük finans gerçeklerine göre tasarlanmıştır.",
      },
      {
        q: "Kredi başvurusu yapmama yardım eder mi?",
        a: "FinOptima bir banka ya da kredi aracısı değildir; senin adına başvuru yapmaz ve kredi tahsis etmez. Bunun yerine başvuru öncesinde hazırlığını güçlendirir: hangi kalemlerin notunu düşürdüğünü gösterir, öncelik sırasıyla ne yapabileceğini söyler ve daha güçlü bir profille bankanın karşısına çıkmanı sağlar.",
      },
    ],
  },
  {
    title: "Kredi notu",
    icon: <Gauge size={18} />,
    tone: "blue",
    items: [
      {
        q: "Findeks notumu siz mi görüyorsunuz?",
        a: "Hayır. FinOptima, Findeks veya kredi bürolarının resmî notuna doğrudan erişmez ve onların yerine geçmez. Varsayılan olarak gösterdiğimiz değer, senin paylaştığın bilgilere dayanan bir tahmindir. Resmî notunu görmemizi istersen kendi Findeks Risk Raporu PDF'ini yükleyebilirsin; o zaman analiz doğrudan senin resmî raporun üzerinden çalışır.",
      },
      {
        q: "Notu nasıl tahmin ediyorsunuz?",
        a: "Kredi notlarını belirleyen bilinen davranış kalıplarını temel alırız: kredi kartı limit doluluk oranın, KMH ve nakit avans kullanımın, ödemelerini zamanında yapıp yapmadığın, üzerindeki aktif kredi ve taksit yükü, hesap geçmişinin süresi gibi kalemler. Bu girdileri bir araya getirip anlaşılır bir tahmini nota ve kalem kalem bir dökümüne dönüştürürüz. Sonuç bir öngörüdür; kesin bir garanti değil, yön gösteren bir pusuladır.",
      },
      {
        q: "Resmî kredi raporumu yükleyebilir miyim?",
        a: "Evet, üstelik ücretsiz. Findeks'ten indirdiğin Risk Raporu PDF'ini uygulamaya yüklediğinde FinOptima raporu okur; gerçek notunu, limitlerini, bakiyelerini ve ödeme durumunu işler. O andan itibaren faktör dökümü ve tavsiyeler tahmini skor yerine resmî rapor verisiyle üretilir. Raporu istediğin zaman yeni tarihlisiyle güncelleyebilirsin.",
      },
      {
        q: "Notumu nasıl yükseltirim?",
        a: "FinOptima, notunu en çok etkileyen kalemleri önem sırasına dizip somut adımlar önerir: kart doluluk oranını belirli bir eşiğin altına çekmek, KMH bakiyesini kapatmak, gecikmiş ödemeleri düzene sokmak, gereksiz kart aidatlarını gözden geçirmek gibi. Her önerinin neden işe yaradığını da açıklarız ki kör bir talimat değil, anladığın bir plan uygulayasın.",
      },
    ],
  },
  {
    title: "Güvenlik & veri",
    icon: <ShieldCheck size={18} />,
    tone: "green",
    items: [
      {
        q: "Banka hesabımı bağlamam gerekiyor mu?",
        a: "Hayır. FinOptima'yı banka hesabı bağlamadan kullanabilirsin. Tahmin ve öneriler, senin girdiğin bilgiler üzerinden çalışır. Hiçbir aşamada internet bankacılığı şifreni veya banka giriş bilgilerini istemeyiz; böyle bir bilgiyi asla girme.",
      },
      {
        q: "Verilerim güvende mi?",
        a: "Verilerin şifreli olarak saklanır ve yalnızca sana ait analizleri üretmek için kullanılır. Finansal bilgilerini üçüncü taraflara satmayız. Hesabına yalnızca sen erişirsin; paylaşımlar senin kontrolündedir. Güvenlik uygulamalarımızın ayrıntılarını Gizlilik sayfamızda bulabilirsin.",
      },
      {
        q: "KVKK'ya uygun musunuz?",
        a: "Evet. Kişisel verilerin, 6698 sayılı KVKK kapsamında işlenir. Hangi verini neden işlediğimizi açıkça belirtiriz, verini yalnızca sana sunduğumuz hizmet için kullanırız ve kanunun sana tanıdığı erişim, düzeltme ve silme haklarını kullanabilmen için gerekli yolları sağlarız.",
      },
      {
        q: "Şifremi veya kart numaramı istiyor musunuz?",
        a: "Hiçbir zaman. FinOptima senden banka şifresi, internet bankacılığı bilgisi ya da kart numarasının tamamı gibi hassas kimlik doğrulama verilerini istemez. Sana böyle bir talep gelirse bu FinOptima değildir. Güvenliğin için bu tür bilgileri hiçbir yere girme ve şüpheli durumları bize bildir.",
      },
    ],
  },
  {
    title: "Fiyat & hesap",
    icon: <CreditCard size={18} />,
    tone: "muted",
    items: [
      {
        q: "Hesabımı silebilir miyim?",
        a: "Evet, dilediğin an. Hesap ayarlarından silme talebi oluşturabilirsin; hesabın ve ilişkili verilerin kalıcı olarak kaldırılır. Silme, kalıcı bir işlemdir ve geri alınamaz. Yalnızca bir mola vermek istiyorsan hesabını silmeden de oturumunu kapatıp istediğin zaman geri dönebilirsin.",
      },
      {
        q: "Mobil uygulama var mı?",
        a: "FinOptima şu an web üzerinde çalışır ve telefon tarayıcısında akıcı bir deneyim sunacak şekilde tasarlanmıştır; dilersen ana ekranına ekleyip uygulama gibi kullanabilirsin (PWA). Ayrı bir mobil uygulama yol haritamızda yer alıyor ve hazır olduğunda kullanıcılarımıza duyuracağız.",
      },
      {
        q: "Pro paket ne zaman gelecek?",
        a: "Pro paketi üzerinde çalışıyoruz; çok hesaplı aile paneli, senaryo simülasyonları, alışkanlığından öğrenen kategori motoru ve öncelikli destek gibi bugün henüz yazılmamış özellikler içerecek. Yayın tarihini kesinleştirdiğimizde ilk duyacaklar kayıtlı kullanıcılarımız olacak. Bugün ücretsiz kullandığın özellikler ücretsiz kalmaya devam eder.",
      },
      {
        q: "Gizli bir ücret var mı?",
        a: "Hayır. Ücretsiz katmanda gizli bir bedel yoktur; kartından habersiz bir çekim yapılmaz. İleride Pro paketi geldiğinde ücretlendirme baştan, açıkça belirtilir ve yükseltme tamamen senin tercihindir. Şeffaf fiyatlandırma bizim için ilkedir.",
      },
    ],
  },
];

function toneColor(tone: Group["tone"]) {
  return tone === "green" ? EMERALD : tone === "muted" ? MUTED : BLUE;
}

export default function Page() {
  return (
    <>
      <PageGlows />

      {/* Hero */}
      <Section className="pt-10 pb-8 lg:pt-16">
        <Pill tone="blue">
          <HelpCircle size={14} /> SSS
        </Pill>
        <SectionTitle as="h1" className="mt-6 max-w-3xl">
          Sıkça sorulan sorular
        </SectionTitle>
        <Lead className="mt-6 max-w-2xl">
          FinOptima'yı kullanmadan önce en çok merak edilenleri bir araya getirdik.
          Kredi notu tahmininin nasıl çalıştığından veri güvenliğine, ücretlendirmeden
          hesap yönetimine kadar aradığın yanıt büyük ihtimalle aşağıda. Bulamazsan
          bize yazman yeterli.
        </Lead>
      </Section>

      {/* Gruplu S/C listesi */}
      {GROUPS.map((group) => {
        const c = toneColor(group.tone);
        return (
          <Section key={group.title} className="py-8">
            <div className="mb-6 flex items-center gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ background: c }}
              >
                {group.icon}
              </span>
              <div>
                <SectionTitle as="h2" className="!text-[clamp(1.4rem,3vw,2rem)]">
                  {group.title}
                </SectionTitle>
                <p className="text-[13px] font-medium" style={{ fontFamily: F.mono, color: MUTED }}>
                  {group.items.length} soru
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {group.items.map((item) => (
                <Card key={item.q} hover>
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                      style={{ background: "rgba(37,99,235,0.1)", color: c, fontFamily: F.display }}
                      aria-hidden
                    >
                      S
                    </span>
                    <h3
                      className="text-[17px] font-bold leading-snug tracking-[-0.01em]"
                      style={{ fontFamily: F.display, color: INK }}
                    >
                      {item.q}
                    </h3>
                  </div>
                  <p
                    className="mt-3 border-t pt-3 text-[15px] leading-relaxed"
                    style={{ color: SUBTLE, borderColor: LINE }}
                  >
                    {item.a}
                  </p>
                </Card>
              ))}
            </div>
          </Section>
        );
      })}

      {/* Sorunu bulamadın mı? */}
      <Section className="py-8">
        <Card className="!rounded-[28px] !p-8 sm:!p-10">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ background: EMERALD }}
              >
                <MessageCircleQuestion size={18} />
              </span>
              <SectionTitle as="h2" className="mt-4 !text-[clamp(1.4rem,3vw,2rem)]">
                Sorunu bulamadın mı?
              </SectionTitle>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: SUBTLE }}>
                Listede yanıtını göremediğin bir sorun mu var? Ekibimiz hesabın,
                kredi notu tahmini ve gizlilikle ilgili her türlü soruna Türkçe yanıt
                veriyor. Yazman yeterli, en kısa sürede dönüş yapıyoruz.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <CTAButton href="/iletisim" variant="primary" size="lg" arrow>
                Bize ulaş
              </CTAButton>
              <CTAButton href="/register" variant="outline" size="lg">
                Erken erişim
              </CTAButton>
            </div>
          </div>
        </Card>
      </Section>

      <GradientCTA
        title="Merak ettiklerini uygulamada gör"
        desc="Davetinle hesabını aç; tahmini kredi notunu ve seni yükseltecek adımları birkaç dakikada keşfet."
      />
    </>
  );
}
