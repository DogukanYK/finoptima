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
import { INK, SUBTLE, MUTED, BLUE, EMERALD, LINE } from "@/components/marketing/theme";
import { F } from "@/components/marketing/fonts";
import {
  Mail,
  LifeBuoy,
  ShieldCheck,
  MessageCircle,
  Clock,
  HelpCircle,
  ArrowUpRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "FinOptima ekibiyle iletişime geçin. Genel sorular, teknik destek, KVKK veri talepleri ve güvenlik bildirimleri için e-posta kanallarımız ve yanıt sürelerimiz.",
};

const channels = [
  {
    icon: Mail,
    color: BLUE,
    label: "Genel & Destek",
    title: "Her konuda bize yazın",
    desc: "Ürün, hesabınız, kredi notu hesaplaması ya da öneriniz — aklınıza takılan her şey için ilk adres burası. Ekibimiz mesajınızı okur ve doğru kişiye yönlendirir.",
    email: "destek@finoptima.com.tr",
    cta: "E-posta gönder",
  },
  {
    icon: ShieldCheck,
    color: EMERALD,
    label: "KVKK & Veri Talepleri",
    title: "Verileriniz üzerindeki haklarınız",
    desc: "Kişisel verilerinize erişim, düzeltme, silme ya da işlemenin durdurulması taleplerinizi bu adrese iletin. KVKK kapsamındaki başvurularınız yasal süreler içinde yanıtlanır.",
    email: "kvkk@finoptima.com.tr",
    cta: "KVKK talebi gönder",
  },
  {
    icon: LifeBuoy,
    color: BLUE,
    label: "Güvenlik Bildirimi",
    title: "Bir açık mı fark ettiniz?",
    desc: "Uygulamada güvenlik açığı, şüpheli bir işlem veya kötüye kullanım gördüyseniz sorumlu ifşa ilkesiyle bize bildirin. Detaylı, tekrarlanabilir örnekler süreci hızlandırır.",
    email: "guvenlik@finoptima.com.tr",
    cta: "Güvenlik bildir",
  },
  {
    icon: MessageCircle,
    color: EMERALD,
    label: "Sosyal Medya",
    title: "Bizi takip edin",
    desc: "Yeni özellikler, finansal okuryazarlık içerikleri ve duyurular için sosyal hesaplarımızı takip edin. Kısa sorularınıza mesaj kutusundan da dönüş yapıyoruz.",
    social: true,
  },
];

