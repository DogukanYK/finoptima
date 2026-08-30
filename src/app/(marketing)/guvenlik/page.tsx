import type { Metadata } from "next";
import {
  PageGlows,
  Section,
  SectionTitle,
  Lead,
  Pill,
  Card,
  FeatureCard,
  DarkPanel,
  GradientCTA,
  CheckItem,
  CTAButton,
} from "@/components/marketing/kit";
import { INK, SUBTLE, MUTED, BLUE, EMERALD, LINE } from "@/components/marketing/theme";
import { F } from "@/components/marketing/fonts";
import {
  Lock,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  FileCheck,
  EyeOff,
  ScrollText,
  Trash2,
  Sparkles,
  Server,
  AlertTriangle,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Güvenlik & Gizlilik",
  description:
    "FinOptima'da finansal verilerin sana ait. Argon2 şifreleme, 2FA, at-rest şifreli hassas alanlar, denetim günlüğü ve KVKK uyumlu veri sahipliği.",
};

export default function Page() {
  return (
    <>
      <PageGlows />

      {/* 1) Hero */}
      <Section className="pt-10 pb-8 lg:pt-16">
        <Pill tone="blue">GÜVENLİK</Pill>
        <SectionTitle as="h1" className="mt-6 max-w-3xl">
          Verilerin sende kalır
        </SectionTitle>
        <Lead className="mt-6 max-w-2xl">
          FinOptima finansal geleceğini planlaman için kurgulandı — bunu yaparken en
          değerli varlığına, kişisel verine, sahip çıkmayı ilk günden itibaren tasarımın
          merkezine koyduk. Şifreleme, kimlik doğrulama ve gizlilik kararlarımızın hepsi
          tek bir ilkeye dayanır: verinin kontrolü senin elinde olsun.
        </Lead>
        <div className="mt-8 flex flex-wrap gap-3">
          <CTAButton href="/register" variant="primary" size="lg" arrow>
            Erken erişime katıl
          </CTAButton>
          <CTAButton href="/iletisim" variant="outline" size="lg">
            Güvenlik ekibine yaz
          </CTAButton>
        </div>
      </Section>

      {/* 2) Güvenlik özellikleri grid */}
      <Section className="py-16">
        <div className="max-w-2xl">
          <Pill tone="green">TEKNİK ÖNLEMLER</Pill>
          <SectionTitle as="h2" className="mt-5">
            Katman katman koruma
          </SectionTitle>
          <Lead className="mt-5">
            Hesabını ve verini birbirini tamamlayan birden çok güvenlik katmanı korur.
            Her katman, biri aşılsa bile diğerinin devrede kalması için tasarlandı.
          </Lead>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Lock size={20} />}
            title="Argon2 ile şifre saklama"
            desc="Parolanı asla düz metin tutmayız. Sektörün önerdiği Argon2 algoritmasıyla, geri döndürülemez biçimde ve her hesaba özel tuzla (salt) saklanır."
            color={BLUE}
          />
          <FeatureCard
            icon={<ShieldCheck size={20} />}
            title="İki adımlı doğrulama (2FA)"
            desc="TOTP tabanlı doğrulama uygulamalarıyla (Google Authenticator, Authy vb.) hesabına ikinci bir kilit ekle. Parolan ele geçse bile giriş engellenir."
            color={EMERALD}
          />
          <FeatureCard
            icon={<KeyRound size={20} />}
            title="Hassas alanlar at-rest şifreli"
            desc="Gelir, borç, kart ve fatura gibi hassas finansal alanlar veritabanında dururken (at-rest) şifrelenir; ham hâliyle okunamaz."
            color={BLUE}
          />
          <FeatureCard
            icon={<Fingerprint size={20} />}
            title="Denetim günlüğü (audit log)"
            desc="Hesabındaki kritik işlemler zaman damgasıyla kaydedilir. Şüpheli bir hareket olduğunda geriye dönük iz sürülebilir ve hesap durumu şeffaf kalır."
            color={EMERALD}
          />
          <FeatureCard
            icon={<EyeOff size={20} />}
            title="Zorunlu banka bağlama YOK"
            desc="FinOptima'yı kullanmak için banka hesabını bağlamak zorunda değilsin. Ne kadar veri paylaşacağına baştan sona sen karar verirsin."
            color={BLUE}
          />
          <FeatureCard
            icon={<FileCheck size={20} />}
            title="Oturum güvenliği"
            desc="Oturumlar imzalı JWT ile yönetilir ve HttpOnly çerezde tutulur. Dilediğinde tüm cihazlardan çıkış yaparak aktif oturumları tek dokunuşla sonlandırırsın."
            color={EMERALD}
          />
        </div>
      </Section>

      {/* 3) KVKK & veri sahipliği */}
      <Section className="py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <Pill tone="blue">KVKK &amp; VERİ SAHİPLİĞİ</Pill>
            <SectionTitle as="h2" className="mt-5">
              Verinin sahibi sensin, biz sadece koruyucusuyuz
            </SectionTitle>
            <Lead className="mt-5">
              6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) senin verin üzerinde
              net haklar tanır: neyin işlendiğini bilme, düzeltme, silme ve taşıma hakkı.
              FinOptima bu hakları bir formaliteye değil, ürünün doğal parçasına dönüştürür.
            </Lead>
            <div className="mt-6 flex flex-wrap gap-3">
              <CTAButton href="/gizlilik" variant="primary" size="md" arrow>
                Gizlilik politikası
              </CTAButton>
              <CTAButton href="/iletisim" variant="outline" size="md">
                Verimi talep et
              </CTAButton>
            </div>
          </div>

          <ul className="grid gap-2.5">
            <CheckItem>
              Verini istediğin an makine-okunur biçimde dışa aktar; başka bir yere taşımak
              tamamen senin inisiyatifin.
            </CheckItem>
            <CheckItem>
              Hesabını ve tüm kişisel verilerini kalıcı olarak silme talebini birkaç
              tıkla başlatabilirsin.
            </CheckItem>
            <CheckItem>
              Reklam çerezi ve üçüncü taraf takip (tracking) kodu kullanmıyoruz — seni
              internette takip etmeyiz.
            </CheckItem>
            <CheckItem>
              Yalnızca oturumun için gereken zorunlu çerezi kullanırız; profil çıkarmak
              için çerez toplamayız.
            </CheckItem>
            <CheckItem>
              Verini reklam ağlarına, veri simsarlarına ya da üçüncü taraflara satmayız
              veya pazarlamayız.
            </CheckItem>
            <CheckItem>
              Yalnızca sana hizmeti sunmak için gereken kadar veri işleriz — veri
              minimizasyonu ilkesiyle çalışırız.
            </CheckItem>
          </ul>
        </div>
      </Section>

      {/* 3b) Altyapı / veri saklama koyu panel */}
      <Section className="py-16">
        <DarkPanel>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <Pill tone="white">ALTYAPI</Pill>
              <SectionTitle as="h3" light className="mt-5">
                Veri Türkiye&apos;de, erişim en aza indirilmiş
              </SectionTitle>
              <Lead light className="mt-5">
                Verilerin güvenli sunucularda barındırılır, düzenli olarak yedeklenir ve
                erişimi yalnızca gerekli olan sınırlı ekip üyeleriyle en aza indirilir.
                Sistemsel işlemler denetim günlüğüne yazılır; kimse verine sessizce
                dokunamaz.
              </Lead>
              <ul className="mt-6 grid gap-2.5">
                <CheckItem light>Şifreli bağlantı (HTTPS/TLS) ile uçtan uca aktarım</CheckItem>
                <CheckItem light>Düzenli otomatik yedekleme ve kurtarma planı</CheckItem>
                <CheckItem light>En az yetki (least privilege) ilkesiyle erişim yönetimi</CheckItem>
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div
                className="rounded-[20px] border p-5"
                style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: "rgba(37,99,235,0.35)" }}>
                  <Server size={20} />
                </span>
                <h4 className="mt-4 text-lg font-bold tracking-[-0.02em]" style={{ fontFamily: F.display, color: "#F8FAFC" }}>
                  Güvenli barındırma
                </h4>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(248,250,252,0.72)" }}>
                  Verilerin güvenlik önlemleri alınmış sunucularda tutulur; sızıntı
                  riskini azaltmak için sistem sürekli güncel tutulur.
                </p>
              </div>
              <div
                className="rounded-[20px] border p-5"
                style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: "rgba(52,211,153,0.3)" }}>
                  <ScrollText size={20} />
                </span>
                <h4 className="mt-4 text-lg font-bold tracking-[-0.02em]" style={{ fontFamily: F.display, color: "#F8FAFC" }}>
                  Şeffaf denetim izi
                </h4>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(248,250,252,0.72)" }}>
                  Kritik işlemler günlüklenir; hesabında ne olup bittiğini geriye dönük
                  görebilir, olağandışı bir durumu fark edebilirsin.
                </p>
              </div>
            </div>
          </div>
        </DarkPanel>
      </Section>

      {/* 4) Yapay zekâ ve gizlilik */}
      <Section className="py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Card className="!p-8">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
              style={{ background: BLUE }}
            >
              <Sparkles size={22} />
            </span>
            <h3 className="mt-5 text-2xl font-bold tracking-[-0.02em]" style={{ fontFamily: F.display, color: INK }}>
              Yapay zekâ, iznin olmadan devreye girmez
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: SUBTLE }}>
              FinOptima&apos;nın yapay zekâ destekli koçu ve belge okuma özelliği yalnızca
              sen açıkça istediğinde çalışır. Bir ekstreyi, faturayı ya da Findeks raporunu
              analiz etmesi için sen yüklersin; arka planda sessizce verini taramaz.
            </p>
          </Card>

          <ul className="grid gap-2.5">
            <CheckItem>
              Belge okuma yalnızca sen bir dosya yüklediğinde ve onay verdiğinde başlar.
            </CheckItem>
            <CheckItem>
              Yüklediğin belgeler amacı dışında saklanmaz; işlem tamamlandığında ihtiyaç
              kalmayan veriler tutulmaz.
            </CheckItem>
            <CheckItem>
              Finansal verilerin yapay zekâ modellerini eğitmek için pazarlanmaz veya
              üçüncü taraflara aktarılmaz.
            </CheckItem>
            <CheckItem>
              Yapay zekânın verdiği öneriler bilgilendirme amaçlıdır; kararı her zaman sen
              verirsin.
            </CheckItem>
          </ul>
        </div>
      </Section>

      {/* 5) Sorumlu açıklama / iletişim */}
      <Section className="pb-8">
        <div
          className="flex flex-col items-start justify-between gap-5 rounded-[24px] border bg-white px-6 py-7 sm:flex-row sm:items-center sm:px-8"
          style={{ borderColor: LINE }}
        >
          <div className="flex items-start gap-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(37,99,235,0.1)", color: BLUE }}
            >
              <AlertTriangle size={20} />
            </span>
            <div>
              <h3 className="text-lg font-bold tracking-[-0.02em]" style={{ fontFamily: F.display, color: INK }}>
                Bir güvenlik açığı mı buldun?
              </h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: SUBTLE }}>
                Sorumlu açıklama (responsible disclosure) ilkesine inanıyoruz. Fark ettiğin
                bir zafiyeti kamuya açıklamadan önce bizimle paylaş; en kısa sürede dönüş
                yapalım. Detayları{" "}
                <span style={{ fontFamily: F.mono, color: MUTED }}>iletişim sayfamızdan</span>{" "}
                iletebilirsin.
              </p>
            </div>
          </div>
          <CTAButton href="/iletisim" variant="primary" size="md" arrow className="shrink-0">
            <Mail size={16} /> Açığı bildir
          </CTAButton>
        </div>
      </Section>

      <GradientCTA
        title="Güvenle başla, kontrol sende"
        desc="Banka bağlama zorunluluğu olmadan, verin sana ait kalarak finansal geleceğini planlamaya bugün başla."
      />
    </>
  );
}
