import Foundation
import Observation

/// Takvim/etkinlik listesi — yaklaşan hatırlatma, fatura ve etkinlikler.
@MainActor
@Observable
final class CalendarViewModel {
    private(set) var events: [CalendarEventItem] = []
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    private let api: APIClient
    init(api: APIClient = .shared) { self.api = api }

    private static let dayKey: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Europe/Istanbul")
        return f
    }()

    /// Bugüne göre geçmiş / yaklaşan ayrımı için ISO gün anahtarı.
    private func iso(_ date: String) -> String { String(date.prefix(10)) }
    private var todayKey: String { Self.dayKey.string(from: Date()) }

    var upcoming: [CalendarEventItem] { events.filter { iso($0.date) >= todayKey } }
    var past: [CalendarEventItem] { events.filter { iso($0.date) < todayKey } }

    func loadIfNeeded() async {
        guard events.isEmpty else { return }
        await load()
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            events = try await api.calendar().events
        } catch {
            errorMessage = "Takvim yüklenemedi."
        }
    }

    @discardableResult
    func add(title: String, date: Date, type: String, amount: Double?, note: String?) async -> Bool {
        let dateStr = Self.dayKey.string(from: date)
        do {
            _ = try await api.createEvent(
                CreateEventBody(title: title, date: dateStr, type: type, amount: amount, note: note)
            )
            await load()
            return true
        } catch {
            return false
        }
    }

    func togglePaid(_ event: CalendarEventItem) async {
        do {
            _ = try await api.toggleEvent(event.id)
            await load()
        } catch { /* sessiz */ }
    }

    func delete(_ event: CalendarEventItem) async {
        do {
            _ = try await api.deleteEvent(event.id)
            events.removeAll { $0.id == event.id }
        } catch { /* sessiz */ }
    }
}
