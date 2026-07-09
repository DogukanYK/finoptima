import Foundation
import LocalAuthentication

/// Face ID / Touch ID veya cihaz parolası ile yerel kimlik doğrulama kapısı.
///
/// Uygulama arka plandan öne geldiğinde (`.locked` durumu) kullanıcıdan
/// kimlik doğrulaması istemek için kullanılır. Biyometri yoksa otomatik olarak
/// cihaz parolasına düşer.
struct BiometricGate {

    /// Uygulama genelinde paylaşılan örnek.
    static let shared = BiometricGate()

    /// Cihazda Face ID / Touch ID kullanılabilir mi?
    var isBiometricsAvailable: Bool {
        let context = LAContext()
        var error: NSError?
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }

    /// Kullanılabilir biyometri türü (Face ID / Touch ID / yok).
    var biometryType: LABiometryType {
        let context = LAContext()
        var error: NSError?
        _ = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        return context.biometryType
    }

    /// Kullanıcı dostu biyometri adı (buton/etiket için).
    var biometryLabel: String {
        switch biometryType {
        case .faceID: return "Face ID"
        case .touchID: return "Touch ID"
        default: return "Cihaz Parolası"
        }
    }

    /// Face ID / Touch ID dener; yoksa veya başarısız olursa cihaz parolasına düşer.
    ///
    /// - Parameter reason: Sistem doğrulama ekranında gösterilen açıklama.
    /// - Returns: Doğrulama başarılıysa `true`; kullanıcı iptal eder,
    ///   başarısız olur ya da hiçbir yöntem kullanılamıyorsa `false`.
    func authenticate(reason: String = "FinOptima'yı aç") async -> Bool {
        let context = LAContext()
        context.localizedFallbackTitle = "Parola Kullan"
        context.localizedCancelTitle = "İptal"

        // Biyometri + cihaz parolası; biyometri yoksa doğrudan parolaya izin verir.
        let policy: LAPolicy = .deviceOwnerAuthentication

        var error: NSError?
        guard context.canEvaluatePolicy(policy, error: &error) else {
            return false
        }

        do {
            return try await context.evaluatePolicy(policy, localizedReason: reason)
        } catch {
            return false
        }
    }
}
