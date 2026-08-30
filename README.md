# FinOptima

AI destekli kişisel finans ve kredi notu (Findeks) koçu. Kullanıcı banka ekstresini yükler, işlemleri otomatik kategorilenir, borçları ve yaklaşan ödemeleri tek yerden görür; sistem kredi notunu etkileyen faktörleri hesaplar ve aylık, önceliklendirilmiş bir eylem planı üretir.

Canlı: [finoptima.dev](https://www.finoptima.dev) (davet kodlu kapalı beta)

## Mimari ilke: rakamı motor üretir, LLM yorumlar

Finansal ürünlerde en büyük risk, modelin para hakkında sayı uydurmasıdır. Bu yüzden sistem iki katmana ayrıldı ve sınır kod düzeyinde korunuyor:

```
Kullanıcı verisi (ekstre / Findeks raporu / manuel giriş)
        ↓
[Deterministik motor]  src/lib/findeks.ts · src/lib/debt.ts
  faiz, taksit, borç-gelir oranı, skor faktörleri     → rakamı ÜRETİR
        ↓
[Claude — yalnızca yorum katmanı]  src/lib/ai/
  açıklama, önceliklendirme, koçluk tonu             → rakam ÜRETMEZ
        ↓
Arayüz
```

Aynı soru tekrar sorulduğunda rakamlar birebir aynı çıkar, çünkü onları üreten taraf model değil. Kredi koçunun sistem promptunda bu kural açıkça yazılıdır ve modele kimlik verisi (ad, TC, adres) hiçbir zaman gönderilmez.

Kalite ölçümü tahmine bırakılmadı: `scripts/eval/` altında 17 senaryoluk (kart kullanım oranı, asgari ödeme tuzağı, icra, kefil, işsizlik, dolandırıcılık tespiti, dürüstlük testleri) rubrikli bir değerlendirme motoru var; cevaplar ayrı bir jüri modeliyle 0-100 puanlanır.

```bash
npx tsx --env-file=.env scripts/eval/fin-intel-eval.mts        # tek prompt
npx tsx --env-file=.env scripts/eval/fin-intel-eval.mts --ab   # V1 vs V2 karşılaştırması
```

## Yığın

Next.js 16 (App Router) · React 19 · TypeScript · Prisma + PostgreSQL (Neon) · NextAuth v5 · Anthropic Claude · Tailwind v4 · Sentry · Upstash (rate limit) · Resend (e-posta). Ayrıca `ios/` altında SwiftUI ile yazılmış native iOS istemcisi (XcodeGen tabanlı).

## Güvenlik ve KVKK

Kurumsal bir müşterinin tedarikçi değerlendirmesinden geçebilecek şekilde inşa edildi:

- **Alan düzeyinde şifreleme** — TC kimlik, adres gibi hassas alanlar AES-256-GCM ile at-rest şifreli (`src/lib/crypto.ts`)
- **Append-only denetim günlüğü** — IP ve user-agent ile birlikte, uygulamayı asla bloklamayan yazım (`src/lib/audit.ts`)
- **2FA (TOTP)**, cihaz tanıma ve yeni cihaz güvenlik e-postası, tüm cihazlardan çıkış
- **KVKK** — kayıtta zorunlu açık rıza, tüm verinin JSON olarak dışa aktarımı, hesap ve veri silme
- **Kademeli destek erişim rızası** — yönetici müşteri verisine ancak kullanıcının kapsam ve süre (24/48/72 saat) seçerek verdiği, istediği an iptal edebildiği rıza ile bakabilir
- Argon2 parola hash'i, Upstash tabanlı rate limit, satır düzeyinde çok kiracılı izolasyon

## Geliştirme

```bash
npm install
cp .env.example .env     # değerleri doldur
npx prisma migrate dev
npm run dev
```

Env değişkenlerinin tamamı ve ne işe yaradıkları `.env.example` içinde açıklandı. `AI_DEMO=true` ile Anthropic API anahtarı olmadan, sıfır maliyetle çalıştırılabilir — kredi koçu ve ekstre çıkarımı bu modda gerçek deterministik motor çıktısıyla beslenen örnek sonuçlar döner.

İlk kayıt olan kullanıcı yönetici olur; sonraki kayıtlar davet kodu ister (Ayarlar → Davetler).

## Dağıtım

Vercel (bölge `fra1`, veritabanına yakınlık için). `npm run build` üretimde migration'ları da uygular (`prisma migrate deploy && next build`). Günlük cron `/api/cron/support-daily` üzerinden çalışır.
