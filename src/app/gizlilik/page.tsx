import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Brand } from "@/components/brand";

export const metadata: Metadata = {
  title: "Gizlilik & Aydınlatma Metni",
  description: "FinOptima KVKK aydınlatma metni ve çerez politikası.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export default function GizlilikPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-8">
      <div className="flex items-center justify-between">
        <Brand size={30} />
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft size={15} /> Geri
        </Link>
      </div>

      <h1 className="mt-7 font-heading text-2xl font-extrabold text-ink sm:text-3xl">
        Gizlilik &amp; Aydınlatma Metni
      </h1>
      <p className="mt-1 text-sm text-muted">
        6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında.
      </p>

      <div className="mt-5 flex items-start gap-2.5 rounded-[var(--app-radius)] bg-[var(--app-warning)]/15 p-3.5 text-sm text-ink">
        <ShieldAlert
          size={18}
          className="mt-0.5 shrink-0"
          style={{ color: "var(--app-warning)" }}
        />
        <p>
          <strong>Taslak metin.</strong> Bu metin teknik bir şablondur;
          yayına alınmadan önce bir hukuk danışmanı tarafından gözden
          geçirilmeli ve şirket bilgileriyle tamamlanmalıdır.
        </p>
      </div>

      <Section title="1. Veri Sorumlusu">
        <p>
          Kişisel verileriniz, veri sorumlusu sıfatıyla [Şirket Ünvanı]
          (&quot;FinOptima&quot;) tarafından aşağıda açıklanan kapsamda işlenmektedir.
          İletişim: [adres] · [e-posta].
        </p>
      </Section>

      <Section title="2. İşlenen Kişisel Veriler">
        <p>
          Kimlik bilgileri (ad, soyad), iletişim bilgileri (e-posta), işlem
          güvenliği bilgileri (şifre özeti, oturum kayıtları, IP adresi),
          finansal bilgiler (gelir/gider işlemleri, borç ve hesap kayıtları,
          kategoriler) ve isteğe bağlı olarak girdiğiniz profil bilgileri
          (T.C./vergi kimlik numarası, adres, meslek). Hassas nitelikteki
          alanlar veritabanında şifreli olarak saklanır.
        </p>
      </Section>

      <Section title="3. İşleme Amaçları">
        <p>
          Hizmetin sunulması ve sürdürülmesi; harcama takibi, raporlama ve
          tahmini analizlerin üretilmesi; hesabınızın güvenliğinin sağlanması;
          yasal yükümlülüklerin yerine getirilmesi.
        </p>
      </Section>

      <Section title="4. Hukuki Sebep">
        <p>
          Verileriniz; sözleşmenin kurulması/ifası, hukuki yükümlülüğün yerine
          getirilmesi, meşru menfaat ve gerekli hâllerde açık rızanız hukuki
          sebeplerine dayanılarak işlenir.
        </p>
      </Section>

      <Section title="5. Aktarım">
        <p>
          Veriler, hizmetin çalışması için kullanılan altyapı sağlayıcılarına
          (barındırma ve veritabanı hizmetleri) işleme amacıyla sınırlı olarak
          aktarılır. Veriler yurt dışında (Avrupa Birliği) bulunan sunucularda
          işlenebilir. Üçüncü taraflara pazarlama amacıyla aktarım yapılmaz.
        </p>
      </Section>

      <Section title="6. Toplama Yöntemi">
        <p>
          Veriler; kayıt ve uygulama kullanımı sırasında elektronik ortamda,
          doğrudan sizin tarafınızdan girilerek toplanır.
        </p>
      </Section>

      <Section title="7. Saklama Süresi">
        <p>
          Verileriniz, hesabınız aktif olduğu sürece ve ilgili mevzuatın
          öngördüğü süreler boyunca saklanır. Hesabınızı sildiğinizde verileriniz
          kalıcı olarak silinir; güvenlik denetim kayıtları anonimleştirilerek
          tutulabilir.
        </p>
      </Section>

      <Section title="8. Veri Sahibi Olarak Haklarınız (KVKK m. 11)">
        <p>
          Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme,
          düzeltilmesini veya silinmesini isteme, işlemenin kısıtlanmasını talep
          etme ve verilerinizi taşınabilir bir biçimde alma haklarına sahipsiniz.
          Uygulama içinde <strong>Ayarlar &gt; Veri &amp; Gizlilik</strong>{" "}
          bölümünden verilerinizi indirebilir veya hesabınızı silebilirsiniz.
        </p>
      </Section>

      <Section title="9. Çerezler">
        <p>
          FinOptima yalnızca oturumunuzu açık tutmak için <strong>zorunlu
          çerezler</strong> kullanır. Reklam veya üçüncü taraf takip çerezi
          kullanılmaz.
        </p>
      </Section>

      <Section title="10. Başvuru">
        <p>
          Haklarınıza ilişkin taleplerinizi [başvuru e-postası / adres]
          üzerinden iletebilirsiniz. Talepler en kısa sürede ve en geç 30 gün
          içinde sonuçlandırılır.
        </p>
      </Section>

      <p className="mt-10 border-t border-line pt-4 text-xs text-muted">
        Son güncelleme: 19.05.2026
      </p>
    </main>
  );
}
