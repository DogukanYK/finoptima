import Foundation
import Security

/// Access + refresh JWT token'larını iOS Keychain'de güvenli saklar.
///
/// `kSecClassGenericPassword` kullanır ve öğeleri
/// `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` ile korur: cihaz kilitliyken
/// erişilemez ve yedeklerle başka bir cihaza taşınmaz.
struct KeychainStore {

    /// Uygulama genelinde paylaşılan örnek.
    static let shared = KeychainStore()

    private let service: String
    private let accessAccount = "finoptima.accessToken"
    private let refreshAccount = "finoptima.refreshToken"

    init(service: String = Bundle.main.bundleIdentifier ?? "com.finoptima.app") {
        self.service = service
    }

    // MARK: - Okuma

    /// Kayıtlı access token (yoksa nil).
    var accessToken: String? { read(account: accessAccount) }

    /// Kayıtlı refresh token (yoksa nil).
    var refreshToken: String? { read(account: refreshAccount) }

    /// Oturum var mı? (access token mevcut mu)
    var hasSession: Bool { accessToken != nil }

    // MARK: - Yazma

    /// Login veya refresh sonrası her iki token'ı birlikte saklar.
    func saveTokens(access: String, refresh: String) {
        save(account: accessAccount, value: access)
        save(account: refreshAccount, value: refresh)
    }

    /// Sadece access token'ı günceller (yenileme senaryosu için).
    func saveAccessToken(_ token: String) {
        save(account: accessAccount, value: token)
    }

    /// Sadece refresh token'ı günceller.
    func saveRefreshToken(_ token: String) {
        save(account: refreshAccount, value: token)
    }

    // MARK: - Silme

    /// Oturumu kapatırken tüm token'ları temizler.
    func clear() {
        delete(account: accessAccount)
        delete(account: refreshAccount)
    }

    // MARK: - Keychain temel işlemleri

    @discardableResult
    private func save(account: String, value: String) -> Bool {
        guard let data = value.data(using: .utf8) else { return false }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]

        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        // Önce mevcut öğeyi güncellemeyi dene; yoksa yeni ekle.
        let updateStatus = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if updateStatus == errSecSuccess {
            return true
        }
        if updateStatus == errSecItemNotFound {
            var insert = query
            insert[kSecValueData as String] = data
            insert[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
            return SecItemAdd(insert as CFDictionary, nil) == errSecSuccess
        }
        return false
    }

    private func read(account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }
        return value
    }

    @discardableResult
    private func delete(account: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }
}
