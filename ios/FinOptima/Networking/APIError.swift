import Foundation

/// FinOptima API katmanının tek hata tipi.
///
/// Sunucudan gelen `{ "error": { "code": ..., "message": ... } }` zarfı bu tipe
/// çözülür (`code` + `message` + HTTP `status`). Ağ / kodlama / çözümleme gibi
/// istemci tarafı hataları da aynı tip altında, `status = 0` ile taşınır; böylece
/// çağıran katman tek bir `catch APIError` ile tüm durumları ele alabilir.
struct APIError: Error, Sendable, Equatable {
    /// Sunucunun döndürdüğü hata kodu (örn. `invalid_credentials`, `totp_required`,
    /// `rate_limited`) ya da istemci tarafı sözde kodu (`network`, `decoding`, …).
    let code: String
    /// Kullanıcıya gösterilebilecek açıklama (öncelikle sunucudan gelen mesaj).
    let message: String
    /// HTTP durum kodu. İstemci tarafı hataları için `0`.
    let status: Int
    /// `429 rate_limited` yanıtındaki `Retry-After` başlığı (saniye), varsa.
    let retryAfter: TimeInterval?

    init(code: String, message: String, status: Int, retryAfter: TimeInterval? = nil) {
        self.code = code
        self.message = message
        self.status = status
        self.retryAfter = retryAfter
    }
}

// MARK: - Bilinen durumlar

extension APIError {
    var isUnauthorized: Bool { status == 401 }
    var isRateLimited: Bool { code == "rate_limited" || status == 429 }
    var isTOTPRequired: Bool { code == "totp_required" }
    var isTOTPInvalid: Bool { code == "totp_invalid" }
    var isInvalidCredentials: Bool { code == "invalid_credentials" }
    var isSessionRevoked: Bool { code == "session_revoked" || code == "invalid_token" }
}

// MARK: - İstemci tarafı üreticileri

extension APIError {
    /// Cihazda geçerli bir oturum/refresh token bulunamadı.
    static var noSession: APIError {
        APIError(code: "no_session", message: "Oturum bulunamadı. Lütfen tekrar giriş yapın.", status: 401)
    }

    /// Ağ/bağlantı katmanı hatası (URLSession fırlattı, HTTP yanıtı yok).
    static func transport(_ message: String) -> APIError {
        APIError(code: "network", message: message, status: 0)
    }

    /// İstek gövdesi JSON'a kodlanamadı.
    static func encoding(_ message: String) -> APIError {
        APIError(code: "encoding", message: message, status: 0)
    }

    /// Sunucu yanıtı beklenen modele çözümlenemedi.
    static func decoding(_ message: String) -> APIError {
        APIError(code: "decoding", message: message, status: 0)
    }
}

// MARK: - Kullanıcıya gösterilecek Türkçe mesaj

extension APIError: LocalizedError {
    var errorDescription: String? {
        // Sunucu anlamlı bir mesaj döndürdüyse onu tercih et.
        let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmed.isEmpty { return trimmed }
        return APIError.localizedMessage(for: code, status: status)
    }

    /// Sunucu boş mesaj döndürdüğünde koda göre makul bir Türkçe metin üretir.
    private static func localizedMessage(for code: String, status: Int) -> String {
        switch code {
        case "invalid_credentials":
            return "E-posta veya şifre hatalı."
        case "totp_required":
            return "Doğrulama kodu gerekli."
        case "totp_invalid":
            return "Doğrulama kodu geçersiz."
        case "rate_limited":
            return "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin."
        case "invalid_token", "session_revoked", "no_session":
            return "Oturumunuz sona erdi. Lütfen tekrar giriş yapın."
        case "network":
            return "Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin."
        case "decoding", "encoding":
            return "Beklenmeyen bir sunucu yanıtı alındı."
        default:
            if status >= 500 { return "Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin." }
            if status >= 400 { return "İstek işlenemedi." }
            return "Bilinmeyen bir hata oluştu."
        }
    }
}
