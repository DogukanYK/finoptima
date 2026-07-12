import Foundation
import Observation

/// Ayarlar ekranı için referans veriler (kategoriler, hesaplar) ve güvenlik durumu.
@MainActor
@Observable
final class SettingsViewModel {
    private(set) var categories: [RefCategory] = []
    private(set) var accounts: [RefAccount] = []
    private(set) var twoFactorEnabled = false
    private(set) var loaded = false

    private let api: APIClient
    init(api: APIClient = .shared) { self.api = api }

    func loadIfNeeded() async {
        guard !loaded else { return }
        await load()
    }

    func load() async {
        async let refs = try? api.refs()
        async let me = try? api.me()
        if let r = await refs {
            categories = r.categories
            accounts = r.accounts
        }
        if let m = await me {
            twoFactorEnabled = m.user.twoFactorEnabled
        }
        loaded = true
    }
}
