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
  Gauge,
  Bot,
  FileText,
  ReceiptText,
  CreditCard,
  TrendingDown,
  CalendarClock,
  BarChart3,
  ShieldCheck,
  Command,
  Check,
  Sparkles,
  Building2,
  Download,
  Users,
  ArrowUpRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Özellikler — Türk cüzdanına göre finans",
  description:
    "Kredi notu koçluğundan banka ekstresi okuyan yapay zekâya, kart ve taksit takibinden borç kapatma planına kadar FinOptima'nın tüm özellikleri — Türkiye için tasarlandı.",
};

const FEATURES = [
  {
    Icon: Gauge,
    title: "Kredi notu koçluğu",
    desc: "Davranışından yola çıkan tahmini Findeks skoru ve onu yükseltmek için bu ay yapman gerekenler — önem sırasıyla, tek tek.",
    c: BLUE,
  },
  {
    Icon: Bot,
    title: "AI asistan",
    desc: "⌘K komut paleti, doğal dil sohbeti ve “anlat, ekleyeyim” akışı. “Dün markete 350 verdim” de, işlem hesabına düşsün.",
    c: EMERALD,
  },
  {
    Icon: FileText,
    title: "Her banka ekstresini okur",
    desc: "Garanti, Enpara, Yapı Kredi ya da hiç tanımadığın bir banka — yapay zekâ ekstreni okur, kategorilere ayırır.",
    c: BLUE,
  },
  {
    Icon: ReceiptText,
    title: "Fiş & fatura okuma",
    desc: "Fişin fotoğrafını çek; tutar, tarih ve satıcı otomatik çıkarılsın. Elektrik, su, aidat faturaların düzene girsin.",
    c: EMERALD,
  },
  {
    Icon: CreditCard,
    title: "Kart & taksit takibi",
    desc: "Kredi kartı ekstresi, taksitli alışverişler, kart aidatı ve KMH — Türkiye'nin taksit kültürüne göre tek panelde.",
    c: BLUE,
  },
  {
    Icon: TrendingDown,
    title: "Borç kapatma planı",
    desc: "Kartlarını ve kredilerini gör; hangi borcu önce kapatman gerektiğini kartopu/çığ mantığıyla sıralayalım.",
    c: EMERALD,
  },
  {
    Icon: CalendarClock,
    title: "Takvim & yaklaşan ödemeler",
    desc: "Son ödeme günleri, taksit tarihleri ve faturalar bir takvimde. Gecikme faizine düşmeden önce haberin olsun.",
    c: BLUE,
  },
  {
    Icon: BarChart3,
    title: "Aylık raporlar",
    desc: "Ay ay nereye ne kadar gitti, hangi kategori büyüdü, kredi sağlığın nasıl değişti — sade grafiklerle özetlensin.",
    c: EMERALD,
  },
  {
    Icon: ShieldCheck,
    title: "Gizlilik & KVKK",
    desc: "Argon2 şifreleme, iki adımlı doğrulama ve denetim günlüğü. Verilerin senin; dilediğinde dışa aktar ya da sil.",
    c: BLUE,
  },
];

