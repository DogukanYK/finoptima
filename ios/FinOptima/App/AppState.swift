import Foundation
import Observation

/// Uygulamanın oturum ve kilit durumunu yöneten merkezi durum nesnesi.
///
/// APIClient, refresh başarısız olduğunda `AppState.shared.logout()` çağırarak
/// oturumu tek noktadan sonlandırır.
@MainActor
@Observable
final class AppState {

    /// Uygulamanın üst düzey görünüm durumu.
    enum Phase {
        /// Saklı token yok → LoginView gösterilir.
        case loggedOut
        /// Token var ama Face ID / cihaz parolası gerekiyor → LockView gösterilir.
        case locked
        /// Kimlik doğrulandı → MainTabView gösterilir.
        case ready
    }

    /// Paylaşılan örnek. Ağ katmanı (APIClient) oturum sonlandırmada bunu kullanır.
    static let shared = AppState()

    /// Aktif görünüm durumu.
    private(set) var phase: Phase

    private init() {
        // Cihazda saklı bir erişim token'ı varsa kilit ekranıyla başla,
        // yoksa doğrudan giriş ekranına düş.
        phase = KeychainStore.shared.accessToken == nil ? .loggedOut : .locked
    }

    /// Başarılı girişin ardından çağrılır. Token'lar bu noktada Keychain'e
    /// yazılmış olmalıdır.
    func didLogin() {
        phase = .ready
    }

    /// Face ID / cihaz parolası ile kilidi açmayı dener. Başarısız olursa
    /// kilitli kalır; kullanıcı yeniden deneyebilir veya çıkış yapabilir.
    func unlock() async {
        guard phase == .locked else { return }
        let success = await BiometricGate().authenticate()
        if success {
            phase = .ready
        }
    }

    /// Uygulama arka plana alındığında oturumu kilitler.
    /// Yalnızca giriş yapılmış (`.ready`) durumdayken etkilidir.
    func lock() {
        if phase == .ready {
            phase = .locked
        }
    }

    /// Oturumu kapatır: token'ları siler ve giriş ekranına döner.
    func logout() {
        KeychainStore.shared.clear()
        phase = .loggedOut
    }
}
