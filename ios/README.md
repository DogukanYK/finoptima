# FinOptima — iOS (SwiftUI)

Native SwiftUI istemci. FinOptima finansal sağlık uygulamasının iOS uygulaması.
Canlı backend'e (`https://www.finoptima.dev`) `/api/mobile/*` uçları üzerinden
Bearer JWT ile bağlanır.

> **Derleme durumu (2026-08-22):** Xcode 27.0 (beta, `27A5218g`) ile **simülatör
> hedefine sorunsuz derleniyor** — 0 hata, 0 uyarı. Doğrulanan komut:
>
> ```bash
> xcodegen generate
> xcodebuild -project FinOptima.xcodeproj -scheme FinOptima \
>   -sdk iphonesimulator -configuration Debug \
>   -destination 'generic/platform=iOS Simulator' \
>   -derivedDataPath build/dd-sim \
>   CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO build
> ```
>
> **Henüz simülatörde çalıştırılmadı:** bu makinede hiçbir iOS Simulator runtime'ı
> kurulu değil (`xcrun simctl list runtimes` boş), dolayısıyla açılabilecek bir
> cihaz yok. Çalıştırmak için `xcodebuild -downloadPlatform iOS` ile runtime
> indirilmeli (~9 GB; indirmeden önce disk alanını kontrol et).

## Gereksinimler

- macOS + **Xcode 15** veya üstü
- iOS **17.0+** hedef (deployment target 17.0; README notu: iOS 26'ya yükseltilebilir)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen) — `.xcodeproj` dosyası
  `project.yml`'den üretilir (repoya `.xcodeproj` commit edilmez)

## Kurulum

```bash
# 1) XcodeGen'i kur
brew install xcodegen

# 2) Proje dosyasını üret (ios/ klasöründen çalıştır)
cd ios
xcodegen generate

# 3) Xcode'da aç
open FinOptima.xcodeproj
```

Ardından Xcode'da bir simülatör (ya da imzalı bir cihaz) seçip **Run** (⌘R) ile
çalıştır. `project.yml` `CODE_SIGN_STYLE: Automatic` kullanır; gerçek cihaza
kurulumda kendi Apple geliştirici takımını (Signing & Capabilities) seçmen yeterli.

## Yapılandırma

| Ayar | Değer |
| --- | --- |
| Base URL | `https://www.finoptima.dev/api/mobile` (bkz. `FinOptima/Config/AppConfig.swift`) |
| API kökü | tüm uçlar `/api/mobile/*` altında |
| Bundle ID | `com.minerva108.finoptima` |
| Deployment target | iOS 17.0 |
| Kimlik doğrulama | Bearer JWT (access + refresh) — Keychain'de saklanır |
| Biyometri | Face ID / cihaz parolası (`NSFaceIDUsageDescription` ayarlı) |

Backend URL'sini değiştirmek için `FinOptima/Config/AppConfig.swift` içindeki
`baseURL` değerini güncelle.

## Proje yapısı

```
ios/
├─ project.yml            # XcodeGen tanımı (bu klasörden `xcodegen generate`)
├─ README.md
└─ FinOptima/
   ├─ App/                # FinOptimaApp, AppState, RootView
   ├─ Config/             # AppConfig (baseURL)
   ├─ Models/             # Codable modeller (Models.swift)
   ├─ Networking/         # APIClient (Bearer + 401 refresh)
   ├─ Auth/               # KeychainStore, BiometricGate, AuthViewModel
   ├─ UI/                 # Theme, Components
   └─ Features/           # Panel · Findeks · İşlemler · Borçlar
```

## Notlar

- Tüm kullanıcı-görünür metinler **Türkçe**.
- Tasarım: temiz solid fintech paleti (web ile aynı); standart SwiftUI
  materyalleri (TabView, sheet, List). Özel "liquid glass" efekti yok.
- Swift concurrency: `async/await` + `URLSession`. Force-unwrap (`!`) kullanılmaz.
- `ITSAppUsesNonExemptEncryption = false` → App Store yüklemesinde ihracat
  şifreleme uyumluluğu adımı atlanır.

## Sonraki adım — TestFlight / App Store

1. Xcode'da **Product → Archive** ile arşiv oluştur.
2. Organizer'dan **Distribute App → App Store Connect** ile yükle.
3. [App Store Connect](https://appstoreconnect.apple.com) üzerinde uygulamayı
   (`com.minerva108.finoptima`) oluştur; build'i bir **TestFlight** grubuna ekleyip
   dahili/harici test daveti gönder.
4. Test tamamlanınca App Store için inceleme (review) gönderimini başlat.
