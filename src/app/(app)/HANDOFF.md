# Akça — Handoff (yeni prompt için tam devir)

> **Bu belge:** projenin canlı durumu, mimari, sürüm pinleri, tasarım dili,
> bilinen tuzaklar ve sıradaki işler. Yeni bir sohbet penceresinden devam
> ederken bu dosyayı oku, `CLAUDE.md` ve `AGENTS.md` ile birleştir.

Tarih kesidi: bu belge yazıldığında uygulama Vercel'de **canlı** ve son hâli
production'a deploy edilmiş durumda (`readyState: READY`, 12 route 200).

---

## 0. Proje özeti

**Akça** — Türkçe arayüzlü kişisel finans + ajanda PWA'sı. Üç ayaklı:

1. **Harcama takibi** — manuel giriş, banka dökümü içe aktarma (PDF/Excel/CSV),
   fiş fotoğrafı OCR (cihaz-içi, Tesseract.js, Türkçe).
2. **Takvim & ajanda** — gelir/gider/etkinlik takvimi, yaklaşan ödemeler,
   tekrarlı işlemler.
3. **AI yardımcı modüller** — kategorizasyon (kural tabanlı, gerçek AI'ya
   geçişe hazır), 6 aylık öngörü, tahmini Findeks skoru, borç stratejisi,
   AI ödeme otomasyonu (öneri + onaylı).

Uygulama uçtan uca **tek kullanıcılı multi-tenant**: her satır `userId`'ye
bağlı, sorgu katmanında zorunlu filtre. Davet kodlu kayıt (ilk kullanıcı
ADMIN, davet kodu olmadan girer; sonraki kayıtlar zorunlu davet kodu).

