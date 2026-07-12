import Foundation
import Observation

/// Destek AI sohbetinin durumu. `POST /support/ai` ile yanıt alır; `escalate`
/// önerisinde veya kullanıcı isteğinde transkripti taşıyarak insan desteğe
/// talep açar (`POST /support/tickets` + `transcript`).
@MainActor
@Observable
final class SupportAIChatViewModel {

    struct ChatMessage: Identifiable {
        let id = UUID()
        let role: String   // "user" | "assistant"
        let content: String
    }

    private(set) var messages: [ChatMessage] = []
    private(set) var pending = false
    private(set) var creatingTicket = false
    /// Son AI yanıtı insan desteğe aktarım önerdi mi?
    private(set) var escalateSuggested = false
    private(set) var suggestedCategory: String?
    private(set) var suggestedSubject: String?
    var input = ""
    var errorMessage: String?

    private let api: APIClient

    init(api: APIClient = .shared) { self.api = api }

    var isEmpty: Bool { messages.isEmpty }

    func send(_ textOverride: String? = nil) async {
        let text = (textOverride ?? input).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !pending else { return }
        input = ""
        let history = messages.map { AssistantHistoryMessage(role: $0.role, content: $0.content) }
        messages.append(ChatMessage(role: "user", content: text))
        pending = true
        defer { pending = false }
        do {
            let res = try await api.askSupportAI(history: Array(history.suffix(10)), text: text)
            messages.append(ChatMessage(role: "assistant", content: res.reply))
            escalateSuggested = res.escalate
            if let cat = res.suggestedCategory, !cat.isEmpty { suggestedCategory = cat }
            if let sub = res.suggestedSubject, !sub.isEmpty { suggestedSubject = sub }
        } catch {
            messages.append(ChatMessage(role: "assistant", content: "Bir sorun oldu, tekrar dener misin?"))
        }
    }

    /// Sohbet transkriptini taşıyarak insan desteğe talep açar. Başarıda `true`.
    func createTicket() async -> Bool {
        guard !creatingTicket else { return false }
        creatingTicket = true
        defer { creatingTicket = false }
        errorMessage = nil

        let transcript = messages.map { AssistantHistoryMessage(role: $0.role, content: $0.content) }
        let subject = suggestedSubject
            ?? messages.first(where: { $0.role == "user" }).map { String($0.content.prefix(60)) }
            ?? "Destek talebi"
        let body = SupportCreateBody(
            subject: subject,
            category: suggestedCategory,
            transcript: transcript.isEmpty ? nil : transcript
        )
        do {
            let res = try await api.createSupportTicket(body)
            if res.ok { return true }
            errorMessage = "Talep oluşturulamadı, tekrar dener misin?"
            return false
        } catch {
            errorMessage = (error as? APIError)?.errorDescription ?? "Talep oluşturulamadı, tekrar dener misin?"
            return false
        }
    }
}