export default function Page() {
  return (
    <>
      <PageGlows />

      {/* 1) Hero */}
      <Section className="pt-10 pb-8 lg:pt-16">
        <Pill tone="blue">İLETİŞİM</Pill>
        <SectionTitle as="h1" className="mt-6 max-w-3xl">
          Bize ulaş
        </SectionTitle>
        <Lead className="mt-6 max-w-2xl">
          Sorunuz, öneriniz ya da bir sorununuz mu var? Doğru kanalı seçin,
          mesajınız gecikmeden ilgili ekibe ulaşsın. FinOptima ekibi olarak her
          geri bildirimi ciddiye alıyor ve ürünü sizinle birlikte
          geliştiriyoruz.
        </Lead>
      </Section>

      {/* 2) İletişim kanalları */}
      <Section className="py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {channels.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.label} hover className="p-7 flex flex-col">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[14px]"
                  style={{ background: `${c.color}14`, color: c.color }}
                >
                  <Icon size={22} strokeWidth={1.75} />
                </div>
                <div
                  className="mt-5 text-[12px] font-semibold uppercase tracking-wide"
                  style={{ color: c.color, fontFamily: F.mono }}
                >
                  {c.label}
                </div>
                <h3
                  className="mt-2 text-[19px] font-semibold"
                  style={{ color: INK, fontFamily: F.display }}
                >
                  {c.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed" style={{ color: MUTED }}>
                  {c.desc}
                </p>

                <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${LINE}` }}>
                  {c.social ? (
                    <div className="flex flex-wrap gap-3">
                      {["LinkedIn", "Instagram", "X"].map((s) => (
                        <a
                          key={s}
                          href="#"
                          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors"
                          style={{ border: `1px solid ${LINE}`, color: SUBTLE }}
                        >
                          {s}
                          <ArrowUpRight size={13} />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <a
                      href={`mailto:${c.email}`}
                      className="inline-flex items-center gap-2 text-[15px] font-semibold transition-opacity hover:opacity-80"
                      style={{ color: c.color }}
                    >
                      <Mail size={16} />
                      {c.email}
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* 3) Yanıt süresi + önce SSS */}
      <Section className="py-12">
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-8">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[13px]"
              style={{ background: `${BLUE}14`, color: BLUE }}
            >
              <Clock size={20} strokeWidth={1.75} />
            </div>
            <h3
              className="mt-5 text-[20px] font-semibold"
              style={{ color: INK, fontFamily: F.display }}
            >
              Yanıt süremiz
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: MUTED }}>
              E-postalarınıza genellikle{" "}
              <strong style={{ color: INK }}>1-2 iş günü</strong> içinde dönüş
              yapıyoruz. Yoğun dönemlerde süre biraz uzayabilir; acele etmeyin,
              her mesaj sırayla ve eksiksiz yanıtlanır.
            </p>
            <ul className="mt-5 grid gap-2.5">
              <CheckItem>Hafta içi 09:00-18:00 arası daha hızlı dönüş</CheckItem>
              <CheckItem>KVKK başvuruları yasal süreler içinde yanıtlanır</CheckItem>
              <CheckItem>Güvenlik bildirimleri öncelikli olarak incelenir</CheckItem>
            </ul>
          </Card>

          <Card className="p-8 flex flex-col">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-[13px]"
              style={{ background: `${EMERALD}14`, color: EMERALD }}
            >
              <HelpCircle size={20} strokeWidth={1.75} />
            </div>
            <h3
              className="mt-5 text-[20px] font-semibold"
              style={{ color: INK, fontFamily: F.display }}
            >
              Önce SSS&apos;ye bakın
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: MUTED }}>
              Kredi notu nasıl hesaplanır, verileriniz nasıl korunur, hesabınızı
              nasıl silersiniz? En sık sorulan soruların yanıtları hazır —
              yazmadan önce bir göz atarsanız cevabınızı anında bulabilirsiniz.
            </p>
            <div className="mt-auto pt-6">
              <CTAButton href="/sss" variant="outline" size="md" arrow>
                Sıkça Sorulan Sorular
              </CTAButton>
            </div>
          </Card>
        </div>
      </Section>

      {/* 4) Büyük mailto kartı */}
      <Section className="py-12">
        <DarkPanel className="px-8 py-14 text-center sm:px-14">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px]"
            style={{ background: "rgba(255,255,255,0.10)", color: "#fff" }}
          >
            <Mail size={26} strokeWidth={1.75} />
          </div>
          <SectionTitle as="h2" light className="mt-6">
            Aklınızdaki her şeyi yazın
          </SectionTitle>
          <Lead light className="mx-auto mt-4 max-w-xl">
            Tek bir e-posta yeter. Ekibimiz mesajınızı okur, doğru birime
            yönlendirir ve en kısa sürede geri döner. Hangi konu olursa olsun,
            başlamak için tıklamanız yeterli.
          </Lead>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CTAButton
              href="mailto:destek@finoptima.com.tr"
              variant="white"
              size="lg"
            >
              E-posta gönder
            </CTAButton>
            <CTAButton href="/sss" variant="ghostWhite" size="lg" arrow>
              Önce SSS&apos;ye bak
            </CTAButton>
          </div>
          <p className="mt-6 text-[13px]" style={{ color: "rgba(255,255,255,0.55)" }}>
            destek@finoptima.com.tr &nbsp;·&nbsp; kvkk@finoptima.com.tr
            &nbsp;·&nbsp; guvenlik@finoptima.com.tr
          </p>
        </DarkPanel>
      </Section>

      <GradientCTA
        title="Kredi notunuzu görmeye hazır mısınız?"
        desc="FinOptima ile finansal sağlığınızı ücretsiz keşfedin, kişiye özel önerilerle notunuzu adım adım yükseltin."
        primaryHref="/register"
        primaryLabel="Erken erişime katıl"
        secondaryHref="/sss"
        secondaryLabel="Sıkça sorulan sorular"
      />
    </>
  );
}
