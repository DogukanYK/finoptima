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
import {
  INK,
  SUBTLE,
  MUTED,
  BLUE,
  EMERALD,
  GRAD,
} from "@/components/marketing/theme";
import { F } from "@/components/marketing/fonts";
import {
  Target,
  ShieldCheck,
  MapPin,
  Sparkles,
  Compass,
  HeartHandshake,
  Smartphone,
  Landmark,
  Rocket,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "FinOptima'yı neden kurduk, nelere inanıyoruz ve Türkiye'de finansal sağlığı herkes için nasıl erişilebilir kılmaya çalışıyoruz.",
};

export default function Page() {
  return (
    <>
      <PageGlows />

      {/* 1) HERO */}
      <Section className="pt-10 pb-8 lg:pt-16">
        <Pill tone="blue">HAKKIMIZDA</Pill>
        <SectionTitle as="h1" className="mt-6 max-w-4xl">
          Türkiye'de finansal sağlığı herkes için erişilebilir kılıyoruz
        </SectionTitle>
        <Lead className="mt-6 max-w-2xl">
          FinOptima, kredi notunu ve kişisel finansı anlaşılır, aksiyona dönük ve
          Türkiye'nin gerçeklerine uygun hâle getirmek için kuruldu. Amacımız
          basit: parayla ilişkinizde nerede durduğunuzu net görmenizi ve bir
          sonraki adımın ne olduğunu tereddütsüz bilmenizi sağlamak.
        </Lead>
        <div className="mt-8 flex flex-wrap gap-3">
          <CTAButton href="/register" size="lg" arrow>
            Erken erişime katıl
          </CTAButton>
          <CTAButton href="/ozellikler" variant="outline" size="lg">
            Özellikleri keşfet
          </CTAButton>
        </div>
      </Section>

      {/* 2) NEDEN KURDUK — HİKAYE */}
      <Section className="py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
          <div>
            <Pill tone="muted">NEDEN KURDUK</Pill>
            <SectionTitle as="h2" className="mt-5 max-w-xl">
              Kredi notu kritik, ama kimse ne yapacağınızı söylemiyor
            </SectionTitle>
            <Lead className="mt-5 max-w-xl">
              Türkiye'de bir konut kredisi, taşıt kredisi, kredi kartı limiti ya
              da ihtiyaç kredisi başvurusunda kredi notu çoğu zaman kaderi
              belirliyor. Ama insanlar notlarını öğrendiklerinde genellikle tek
              bir üç haneli sayıyla baş başa kalıyor: iyi mi, kötü mü, neden bu
              seviyede, yükseltmek için ne yapmalı — hiçbiri net değil.
            </Lead>
          </div>

          <div className="grid gap-4">
            <Card className="p-6">
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: MUTED }}
              >
                <span style={{ color: INK, fontFamily: F.display }}>
                  Bütçe uygulamaları harcamalarınızı gösterir.
                </span>{" "}
                Fatura, taksit, kart aidatı ve KMH kalemlerini renkli grafiklere
                döker; ama grafiğe bakıp “peki şimdi ne yapayım?” dediğinizde
                ortada bir cevap kalmaz. Görmek, bilmek değildir.
              </p>
            </Card>
            <Card className="p-6">
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: MUTED }}
              >
                <span style={{ color: INK, fontFamily: F.display }}>
                  Bilgi ise dağınık ve karmaşık.
                </span>{" "}
                Findeks, banka ekranları, forumlar, birbirini tutmayan
                tavsiyeler… Kime güveneceğini bilememek, çoğu insanın en basit
                adımı bile ertelemesine yol açıyor.
              </p>
            </Card>
            <Card className="p-6">
              <p
                className="text-[15px] leading-relaxed"
                style={{ color: MUTED }}
              >
                <span style={{ color: EMERALD, fontFamily: F.display }}>
                  FinOptima aksiyon odaklı.
                </span>{" "}
                Sadece durumunuzu göstermekle kalmıyoruz; notunuzu etkileyen
                kalemleri açıklıyor, önceliklendirilmiş somut adımlar öneriyor ve
                attığınız her adımın etkisini takip ediyoruz.
              </p>
            </Card>
          </div>
        </div>

        <DarkPanel className="mt-12 p-8 sm:p-10">
          <SectionTitle as="h3" light className="max-w-2xl">
            Fark, “ne oluyor?” ile “ne yapmalıyım?” arasında
          </SectionTitle>
          <Lead light className="mt-4 max-w-2xl">
            Çoğu finans aracı ilk soruda durur. Biz ikinci soruya odaklandık.
            Çünkü finansal sağlık, bir tabloya bakmakla değil; doğru sırayla
            atılan küçük, sürdürülebilir adımlarla iyileşir.
          </Lead>
          <ul className="mt-7 grid gap-2.5 sm:grid-cols-2">
            <CheckItem light>Notunuzu düşüren kalemleri sade dille açıklarız</CheckItem>
            <CheckItem light>Önce hangi adımın en çok etki edeceğini söyleriz</CheckItem>
            <CheckItem light>Her öneriyi Türkiye'deki ürün gerçekliğine göre kurarız</CheckItem>
            <CheckItem light>İlerlemenizi zaman içinde birlikte izleriz</CheckItem>
          </ul>
        </DarkPanel>
      </Section>

      {/* 3) DEĞERLERİMİZ */}
      <Section className="py-16 lg:py-20">
        <div className="max-w-2xl">
          <Pill tone="blue">DEĞERLERİMİZ</Pill>
          <SectionTitle as="h2" className="mt-5">
            Hangi ilkelerle çalışıyoruz
          </SectionTitle>
          <Lead className="mt-5">
            Ürünle ilgili her kararı bu dört ilkeye göre veriyoruz. Bir özellik
            bunlardan biriyle çelişiyorsa, o özelliği yeniden düşünürüz.
          </Lead>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-2">
          <FeatureCard
            icon={<Target size={22} />}
            title="Aksiyon odaklılık"
            desc="Her ekranın sonunda net bir sonraki adım olmalı. Veriyi göstermek yetmez; ne yapılacağını söylemeden işimizi bitmiş saymayız."
            color={BLUE}
          />
          <FeatureCard
            icon={<ShieldCheck size={22} />}
            title="Önce gizlilik"
            desc="Finansal veri en hassas veridir. Yalnızca gerektiği kadarını isteriz, açıkça açıklarız ve verinizi size hizmet etmek dışında bir amaca alet etmeyiz."
            color={EMERALD}
          />
          <FeatureCard
            icon={<MapPin size={22} />}
            title="Türkiye'ye özel"
            desc="Findeks, KMH, kart aidatı, taksitli harcama, esnek hesap… Kavramları ve önerileri başka bir ülkenin sisteminden kopyalamıyoruz; buradaki gerçeğe göre kuruyoruz."
            color={BLUE}
          />
          <FeatureCard
            icon={<Sparkles size={22} />}
            title="Sadelik"
            desc="Finans zaten yeterince yorucu. Karmaşık jargon yerine anlaşılır dil, kalabalık ekranlar yerine net öncelikler koyuyoruz. Anlamadığınız hiçbir şeyi önermeyiz."
            color={EMERALD}
          />
        </div>
      </Section>

      {/* 4) NASIL ÇALIŞIYORUZ */}
      <Section className="py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <Pill tone="muted">NASIL ÇALIŞIYORUZ</Pill>
            <SectionTitle as="h2" className="mt-5 max-w-md">
              Küçük ekip, Türkiye'de geliştirildi, hızlı iterasyon
            </SectionTitle>
            <Lead className="mt-5 max-w-lg">
              FinOptima, kullanıcıya yakın çalışan küçük bir ekip tarafından
              Türkiye'de geliştiriliyor. Büyük vaatler yerine küçük ve sık
              iyileştirmelere inanıyoruz: gerçek kullanıcı ihtiyaçlarını dinler,
              hızla dener, işe yarayanı bırakır, yaramayanı çıkarırız.
            </Lead>
            <p className="mt-4 max-w-lg text-[14px] leading-relaxed" style={{ color: MUTED }}>
              finoptima.dev, geliştirdiğimiz yapay zekâ destekli finansal sağlık
              motorunun canlı referans uygulamasıdır: aynı motoru bankaların ve
              finans kurumlarının kendi kanallarında sunabileceği bir katman
              olarak da kurguluyoruz. Buradaki ürün ise her zaman doğrudan
              kullanıcı için kalır.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-6">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                style={{ background: GRAD, color: "#fff" }}
              >
                <Compass size={20} />
              </div>
              <h3
                className="mt-4 text-[17px]"
                style={{ color: INK, fontFamily: F.display }}
              >
                Kullanıcıya yakın
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: MUTED }}>
                Kararları masabaşında değil, gerçek kullanım geri bildirimleriyle
                veririz. Ekranları insanların hayatına göre şekillendiririz.
              </p>
            </Card>
            <Card className="p-6">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                style={{ background: GRAD, color: "#fff" }}
              >
                <HeartHandshake size={20} />
              </div>
              <h3
                className="mt-4 text-[17px]"
                style={{ color: INK, fontFamily: F.display }}
              >
                Dürüstlük
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: MUTED }}>
                Abartılı vaat vermeyiz. Bir şeyin sınırını biliyorsak açıkça
                söyleriz; güven, en değerli varlığımız.
              </p>
            </Card>
            <Card className="p-6">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                style={{ background: GRAD, color: "#fff" }}
              >
                <Rocket size={20} />
              </div>
              <h3
                className="mt-4 text-[17px]"
                style={{ color: INK, fontFamily: F.display }}
              >
                Hızlı iterasyon
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: MUTED }}>
                Küçük ve sık güncellemeler yayınlarız. İyileştirmeyi bir sonraki
                büyük sürüme ertelemeyiz.
              </p>
            </Card>
            <Card className="p-6">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-[14px]"
                style={{ background: GRAD, color: "#fff" }}
              >
                <MapPin size={20} />
              </div>
              <h3
                className="mt-4 text-[17px]"
                style={{ color: INK, fontFamily: F.display }}
              >
                Yerelde geliştirildi
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed" style={{ color: MUTED }}>
                Türkiye'de, buradaki finans gerçekliğini yaşayan bir ekip
                tarafından geliştiriliyor. Bağlamı dışarıdan öğrenmiyoruz.
              </p>
            </Card>
          </div>
        </div>
      </Section>

      {/* 5) YOL HARİTASI */}
      <Section className="py-16 lg:py-20">
        <div className="max-w-2xl">
          <Pill tone="green">YOL HARİTASI</Pill>
          <SectionTitle as="h2" className="mt-5">
            Sırada ne var
          </SectionTitle>
          <Lead className="mt-5">
            Yol haritamızı büyük iddialarla değil, çözmek istediğimiz gerçek
            ihtiyaçlarla çiziyoruz. Aşağıdakiler üzerinde çalıştığımız
            yönler — her biri hazır olduğunda paylaşacağız.
          </Lead>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Card className="flex flex-col p-7">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[16px]"
              style={{ background: "rgba(37,99,235,0.10)", color: BLUE }}
            >
              <Smartphone size={22} />
            </div>
            <span
              className="mt-5 text-[13px] font-medium"
              style={{ color: BLUE }}
            >
              YAKINDA
            </span>
            <h3
              className="mt-1 text-[19px]"
              style={{ color: INK, fontFamily: F.display }}
            >
              Mobil uygulama
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: MUTED }}>
              Notunuzu ve önerileri cebinizde takip edebilmeniz için mobil
              deneyim üzerinde çalışıyoruz.
            </p>
          </Card>

          <Card className="flex flex-col p-7">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[16px]"
              style={{ background: "rgba(5,150,105,0.10)", color: EMERALD }}
            >
              <Sparkles size={22} />
            </div>
            <span
              className="mt-5 text-[13px] font-medium"
              style={{ color: EMERALD }}
            >
              YAKINDA
            </span>
            <h3
              className="mt-1 text-[19px]"
              style={{ color: INK, fontFamily: F.display }}
            >
              Pro planı
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: MUTED }}>
              Çok hesaplı aile paneli, senaryo simülasyonları ve alışkanlığınızdan
              öğrenen kategori motoru isteyenler için genişletilmiş bir plan.
            </p>
          </Card>

          <Card className="flex flex-col p-7">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[16px]"
              style={{ background: "rgba(37,99,235,0.10)", color: BLUE }}
            >
              <Landmark size={22} />
            </div>
            <span
              className="mt-5 text-[13px] font-medium"
              style={{ color: BLUE }}
            >
              YAKINDA
            </span>
            <h3
              className="mt-1 text-[19px]"
              style={{ color: INK, fontFamily: F.display }}
            >
              Açık bankacılık
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: MUTED }}>
              İzin verdiğiniz ölçüde hesaplarınızı güvenle bağlayarak önerileri
              gerçek verinizle daha da isabetli hâle getirmek.
            </p>
          </Card>
        </div>

        <p className="mt-6 text-[13px]" style={{ color: SUBTLE }}>
          Yol haritası, kullanıcı ihtiyaçlarına göre değişebilir. Tarih taahhüdü
          vermiyoruz; hazır olan özelliği zamanı geldiğinde duyuruyoruz.
        </p>
      </Section>

      <GradientCTA
        title="Bize katıl"
        desc="Finansal sağlığını netleştirmeye bugün başla. Davetinle hesabını oluştur, notunu ve ilk adımlarını dakikalar içinde gör."
        primaryHref="/register"
        primaryLabel="Erken erişime katıl"
        secondaryHref="/ozellikler"
        secondaryLabel="Özellikleri keşfet"
      />
    </>
  );
}
