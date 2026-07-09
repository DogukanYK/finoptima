import Foundation
import Observation

/// Panel (Dashboard) ekranının veri kaynağı.
///
/// `GET /dashboard` çağrısını yapar ve sonucu üç durumla yansıtır:
/// yükleniyor · yüklendi (`dashboard`) · hata (`errorMessage`). İlk açılışta tam
/// ekran gösterge, aşağı çekerek yenilemede mevcut veriyi koruyan sessiz yenileme
/// uygular.
@MainActor
@Observable
final class DashboardViewModel {

    /// Sunucudan gelen panel verisi. `nil` iken henüz yüklenmemiş demektir.
    private(set) var dashboard: Dashboard?

    /// Tam ekran gösterge yalnızca ilk yüklemede gösterilir.
    private(set) var isLoading = false

    /// Son hatanın kullanıcıya gösterilecek Türkçe mesajı.
    private(set) var errorMessage: String?

    private let api: APIClient

    init(api: APIClient = .shared) {
        self.api = api
    }

    /// Ekran ilk göründüğünde çağrılır. Veri zaten yüklüyse tekrar istek atmaz.
    func loadIfNeeded() async {
        guard dashboard == nil else { return }
        await load(showsSpinner: true)
    }

    /// Hatadan sonra "Tekrar Dene" için tam ekran göstergeyle yeniden yükler.
    func reload() async {
        await load(showsSpinner: true)
    }

    /// Aşağı çekerek yenile (`.refreshable`). Gösterge SwiftUI tarafından yönetilir;
    /// mevcut veri ekranda korunur.
    func refresh() async {
        await load(showsSpinner: false)
    }

    private func load(showsSpinner: Bool) async {
        if showsSpinner { isLoading = true }
        errorMessage = nil
        defer { isLoading = false }

        do {
            dashboard = try await api.dashboard()
        } catch let error as APIError {
            // Elde veri varsa onu ekranda tutup yalnızca hata mesajını kaydet;
            // veri yoksa görünüm tam ekran hata durumuna geçer.
            errorMessage = error.errorDescription ?? "Panel yüklenemedi."
        } catch {
            errorMessage = "Panel yüklenemedi. Lütfen tekrar deneyin."
        }
    }
}
