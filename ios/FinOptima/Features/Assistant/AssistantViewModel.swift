import Foundation
import Observation

/// AI Asistan sohbetinin durumu. Mesaj geçmişini tutar, `POST /assistant` ile yanıt
/// alır ve önerilen işlemleri `POST /assistant/commit` ile kaydeder.
@MainActor
@Observable
final class AssistantViewModel {

    struct ChatMessage: Identifiable {
        let id = UUID()
        let role: String // "user" | "assistant"
        var content: String
        var actions: [AssistantProposedAction] = []
        var navigate: String? = nil
    }

    private(set) var messages: [ChatMessage] = []
    private(set) var pending = false
    var input = ""

    private let api: APIClient

    init(api: APIClient = .shared) { self.api = api }

    var isEmpty: Bool { messages.isEmpty }

    func send(_ textOverride: String? = nil) async {
        let text = (textOverride ?? input).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !pending else { return }
        input = ""
        let history = messages.map {
            AssistantHistoryMessage(role: $0.role, content: $0.content)
        }
        messages.append(ChatMessage(role: "user", content: text))
        pending = true
        defer { pending = false }
        do {
            let res = try await api.askAssistant(history: Array(history.suffix(10)), text: text)
            messages.append(
                ChatMessage(role: "assistant", content: res.reply, actions: res.actions, navigate: res.navigate)
            )
        } catch {
            messages.append(ChatMessage(role: "assistant", content: "Bir sorun oldu, tekrar dener misin?"))
        }
    }

    /// Bir öneriyi kaydeder. Başarılıysa oluşturulan işlemi döndürür.
    func commit(_ action: AssistantProposedAction) async -> AssistantCommitCreated? {
        do {
            let res = try await api.commitAssistantAction(action)
            return res.ok ? res.created : nil
        } catch {
            return nil
        }
    }

    func clear() {
        messages.removeAll()
    }
}
