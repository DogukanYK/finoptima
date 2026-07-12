import SwiftUI
import Observation

/// Destek talepleri listesinin durumu — `GET /support/tickets`.
@MainActor
@Observable
final class SupportListViewModel {

    private(set) var tickets: [SupportTicketDTO] = []
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    private var loaded = false
    private let api: APIClient

    init(api: APIClient = .shared) { self.api = api }

    /// İlk görünümde bir kez yükler; sonrası `load()` (refresh) ile.
    func loadIfNeeded() async {
        guard !loaded else { return }
        await load()
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let res = try await api.supportTickets()
            tickets = res.tickets
            errorMessage = nil
            loaded = true
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? "Talepler yüklenemedi."
        }
    }
}

// MARK: - Kategori

/// Destek kategorileri — backend enum değerleri + Türkçe etiketler.
enum SupportCategory: String, CaseIterable, Identifiable {
    case account = "ACCOUNT"
    case transactions = "TRANSACTIONS"
    case bankImport = "IMPORT"
    case findeks = "FINDEKS"
    case debts = "DEBTS"
    case security = "SECURITY"
    case bug = "BUG"
    case other = "OTHER"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .account: return "Hesap"
        case .transactions: return "İşlemler"
        case .bankImport: return "Banka Dökümü"
        case .findeks: return "Findeks"
        case .debts: return "Borçlar"
        case .security: return "Güvenlik"
        case .bug: return "Hata"
        case .other: return "Diğer"
        }
    }

    /// Ham backend değeri → Türkçe etiket (bilinmeyen değer aynen döner).
    static func label(for raw: String?) -> String? {
        guard let raw, !raw.isEmpty else { return nil }
        return SupportCategory(rawValue: raw)?.label ?? raw
    }
}

// MARK: - Durum

/// Talep durumu → Türkçe etiket + tema rengi.
enum SupportStatus {
    static func label(_ status: String) -> String {
        switch status {
        case "OPEN": return "Açık"
        case "WAITING_USER": return "Yanıt Bekliyor"
        case "RESOLVED": return "Çözüldü"
        case "CLOSED": return "Kapalı"
        default: return status
        }
    }

    static func color(_ status: String) -> Color {
        switch status {
        case "OPEN": return Theme.primary
        case "WAITING_USER": return Theme.cyan
        case "RESOLVED": return Theme.accent
        case "CLOSED": return Theme.muted
        default: return Theme.muted
        }
    }
}
