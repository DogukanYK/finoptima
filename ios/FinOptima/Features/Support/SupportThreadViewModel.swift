import Foundation
import Observation

/// Tek bir destek talebinin mesaj dizisi. Gönderim optimistic yapılır; ekran
/// açıkken 6 sn'de bir `after=` imleciyle yalnızca yeni mesajlar çekilir.
@MainActor
@Observable
final class SupportThreadViewModel {

    let ticketId: String
    private(set) var messages: [SupportMessageDTO] = []
    private(set) var status: String?
    private(set) var isLoading = false
    private(set) var sending = false
    var input = ""
    var errorMessage: String?

    private let api: APIClient
    private static let localPrefix = "local-"

    init(ticketId: String, api: APIClient = .shared) {
        self.ticketId = ticketId
        self.api = api
    }

    /// Tam detayı yükler (ilk açılış).
    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let detail = try await api.supportTicket(id: ticketId, after: nil)
            messages = detail.messages
            status = detail.status
            errorMessage = nil
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? "Mesajlar yüklenemedi."
        }
    }

    /// Son sunucu mesajından sonrasını çeker, yenileri ekler.
    /// Poll hatası sessizce yutulur — bir sonraki tur toparlar.
    func poll() async {
        guard let cursor = lastServerCursor else {
            if messages.isEmpty { await load() }
            return
        }
        guard let detail = try? await api.supportTicket(id: ticketId, after: cursor) else { return }
        merge(detail)
    }

    /// Optimistic gönderim: mesaj hemen listede görünür, POST başarısızsa geri alınır.
    func send() async {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !sending else { return }
        input = ""
        sending = true
        defer { sending = false }

        let temp = SupportMessageDTO(
            id: Self.localPrefix + UUID().uuidString,
            author: "USER",
            body: text,
            createdAt: ISO8601DateFormatter().string(from: Date())
        )
        messages.append(temp)
        errorMessage = nil

        do {
            _ = try await api.sendSupportMessage(id: ticketId, body: text)
        } catch {
            // Gönderim başarısız → optimistic mesajı geri al, metni koru.
            messages.removeAll { $0.id == temp.id }
            input = text
            errorMessage = (error as? APIError)?.errorDescription ?? "Mesaj gönderilemedi."
            return
        }

        // Sunucu kopyasını hemen al; başarısız olursa sıradaki poll toparlar.
        if let detail = try? await api.supportTicket(id: ticketId, after: lastServerCursor) {
            merge(detail)
        }
    }

    // MARK: - Yardımcılar

    /// Son *sunucu* mesajının `createdAt`'i — optimistic yerel mesajlar imleç olamaz.
    private var lastServerCursor: String? {
        messages.last(where: { !$0.id.hasPrefix(Self.localPrefix) })?.createdAt
    }

    /// Yeni sunucu mesajlarını ekler; sunucuya ulaştığı görülen optimistic
    /// kopyaları (aynı gövdeli USER mesajı) temizler ki mesaj çift görünmesin.
    private func merge(_ detail: SupportTicketDetailDTO) {
        status = detail.status
        let known = Set(messages.map(\.id))
        let fresh = detail.messages.filter { !known.contains($0.id) }
        guard !fresh.isEmpty else { return }
        let freshUserBodies = Set(fresh.filter { $0.author == "USER" }.map(\.body))
        messages.removeAll { $0.id.hasPrefix(Self.localPrefix) && freshUserBodies.contains($0.body) }
        messages.append(contentsOf: fresh)
    }
}