**Canlı URL:** Vercel projesi `akca-finans` (org/team Vercel'de bağlı).
Bölge: `fra1` (`vercel.json: { regions: ["fra1"] }`). Önemli — bu olmadan
fonksiyon `iad1`'e düşüyor, Neon DB Frankfurt'ta olduğu için 200 ms+ ek
gecikme oluşuyordu. Düzeltildi.

---

## 1. Komutlar

```bash
npm run dev                         # Turbopack dev, http://localhost:3000
npm run build                       # TS kontrolü burada (ESLint yok, test yok)
npm run start                       # üretim sunucusu

npx prisma migrate dev --name <ad>  # şema değişikliğinden sonra
npx prisma migrate deploy           # CI/Neon'a uygulamak için (`DATABASE_URL_UNPOOLED` ile)
npx prisma generate                 # client'ı yeniden üret
npx prisma studio                   # görsel DB inceleme

vercel deploy --prod -y --no-wait   # production deploy
vercel inspect <url>                # build durumunu kontrol et
vercel ls --format json             # son deployment'lar
```

**Yok:** ESLint, Jest/Vitest, e2e — bilinçli; doğrulama `npm run build`
üzerinden yapılıyor (tip kontrolü dahil).

---

## 2. Sürüm pinleri (KIRMIZI ÇİZGİLER)

`package.json`'da kayıtlı, **bilerek pinli** sürümler:

| Paket | Sürüm | Neden pinli |
|---|---|---|
| `next` | **16.2.6** | Async `cookies()`/`headers()`/`params`/`searchParams`; `middleware` yerine `proxy` (proje hiçbirini kullanmıyor — route koruması layout'tan); Turbopack varsayılan |
| `react` / `react-dom` | **19.2.4** | Server Actions; **`<form action={serverAction}>` action sonrası uncontrolled input'ları sıfırlar** — 2FA bug'ı bundan çıktı, formlarda `useState` zorunlu |
| `prisma` / `@prisma/client` | **6.19.3** | **Prisma 7'ye GEÇMEYİN** — 7, `datasource.url`'yi kaldırıp `prisma.config.ts` + driver adapter zorunlu kılıyor |
| `next-auth` | **5.0.0-beta.31** | Auth.js v5 beta — yapılandırma `src/auth.ts` |
| `@node-rs/argon2` | **2.0.2** | `verify` export'u kullanılıyor; **otplib'in `verify`'siyle isim çakışır** → `import { verify as verifyTotp }` kullan |
| `otplib` | **13.4.0** | API v12'den değişti: **`authenticator.x` YOK**, fonksiyonel `import { generateSecret, generateURI, verify } from "otplib"` kullanılır |
| `tailwindcss` / `@tailwindcss/postcss` | **^4** | Yeni `@theme inline` tokenları; `globals.css` içinden bağlanıyor |
| `tesseract.js` | **^7** | `createWorker("tur")` v6'dan farklı; dinamik import zorunlu (server bundle'a girmesin) |
| `zod` | **^4** | `$ZodIssue` tipinde `path: readonly PropertyKey[]` — typing'i bozmamak için yardımcılar `readonly` aldı |
| `lucide-react` | **^1.16.0** | İkonlar |

**AGENTS.md hatırlatması:** Next.js 16 önceki sürümlerden çok farklı.
Yeni kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili
kılavuzu oku. Deprecation uyarılarını dikkate al.

---

## 3. Çevre değişkenleri

`.env` (lokal) ve Vercel project envs içinde aşağıdakiler tanımlı:

```bash
DATABASE_URL=…                   # Neon pooled (yerelde aynı = direkt Postgres)
DATABASE_URL_UNPOOLED=…          # Neon unpooled — Prisma `directUrl` için
AUTH_SECRET=…                    # openssl rand -base64 32
AUTH_TRUST_HOST=true             # Vercel'de zorunlu
ENCRYPTION_KEY=…                 # 32 byte (base64), AES-256-GCM için
NEXT_PUBLIC_SENTRY_DSN=…         # Sentry projesi
RESEND_API_KEY=…                 # E-posta — şu an kullanılmıyor (domain bekliyor)
```

Opsiyonel (Faz 1'den, kuruluysa rate limit Redis'e iner; yoksa in-memory):

```bash
UPSTASH_REDIS_REST_URL=…
UPSTASH_REDIS_REST_TOKEN=…
```

`.gitignore` `.env`'i ignore'luyor. `.env.example` minimum şablon.

---

## 4. Veritabanı şeması (Prisma)

Migration zinciri (uygulanma sırasına göre, hepsi Neon'a deploy edilmiş):

1. `init` — temel: User, Session*, Account*, ThemeSettings, Category,
   CategoryRule, AccountFinancial, Transaction, Event, InvitationCode
2. `add_transaction_kind` — `Transaction.kind` INCOME/EXPENSE
3. `transfer_kind_and_findeks` — TRANSFER kind + `FindeksReport`
4. `add_debts_strategy_profile` — Debt, DebtPayment, PaymentAutomation,
   FinanceProfile
5. `security_indexes_directurl` — index'ler + `datasource.directUrl`
6. `audit_log` — `AuditLog` (userId nullable, `onDelete: SetNull` —
   silinen kullanıcının kayıtları anonim olarak kalır)
7. `two_factor` — `User.twoFactorSecret` (şifreli) + `twoFactorEnabled`
8. `kvkk_data_rights` — `User.sessionsValidFrom` (her cihazdan çıkış için
   kesim noktası), `User.consentedAt` (aydınlatma metni rıza zamanı)

**Önemli:** Çoğu ilişki `onDelete: Cascade` — `User` silinince teması,
kategorileri, işlemleri, etkinlikleri vs. hepsi siliniyor. `AuditLog` ise
`SetNull` — güvenlik kaydı kullanıcısı silinmiş olarak kalıyor.

**Para:** Tüm tutarlar `Decimal(14,2)`. **Yön işaretten gelmiyor**,
`Transaction.kind` (INCOME/EXPENSE/TRANSFER) belirliyor. Sorgu katmanında
`Number(decimal)` ile düz sayıya çeviriliyor (`PlainTransaction` tipi).

---

## 5. Mimari

### 5.1. Kimlik doğrulama (`src/auth.ts`)

- Auth.js v5 (`next-auth@beta`), **Credentials** provider, **JWT session**
  (DB session tablosu yok).
- argon2id şifre hash (`@node-rs/argon2`).
- **2FA (TOTP):** otplib functional API. Secret `enc:v1:` prefix'i ile
  AES-256-GCM şifreli saklanır. Login akışı 2 adım:
  1. e-posta + şifre → "kod gerekiyor mu?" cevabı
  2. (varsa) 6 haneli kod
- **Periyodik re-validation:** `jwt` callback'i her 5 dakikada bir DB'den
  `sessionsValidFrom` + `role` okur. `token.iat*1000 < sessionsValidFrom`
  ise null döner → tüm cihazlarda 5 dk içinde çıkış (KVKK gereği).
- **Route koruması middleware/proxy ile DEĞİL** — layout server
  component'lerinde: `src/lib/auth-helpers.ts` → `requireUser()` /
  `requireUserId()`.

### 5.2. Route grupları (`src/app/`)

```
src/app/
├── layout.tsx                # Root layout, fontlar, manifest link
├── page.tsx                  # Landing — auth varsa /dashboard'a redirect
├── globals.css               # Token'lar, @theme inline, glass, blob'lar
├── manifest.ts               # PWA manifest
├── gizlilik/page.tsx         # PUBLIC — KVKK aydınlatma metni
├── (auth)/                   # /login, /register — markalı split layout
│   ├── layout.tsx            # Brand <Link href="/"> (giriş → landing köprü)
│   ├── login/page.tsx
│   └── register/page.tsx
├── (app)/                    # Auth zorunlu, AppShell + tema enjekte
│   ├── layout.tsx            # requireUser + onboarding redirect + theme <style>
│   ├── loading.tsx
│   ├── dashboard/, transactions/, calendar/, findeks/, borclar/,
│   ├── strateji/, profil/, settings/, reports/, import/, add/, receipts/
├── onboarding/               # Grupsuz — ilk giriş sihirbazı
└── api/
    ├── auth/[...nextauth]/   # Auth.js route handler
    └── export/route.ts       # KVKK veri taşınabilirliği (GET, auth'lı)
```

### 5.3. Tema sistemi (uygulamanın çekirdeği)

- Her kullanıcının bir `ThemeSettings` kaydı var: renkler, fontlar, köşe,
  gölge vb.
- **Tek doğru kaynak:** `src/lib/theme.ts` → `ThemeSettings` tipi,
  `DEFAULT_THEME`, `THEME_PRESETS`, `themeStyleContent()` (server — FOUC'suz
  `<style>` üretir), `computeVars()` (canlı önizleme).
- `(app)/layout.tsx` `themeStyleContent()` ile `:root`'u ezen bir `<style>`
  basıyor. `globals.css` varsayılan değerleri içeriyor (giriş + landing).
- Canlı önizleme: `src/lib/apply-theme.ts` → CSS değişkenlerini bir DOM
  elemanına uygular (`ThemePreview` kapsayıcısı veya `document.documentElement`).
- Tailwind tokenları: `bg-surface`, `text-ink`, `bg-primary`, `text-accent`,
  `bg-destructive`, vb. — `globals.css` içindeki `@theme inline` ile
  `--app-*` değişkenlerine bağlı. **Yeni renk her zaman token üzerinden
  kullanılır, ham hex yazma.**

### 5.4. Veri katmanı

- `src/lib/db.ts` — Prisma client singleton (dev hot reload safe).
- `src/lib/queries.ts` — tüm okuma sorguları, **`userId` ile satır-bazlı
  izolasyon zorunlu**. `Decimal` alanlar `Number()` ile düz sayıya çevriliyor.
- `src/lib/actions/*.ts` — `"use server"` server action'ları, Zod ile
  doğrulama (`src/lib/validation.ts`), ardından `revalidatePath`.

### 5.5. İş mantığı modülleri (`src/lib/`)

- `categorize.ts` — kural tabanlı kategorizasyon. **Gerçek AI'ya geçişte
  yalnızca bu modül değişir.**
- `forecast.ts` — 6 aylık öngörü (hareketli ortalama + trend + belirsizlik bandı).
- `findeks.ts` + `findeksReport.ts` — **TAHMİNİ** kredi sağlığı skoru.
  Findeks'in resmî API'si yok; arayüzde "tahmini" etiketi zorunlu.
- `bankProfiles.ts` + `pdfStatements.ts` — banka dökümü ayrıştırma.
  Başlık anahtar kelimelerinden kolon algılar (Enpara/Garanti/Yapı Kredi/
  Ziraat/Nays bankadan bağımsız çalışır).
- `debt.ts` — `analyzeDebts(debts, cashflow, allocDebt)` borç başına
  faiz/ay, 6 ay faiz yükü, skor etkisi, ödeme stratejisi.
- `recommendations.ts` — strateji önerileri (`P1/P2/P3` öncelik).
- `automation.ts` + `actions/strategy.ts` — AI ödeme otomasyonu (öneri +
  onaylı).
- `crypto.ts` — AES-256-GCM `encryptField`/`decryptField`, `enc:v1:` prefix.
- `audit.ts` — `logAudit({userId, action, entityType, entityId, metadata})`
  non-blocking.
- `rate-limit.ts` — Upstash slidingWindow + in-memory fallback.

### 5.6. Para ve tarih

- Tutar `Decimal(14,2)`, yön `Transaction.kind`'dan.
- `src/lib/format.ts` — `tr-TR` biçimlendirme. Form tarihleri
  `dateFromInput()` ile **yerel saat** olarak ayrıştırılır (`new Date("yyyy-mm-dd")`
  UTC, KULLANMA).
- Karışık biçimli tutarlar (`1.234,56` vs `1,234.56`) `parseAmount()` ile çözülür.

### 5.7. Dosya yükleme

- Fiş fotoğrafları **lokal dev'de** `public/uploads/receipts/`'e yazılır
  (`.gitignore`'da). **Üretimde (Vercel) kalıcı DEĞİL** — Vercel Blob'a
  geçilmesi gerekiyor (yapılmadı, TODO).

---

## 6. Güvenlik & KVKK (uygulanan)

### Faz 0+1+2 (güvenlik + ölçek + OCR)
- Security headers (CSP, HSTS, X-Frame-Options, vs.) — `next.config.ts`
- IDOR koruması — tüm sorgularda `userId` filtresi zorunlu
- Rate limit — `@upstash/ratelimit` slidingWindow + in-memory fallback
- Pagination — `getTransactions` cursor tabanlı, `loadMoreTransactions`
- On-device OCR — Tesseract.js v7, Türkçe, dinamik import

### Faz 3 (gözlem + KVKK)
- **Sentry** — `instrumentation.ts` + `instrumentation-client.ts`, DSN env'de
- **Audit log** — `AuditLog` tablosu, hassas eylemlerde `logAudit(...)`
- **Hassas alan şifreleme** — `crypto.ts`, `taxOrIdNumber`, `fullAddress`,
  `aiIdentityText`, `twoFactorSecret` AES-256-GCM `enc:v1:` ile
- **2FA (TOTP)** — `otplib` functional, QR kod (`qrcode`), `settings/2fa`
- **Hesap silme** (unutulma hakkı) — `actions/account.ts::deleteMyAccount`,
  parola yeniden doğrulama, audit log ANCAK silmeden önce, `Cascade` ile
  tüm veri gider, `signOut`
- **Veri dışa aktarma** (taşınabilirlik) — `/api/export` JSON, şifreli
  alanlar çözülerek
- **Oturum yönetimi** — `logoutEverywhere()` `sessionsValidFrom`'u bumps
  eder, ~5 dk içinde tüm JWT'ler ölür
- **Aydınlatma metni** — `/gizlilik` public; çerez banner'ından link
- **Rıza kaydı** — register form zorunlu onay kutusu, `consentedAt` damgası
- **Çerez banner'ı** — `src/components/consent/cookie-banner.tsx`

**Yapılmayanlar (sonraki tur):** Domain + e-posta doğrulama (Resend hazır
ama domain bekliyor), gerçek AI (categorize.ts hazır), 5M ölçek mimarisi
(queue/replica/partition), VERBİS/ISO 27001 uyum süreci (hukuk/denetim),
gerçek kullanıcı testi.

---

## 7. Tasarım dili — Neo banking v2

`/tmp/new-design/` altındaki mockup dosyalarına (`app-screens.jsx`,
`app-detail.jsx`) **birebir** uygulandı. Tüm 12 sayfa + landing bu dile uygun.

### 7.1. Palet

```
--app-primary:     #2046ff   /* kobalt */
--app-violet:      #7c5cff   /* mor (gradient ikinci ucu) */
--app-accent:      #0e8a47   /* money green */
--app-destructive: #ff6a4d   /* coral */
--app-signal:      #e6ff42   /* signal yellow (vurgu, BUGÜN rozeti) */
--app-bg:          #fafaf7
--app-ink:         #0b0c10
--app-surface:     #ffffff
--app-surface-2:   #f3f2ee
--app-line:        #e9e8e2
--app-muted:       #6b6a64
```

Marka kullanımı: kobalt → mor lineer gradient (135°). `BrandMark` (`src/components/brand.tsx`)
gradient kare + beyaz "a", sarı nokta YOK.

### 7.2. Fontlar

- **Heading** — Space Grotesk (`font-heading`)
- **Body** — DM Sans (default)
- **Mono** — JetBrains Mono (Mono kicker'lar, sayılar, kaynak pill'ler)

Next font ile yükleniyor (`src/lib/fonts.ts` veya layout'larda doğrudan).

### 7.3. Yapı

- **Köşe:** 18px (`--app-radius`)
- **Glass kart:** `.card` → `bg-surface/75 backdrop-blur-2xl border border-line`
- **Atmosfer:** Body'de iki radial blob (`globals.css` keyframe'leri
  `nvFloat`, `nvSubtle`)
- **Sidebar:** Glass, gradient FAB ("Yeni işlem"); logo `<Link href="/dashboard">`
- **Login/register:** Brand `<Link href="/">` (landing'e köprü)
- **PageHeader:** `kicker` (mono, küçük, uppercase) + heading + description
- **Mono numaralı kicker'lar:** "01 · …", "02 · …" gibi
- **StatCard:** `kicker/value/hue/sub?/delta?` — `hue` arka blob + sol bar
  rengi (primary/accent/destructive/violet)

### 7.4. Sayfa-sayfa neler yapıldı

- **Landing** — iPhone hero mockup, yüzen bildirim kartları, gradient hero,
  nasıl çalışır (3 adım), koyu privacy section, features grid, findeks +
  forecast SVG kartları, pricing, gradient CTA strip, footer. **`.card`
  kullanmıyor**, açık renk explicit (sistem dark mode'da bozuluyordu).
- **Dashboard** — `app-screens.jsx::AppDashboard` birebir. Kicker, 4 hue
  StatCard, 7/5 grid (`01 Nakit akışı / 02 Yaklaşan / 03 Kategoriler /
  04 Son işlemler`), period pill'ler, date-chip upcoming rows.
- **İşlemler** — glass filter-bar (FILTER chip'leri), 4 StatCard
  (gelir/gider/net/ortalama gider), gün-gün gruplanmış glass kartlar
  (`font-heading` gün etiketi + mono "{N} işlem" + gün toplamı), satırlarda
  kaynak pill'i (BANKA/OCR/MANUEL).
- **Takvim** — 7/3 split, BUGÜN signal-yellow ink-bg rozet, sağda 3 glass
  detay kartı.
- **Findeks** — koyu skor hero (kobalt + sarı radial blob), 220px gauge
  (signal→violet gradient stroke), 2 öneri kartı, 5 faktör tablosu.
  **Sparkline yok** (gerçek geçmiş veri yok).
- **Borçlar** — 4 StatCard (Toplam / Aylık bütçe / Faiz yükü violet /
  Skor etkisi destructive), glass borç listesi TÜMÜ/KART/KREDİ pill filter,
  progress bar, KALAN/AYLIK FAİZ/ÖDEME GÜNÜ kolonları.
- **Strateji** — dinamik kicker, basit `CashStat` sol border, 3 preset
  kartı (seçili olan kendi rengiyle dolu + glow), allocation visualizer
  slider'lar, AI automation card + 12 ay projeksiyon.
- **Profil/Settings/Reports/Import/Add/Fişler** — v2 kicker header + glass kartlar.

---

## 8. Bilinen tuzaklar

1. **React 19 form reset** — `<form action={serverAction}>` action sonrası
   uncontrolled input'ları SIFIRLAR. 2FA login böyle bozulmuştu. Çözüm:
   ilgili input'ları `useState` ile controlled yap, çok adımlı formlarda
   önceki step'in değerlerini hidden input'larla taşı.
2. **otplib vs argon2 `verify` çakışması** — ikisi de `verify` export'u
   var. `auth.ts` içinde: `import { verify } from "@node-rs/argon2"` ve
   `import { verify as verifyTotp } from "otplib"`.
3. **`new Date("yyyy-mm-dd")` UTC'dir** — tarih input'unu okurken
   `dateFromInput()` kullan, yerel saat ister.
4. **Zod 4 path tipi** — `path: readonly PropertyKey[]`. Yardımcı
   imzalarda `readonly` koru, yoksa TS patlar.
5. **Vercel bölge** — `vercel.json: { regions: ["fra1"] }` olmazsa
   fonksiyon `iad1`'e düşer, Neon (fra) ile arası 200 ms+ gecikme.
   `x-vercel-id` header'ı `fra1::fra1::...` olmalı.
6. **`.card` landing'de tema-aware** — landing system dark mode'da
   bozuluyordu. Landing'de explicit beyaz arka plan + line border.
7. **Prisma 7'ye yükseltme YAPMA** — `datasource.url` kaldırıldı, driver
   adapter zorunlu, proje Prisma 6'ya pinli.
8. **Linter modifikasyonları korunmalı** — son turda agent'lar
   `borclar/page.tsx`, `transactions/page.tsx`, `transaction-list.tsx`,
   `calendar/page.tsx`, `strateji/page.tsx`, `findeks/page.tsx`'i
   güncelledi. Bunlar **kasıtlı**, geri sarma.
9. **Receipt upload Vercel'de kalıcı değil** — `public/uploads/receipts/`
   yerel; production'a geçince Vercel Blob'a taşınmalı (TODO).
10. **Resend hazır ama domain bekliyor** — sadece kendi e-postan doğrulama
    yapabiliyor; e-posta doğrulama özelliği bu yüzden ertelendi.

---

## 9. Sıradaki muhtemel işler (önceliksiz)

1. **Domain bağlama + e-posta doğrulama** — Resend için verified domain.
2. **Receipt storage'ı Vercel Blob'a taşı** — production'da fiş yüklenince
   şu an dosya kayboluyor.
3. **Gerçek AI kategorizasyon** — `src/lib/categorize.ts` arayüzü hazır;
   AI SDK + Vercel AI Gateway üzerinden `provider/model` string ile
   geçilebilir. Maliyet hesabı SISTEM-RAPORU.md içinde.
4. **Findeks geçmişi** — `FindeksReport` tablosu mevcut; cron ile günlük
   snapshot al, 12-ay sparkline'ı gerçek veriyle doldur.
5. **5M ölçek** — queue (Vercel Queues beta), read replica, partition.
6. **PWA push** — manifest var, Push API + Service Worker eklenmedi.
7. **VERBİS + ISO 27001** — hukuk/denetim süreci (kod dışı).
8. **Gerçek kullanıcı testi.**

---

## 10. Hızlı doğrulama checklist

Yeni promptta başlarken:

```bash
npm run build                         # TS temiz mi?
npx prisma migrate status             # migration drift var mı?
curl -I https://<canlı-url>/dashboard # 200/307 dönüyor mu?
vercel ls --format json | head        # son deploy READY mi?
```

Lokal dev:
- Postgres çalışıyor mu? (`brew services list` veya `pg_isready`)
- `.env` dolu mu? (`DATABASE_URL`, `AUTH_SECRET`, `ENCRYPTION_KEY`)
- `npm run dev` → http://localhost:3000

---

## 11. Sahibi & bağlam

- Kullanıcı: dogukan (`dogukanuguryalcinkaya@gmail.com`)
- Dil: **Türkçe** — tüm UI, hata mesajları, kicker'lar, copy.
- Önceki ekip: "Veysel" adlı bir geliştiriciden devralındı; kullanıcı
  Türkiye'de bir firmaya taşımak istedi → Neon Postgres + Vercel'e geçildi.
- Kullanıcı geri bildirimi **doğrudan ve sık küfürlü** — niyet net,
  hassasiyet alma; "devam"/"hepsini tekte" geldiğinde paralel agent ile
  toptan ilerle, tek tek onay isteme.

---

## 12. Önemli dosyalar — hızlı referans

```
src/auth.ts                                     # Auth.js v5 yapı, 2FA, JWT re-validation
src/lib/auth-helpers.ts                         # requireUser/requireUserId
src/lib/theme.ts                                # tek doğru kaynak — tema
src/lib/queries.ts                              # tüm sorgular (userId zorunlu)
src/lib/actions/account.ts                      # deleteMyAccount + logoutEverywhere
src/app/api/export/route.ts                     # KVKK veri dışa aktarma
src/app/(app)/layout.tsx                        # tema enjekte + onboarding redirect
src/components/auth/login-form.tsx              # 2FA controlled inputs (KRİTİK)
src/components/brand.tsx                        # gradient logo
src/components/landing/landing-page.tsx         # Neo banking v2 landing
src/components/app/app-shell.tsx                # glass sidebar + FAB
src/components/ui/{stat-card,page-header}.tsx   # ortak primitivler
src/components/ui/icon.tsx                      # CategoryIcon (lucide)
src/lib/categorize.ts                           # gerçek AI'ya geçiş noktası
src/lib/crypto.ts                               # AES-256-GCM enc/dec
src/lib/audit.ts                                # logAudit
src/lib/rate-limit.ts                           # Upstash + fallback
prisma/schema.prisma                            # şema (Prisma 6 pinli)
next.config.ts                                  # security headers, Sentry
vercel.json                                     # { regions: ["fra1"] }
CLAUDE.md                                       # proje talimatı (oku)
AGENTS.md                                       # "Bu bildiğin Next.js değil"
SISTEM-RAPORU.md/.pdf                           # detaylı sistem raporu
```

---

**Son not:** Tasarım handoff dosyaları (`/tmp/new-design/app-screens.jsx`,
`/tmp/new-design/app-detail.jsx`) tmp'de — sistem reboot olunca kaybolur.
Tekrar gerekirse kullanıcıdan iste.