export default function Page() {
  return (
    <>
      <PageGlows />

      {/* ===== Hero ===== */}
      <Section className="pt-10 pb-6 lg:pt-16">
        <Pill tone="blue">
          <Sparkles size={13} /> ÖZELLİKLER
        </Pill>
        <SectionTitle as="h1" className="mt-6 max-w-3xl">
          Türk cüzdanına göre{" "}
          <span
            style={{
              background: GRAD,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            tasarlandı
          </span>
          .
        </SectionTitle>
        <Lead className="mt-6 max-w-2xl">
          Taksit, KMH, kart aidatı, Findeks, aidat faturası… FinOptima yurt dışından
          kopyalanmış bir bütçe uygulaması değil. Türkiye'de paranın gerçekten nasıl
          aktığını bilen bir yapay zekâ asistanı, kredi notu koçu ve tek ekranlık borç
          panosu — hepsi bir arada.
        </Lead>
        <div className="mt-8 flex flex-wrap gap-3">
          <CTAButton href="/register" size="lg" arrow>
            Ücretsiz başla
          </CTAButton>
          <CTAButton href="/nasil-calisir" variant="outline" size="lg">
            Nasıl çalışır?
          </CTAButton>
        </div>
      </Section>

      {/* ===== Büyük özellik grid'i ===== */}
      <Section className="py-14">
        <div className="max-w-2xl">
          <Pill tone="green">HEPSİ TEK YERDE</Pill>
          <SectionTitle as="h2" className="mt-5">
            İhtiyacın olan her şey
          </SectionTitle>
          <Lead className="mt-4">
            Ekstre okumaktan borç kapatmaya, kredi notundan gizliliğe kadar dokuz temel
            yetenek. Hepsi birbiriyle konuşur; bir yere girdiğin veri her yerde işine yarar.
          </Lead>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureCard
              key={f.title}
              icon={<f.Icon size={20} />}
              title={f.title}
              desc={f.desc}
              color={f.c}
            />
          ))}
        </div>
      </Section>

      {/* ===== Derinlemesine 1: AI asistan (metin | görsel) ===== */}
      <Section className="py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Pill tone="blue">
              <Bot size={13} /> AI ASİSTAN
            </Pill>
            <SectionTitle as="h2" className="mt-5">
              Konuş, gerisini o halletsin
            </SectionTitle>
            <Lead className="mt-4">
              Form doldurmak yok. Harcamanı olduğu gibi anlat — asistan tutarı, kategoriyi
              ve tarihi çıkarıp işlemi senin için oluşturur. Aklına takılanı sor; cevabı
              senin gerçek verinden verir, uydurmaz.
            </Lead>
            <ul className="mt-6 grid gap-2.5">
              <CheckItem>
                <span>
                  <strong>Doğal dilden giriş:</strong> “Dün akşam yemeği 640 TL, kartla” →
                  işlem hazır.
                </span>
              </CheckItem>
              <CheckItem>
                <span>
                  <strong>Soru-cevap:</strong> “Bu ay kahveye ne kadar gitti?” diye sor,
                  anında yanıt al.
                </span>
              </CheckItem>
              <CheckItem>
                <span>
                  <strong>⌘K komut paleti:</strong> Nereye gideceğini aramadan, tek
                  kısayolla her işleme ulaş.
                </span>
              </CheckItem>
              <CheckItem>
                <span>
                  <strong>Koçluk önerileri:</strong> “Kredi notumu nasıl yükseltirim?” de,
                  sıralı plan çıkarsın.
                </span>
              </CheckItem>
            </ul>
          </div>

          {/* Görsel taraf: komut paleti + sohbet mock'u */}
          <Card className="!p-5">
            <div
              className="flex items-center gap-2 rounded-2xl border px-4 py-3"
              style={{ borderColor: LINE, background: "#F8FAFC" }}
            >
              <Command size={16} style={{ color: BLUE }} />
              <span className="text-sm" style={{ color: MUTED, fontFamily: F.mono }}>
                Bir şey yaz ya da sor…
              </span>
              <kbd
                className="ml-auto rounded-md border px-2 py-0.5 text-[11px] font-semibold"
                style={{ borderColor: LINE, color: SUBTLE, fontFamily: F.mono }}
              >
                ⌘K
              </kbd>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex justify-end">
                <div
                  className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm text-white"
                  style={{ background: BLUE }}
                >
                  Bugün markete 480 TL harcadım
                </div>
              </div>
              <div className="flex justify-start">
                <div
                  className="max-w-[85%] rounded-2xl rounded-bl-md border px-4 py-3 text-sm"
                  style={{ borderColor: LINE, background: "#fff", color: INK }}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: EMERALD }}>
                    <Check size={13} /> İşlem eklendi
                  </span>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="font-medium">Market · Gıda</span>
                    <span className="font-bold" style={{ fontFamily: F.mono }}>
                      −480,00 ₺
                    </span>
                  </div>
                  <div className="mt-1 text-[12px]" style={{ color: MUTED }}>
                    12 Temmuz · Kredi kartı
                  </div>
                </div>
              </div>
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-md px-4 py-2.5 text-sm"
                  style={{ background: "rgba(37,99,235,0.08)", color: BLUE }}
                >
                  Bu ay markete toplam 3.240 ₺ gitti — geçen aya göre %12 düşük. 👌
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      {/* ===== Derinlemesine 2: Her banka ekstresi (görsel | metin) ===== */}
      <Section className="py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Görsel taraf: banka satırları + eşleştirme */}
          <Card className="order-2 !p-5 lg:order-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold" style={{ color: INK }}>
                Yüklenen ekstre
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{ background: "rgba(5,150,105,0.1)", color: EMERALD }}
              >
                Banka otomatik tanındı
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { b: "Garanti BBVA", f: "ekstre_haziran.pdf", ok: true },
                { b: "Enpara", f: "hesap_hareketleri.xlsx", ok: true },
                { b: "Yapı Kredi", f: "dekont_0712.jpg", ok: true },
                { b: "Tanınmayan banka", f: "hareketler.pdf", ok: true },
              ].map((r) => (
                <div
                  key={r.b}
                  className="flex items-center gap-3 rounded-xl border px-3.5 py-3"
                  style={{ borderColor: LINE, background: "#fff" }}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "rgba(37,99,235,0.08)", color: BLUE }}
                  >
                    <Building2 size={16} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: INK }}>
                      {r.b}
                    </div>
                    <div className="truncate text-[12px]" style={{ color: MUTED, fontFamily: F.mono }}>
                      {r.f}
                    </div>
                  </div>
                  <span
                    className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(5,150,105,0.12)", color: EMERALD }}
                  >
                    <Check size={13} />
                  </span>
                </div>
              ))}
            </div>

            <div
              className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 text-sm"
              style={{ background: "#F8FAFC" }}
            >
              <span style={{ color: SUBTLE }}>3 mükerrer kayıt elendi</span>
              <span className="font-semibold" style={{ color: EMERALD }}>
                142 işlem hazır
              </span>
            </div>
          </Card>

          <div className="order-1 lg:order-2">
            <Pill tone="green">
              <FileText size={13} /> EKSTRE OKUMA
            </Pill>
            <SectionTitle as="h2" className="mt-5">
              Hangi banka olursa olsun okur
            </SectionTitle>
            <Lead className="mt-4">
              Her bankanın ekstre formatı farklıdır — kimi PDF, kimi Excel, kimi sadece bir
              ekran görüntüsü. FinOptima'nın yapay zekâsı hepsini anlar. Bankayı sen
              seçmezsin; sistem dosyadan otomatik tanır ve işlemleri düzene sokar.
            </Lead>
            <ul className="mt-6 grid gap-2.5">
              <CheckItem>
                Garanti, Enpara, Yapı Kredi ve tanınmayan bankalar dahil geniş uyum
              </CheckItem>
              <CheckItem>PDF, fotoğraf ve Excel — dosya ne olursa olsun</CheckItem>
              <CheckItem>Banka otomatik algılanır, elle seçim gerekmez</CheckItem>
              <CheckItem>Aynı işlemi iki kez yüklesen bile mükerrerler elenir</CheckItem>
            </ul>
          </div>
        </div>
      </Section>

      {/* ===== Derinlemesine 3: Kredi notu koçluğu (koyu panel) ===== */}
      <Section className="py-14">
        <DarkPanel>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Pill tone="white">
                <Gauge size={13} /> KREDİ NOTU KOÇLUĞU
              </Pill>
              <SectionTitle as="h2" light className="mt-5">
                Bu ay ne yapman gerektiğini söyler
              </SectionTitle>
              <Lead light className="mt-4">
                Tahmini kredi notunu göstermek yetmez. FinOptima notunu en çok neyin
                etkilediğini bulur ve her ay öncelik sırasına dizilmiş somut bir aksiyon
                planı çıkarır. Tek yapman gereken listeyi yukarıdan aşağı uygulamak.
              </Lead>
              <ul className="mt-6 grid gap-2.5">
                <CheckItem light>Notunu düşüren alışkanlıkları tespit eder</CheckItem>
                <CheckItem light>Her ay öncelikli aksiyon planı üretir</CheckItem>
                <CheckItem light>Attığın adımın skora etkisini takip eder</CheckItem>
              </ul>
            </div>

            {/* Görsel taraf: aylık plan kartı */}
            <div
              className="rounded-[22px] border p-5"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Bu ayki plan</span>
                <span
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ background: "rgba(52,211,153,0.16)", color: "#34D399" }}
                >
                  <ArrowUpRight size={12} /> +18 puan potansiyel
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {[
                  { p: "1", t: "Kart kullanımını %30'un altına çek", tag: "Yüksek etki", hot: true },
                  { p: "2", t: "Gecikmiş aidat faturasını kapat", tag: "Yüksek etki", hot: true },
                  { p: "3", t: "En eski kartını açık tut", tag: "Orta etki", hot: false },
                ].map((a) => (
                  <div
                    key={a.p}
                    className="flex items-center gap-3 rounded-xl px-3.5 py-3"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ background: a.hot ? BLUE : "rgba(255,255,255,0.14)" }}
                    >
                      {a.p}
                    </span>
                    <span className="text-sm text-white">{a.t}</span>
                    <span
                      className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        background: a.hot ? "rgba(52,211,153,0.16)" : "rgba(255,255,255,0.1)",
                        color: a.hot ? "#34D399" : "rgba(248,250,252,0.7)",
                      }}
                    >
                      {a.tag}
                    </span>
                  </div>
                ))}
              </div>

              <div
                className="mt-4 flex items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "rgba(37,99,235,0.16)" }}
              >
                <span className="text-sm" style={{ color: "rgba(248,250,252,0.85)" }}>
                  Tahmini skor
                </span>
                <span className="text-lg font-bold text-white" style={{ fontFamily: F.mono }}>
                  1.612 <span style={{ color: "#34D399" }}>▲</span>
                </span>
              </div>
            </div>
          </div>
        </DarkPanel>
      </Section>

      {/* ===== Ve dahası — mini liste ===== */}
      <Section className="py-14">
        <div className="max-w-2xl">
          <Pill tone="blue">VE DAHASI</Pill>
          <SectionTitle as="h2" className="mt-5">
            Ayrıntıda gizli kolaylıklar
          </SectionTitle>
          <Lead className="mt-4">
            Günlük kullanımda fark yaratan küçük ama önemli yetenekler.
          </Lead>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card hover>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ background: BLUE }}
            >
              <Sparkles size={20} />
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-[-0.02em]" style={{ fontFamily: F.display }}>
              Senaryolar
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: SUBTLE }}>
              “Bu krediyi çekersem bütçem ne olur?” diye sor; olası kararların bütçene
              etkisini önceden gör.
            </p>
          </Card>

          <Card hover>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ background: EMERALD }}
            >
              <Users size={20} />
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-[-0.02em]" style={{ fontFamily: F.display }}>
              Çoklu hesap
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: SUBTLE }}>
              Kendi kartların, KMH'in ve ev bütçen ayrı ayrı ya da birlikte — her hesabı
              tek çatı altında yönet.
            </p>
          </Card>

          <Card hover>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={{ background: BLUE }}
            >
              <Download size={20} />
            </span>
            <h3 className="mt-4 text-lg font-bold tracking-[-0.02em]" style={{ fontFamily: F.display }}>
              Dışa aktarma
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: SUBTLE }}>
              İşlemlerini ve raporlarını Excel/CSV olarak indir. Verin senin; dilediğin an
              yanında götür.
            </p>
          </Card>
        </div>
      </Section>

      <GradientCTA
        title="Tüm bunlar, ücretsiz başlıyor"
        desc="Kredi notu koçluğu, ekstre okuma ve borç panosu — hepsini bugün dene. Kart bilgisi gerekmez."
      />
    </>
  );
}
