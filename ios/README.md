# FinOptima — iOS (SwiftUI)

Native SwiftUI istemci. FinOptima finansal sağlık uygulamasının iOS uygulaması.
Canlı backend'e (`https://financeoptima.vercel.app`) `/api/mobile/*` uçları üzerinden
Bearer JWT ile bağlanır.

> **Not:** Bu makinede Xcode kurulu olmadığından proje **derlenmedi / çalıştırılmadı**.
> Kod derlenmeye hazır, idiomatik SwiftUI olarak yazıldı; ilk derleme aşağıdaki
> adımlarla Xcode kurulu bir makinede yapılmalıdır.

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
| Base URL | `https://financeoptima.vercel.app` (bkz. `FinOptima/Config/AppConfig.swift`) |
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
