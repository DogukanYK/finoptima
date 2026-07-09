import Foundation
import Observation

/// Giriş ekranının durum ve iş mantığını yöneten görünüm modeli.
///
/// Akış:
/// 1. Kullanıcı e-posta + şifre girer ve `login()` çağrılır.
/// 2. Sunucu `totp_required` döndürürse `requiresTOTP` `true` olur → görünümde
///    TOTP alanı belirir; kullanıcı 6 haneli kodu girip yeniden dener.
/// 3. Başarılı yanıtta erişim/yenileme jetonları Keychain'e yazılır ve `true`
///    döner (görünüm `AppState.didLogin()` çağırır).
///
/// Hata mesajları Türkçe'dir: hatalı kimlik bilgisi, geçersiz TOTP, hız sınırı
/// (`Retry-After`) ve ağ hataları ayrı ayrı ele alınır. Hiç force-unwrap yok.
@MainActor
@Observable
final class AuthViewModel {

    // MARK: - Kullanıcı girişi (bağlanabilir)

    /// E-posta adresi.
    var email: String = ""
    /// Şifre.
    var password: String = ""
    /// İki adımlı doğrulama kodu (yalnızca `requiresTOTP` iken kullanılır).
    var totp: String = ""

    // MARK: - Türetilmiş durum (yalnızca okunur)

    /// Sunucu `totp_required` döndürdüğünde `true` → TOTP alanı gösterilir.
    private(set) var requiresTOTP = false
    /// Ağ isteği sürerken `true` (buton devre dışı + spinner).
    private(set) var isLoading = false
    /// Kullanıcıya gösterilecek kırmızı hata metni (yoksa `nil`).
    private(set) var errorMessage: String?
    /// TOTP alanı ilk açıldığında gösterilen nötr bilgilendirme metni.
    private(set) var noticeMessage: String?

    private let api: APIClient
    private let keychain: KeychainStore

    init(api: APIClient = .shared, keychain: KeychainStore = .shared) {
        self.api = api
        self.keychain = keychain
    }

    // MARK: - Doğrulama

    /// Giriş butonunun etkin olup olmadığını belirler.
    var canSubmit: Bool {
        guard !isLoading else { return false }
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return false }
        guard !password.isEmpty else { return false }
        if requiresTOTP {
            return totp.trimmingCharacters(in: .whitespacesAndNewlines).count >= 6
        }
        return true
    }

    /// TOTP alanının şu an görünmesi gerekiyor mu (görünüm kolaylığı).
    var showsTOTPField: Bool { requiresTOTP }

    // MARK: - Eylemler

    /// Girişi dener. Başarılıysa jetonları saklar ve `true` döner; aksi halde
    /// uygun Türkçe hata/uyarı mesajını yayınlar ve `false` döner.
    @discardableResult
    func login() async -> Bool {
        guard !isLoading else { return false }

        errorMessage = nil
        noticeMessage = nil
        isLoading = true
        defer { isLoading = false }

        let trimmedEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let code = resolvedTOTP()

        do {
            let response = try await api.login(email: trimmedEmail, password: password, totp: code)
            keychain.saveTokens(access: response.accessToken, refresh: response.refreshToken)
            return true
        } catch let error as APIError {
            handle(error)
            return false
        } catch {
            errorMessage = "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
            return false
        }
    }

    /// Kullanıcı e-postayı değiştirince 2FA akışını sıfırlar (yeni hesaba geçiş).
    func resetTOTP() {
        requiresTOTP = false
        totp = ""
        noticeMessage = nil
    }

    // MARK: - Yardımcılar

    /// Gönderilecek TOTP değerini üretir: 2FA istenmediyse ya da alan boşsa `nil`.
    private func resolvedTOTP() -> String? {
        guard requiresTOTP else { return nil }
        let trimmed = totp.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    /// API hatasını kullanıcıya gösterilecek duruma çevirir.
    private func handle(_ error: APIError) {
        // İlk kez 2FA isteniyor → alanı aç, bilgilendir, hata gösterme.
        if error.isTOTPRequired {
            requiresTOTP = true
            totp = ""
            noticeMessage = "Hesabınız iki adımlı doğrulama ile korunuyor. Doğrulama uygulamanızdaki 6 haneli kodu girin."
            return
        }

        // Yanlış/eskimiş kod → alanı açık tut, kodu temizle, hata göster.
        if error.isTOTPInvalid {
            requiresTOTP = true
            totp = ""
            errorMessage = "Doğrulama kodu geçersiz. Lütfen tekrar deneyin."
            return
        }

        if error.isRateLimited {
            errorMessage = rateLimitMessage(retryAfter: error.retryAfter)
            return
        }

        if error.isInvalidCredentials {
            errorMessage = "E-posta veya şifre hatalı."
            return
        }

        // Ağ / çözümleme / diğer sunucu hataları — hata tipi zaten Türkçe metin üretir.
        errorMessage = error.errorDescription ?? "Giriş yapılamadı. Lütfen tekrar deneyin."
    }

    /// `429 rate_limited` için `Retry-After` başlığına göre insan-okur Türkçe metin.
    private func rateLimitMessage(retryAfter: TimeInterval?) -> String {
        guard let retryAfter, retryAfter > 0 else {
            return "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin."
        }
        let seconds = Int(retryAfter.rounded(.up))
        if seconds >= 60 {
            let minutes = Int((Double(seconds) / 60).rounded(.up))
            return "Çok fazla deneme yapıldı. Lütfen \(minutes) dakika sonra tekrar deneyin."
        }
        return "Çok fazla deneme yapıldı. Lütfen \(seconds) saniye sonra tekrar deneyin."
    }
}
