import Foundation

/// Desteklenen HTTP metotları.
enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

/// Tek bir API ucunu tarifler: göreli yol, metot, kimlik doğrulama gerekliliği ve
/// sorgu parametreleri. `path` özelliği sorgu dizesini (yüzde-kodlanmış) da içerir.
///
/// Tüm yollar `AppConfig.baseURL` (örn. `https://financeoptima.vercel.app/api/mobile`)
/// ile birleştirilecek şekilde `/` ile başlar.
struct Endpoint {
    let rawPath: String
    let method: HTTPMethod
    let authed: Bool
    let queryItems: [URLQueryItem]

    init(_ rawPath: String, method: HTTPMethod = .get, authed: Bool = true, query: [URLQueryItem] = []) {
        self.rawPath = rawPath
        self.method = method
        self.authed = authed
        self.queryItems = query
    }

    /// Sorgu parametreleri eklenmiş, yüzde-kodlanmış tam göreli yol.
    var path: String {
        guard !queryItems.isEmpty else { return rawPath }
        var components = URLComponents()
        components.queryItems = queryItems
        guard let query = components.percentEncodedQuery, !query.isEmpty else { return rawPath }
        return "\(rawPath)?\(query)"
    }
}

// MARK: - Uç tanımları

extension Endpoint {
    static let login = Endpoint("/auth/login", method: .post, authed: false)
    static let refresh = Endpoint("/auth/refresh", method: .post, authed: false)
    static let me = Endpoint("/me")
    static let findeks = Endpoint("/findeks")
    static let debts = Endpoint("/debts")
    static let refs = Endpoint("/refs")
    static let dashboard = Endpoint("/dashboard")
    static let createTransaction = Endpoint("/transactions", method: .post)
    static let assistant = Endpoint("/assistant", method: .post)
    static let assistantCommit = Endpoint("/assistant/commit", method: .post)
    static let profile = Endpoint("/profile")
    static let updateProfile = Endpoint("/profile", method: .patch)
    static let importParse = Endpoint("/import", method: .post)
    static let importCommit = Endpoint("/import/commit", method: .post)
    static let calendar = Endpoint("/calendar")
    static let createEvent = Endpoint("/calendar", method: .post)
    static func toggleEvent(_ id: String) -> Endpoint { Endpoint("/calendar/\(id)", method: .patch) }
    static func deleteEvent(_ id: String) -> Endpoint { Endpoint("/calendar/\(id)", method: .delete) }

    // Destek (Support)
    static let supportTickets = Endpoint("/support/tickets")
    static let createSupportTicket = Endpoint("/support/tickets", method: .post)
    static let supportAI = Endpoint("/support/ai", method: .post)

    /// `GET /support/tickets/{id}` — `after` (ISO) verilirse yalnızca o andan
    /// sonraki mesajlar döner (poll imleci).
    static func supportTicket(_ id: String, after: String? = nil) -> Endpoint {
        var items: [URLQueryItem] = []
        if let after, !after.isEmpty { items.append(URLQueryItem(name: "after", value: after)) }
        return Endpoint("/support/tickets/\(id)", query: items)
    }

    /// `POST /support/tickets/{id}` — talebe yeni mesaj.
    static func supportMessage(_ id: String) -> Endpoint {
        Endpoint("/support/tickets/\(id)", method: .post)
    }

    /// `GET /transactions` — verilen filtreler yalnızca doluysa sorguya eklenir.
    static func transactions(
        kind: String? = nil,
        categoryId: String? = nil,
        month: String? = nil,
        search: String? = nil,
        cursor: String? = nil
    ) -> Endpoint {
        var items: [URLQueryItem] = []
        if let kind, !kind.isEmpty { items.append(URLQueryItem(name: "kind", value: kind)) }
        if let categoryId, !categoryId.isEmpty { items.append(URLQueryItem(name: "categoryId", value: categoryId)) }
        if let month, !month.isEmpty { items.append(URLQueryItem(name: "month", value: month)) }
        if let search, !search.isEmpty { items.append(URLQueryItem(name: "search", value: search)) }
        if let cursor, !cursor.isEmpty { items.append(URLQueryItem(name: "cursor", value: cursor)) }
        return Endpoint("/transactions", method: .get, authed: true, query: items)
    }
}

// MARK: - İstek gövdeleri

/// `POST /auth/login` gövdesi. `totp`, `totp_required` yanıtından sonra doldurulur.
struct LoginBody: Encodable {
    let email: String
    let password: String
    let totp: String?
}

/// `POST /auth/refresh` gövdesi.
struct RefreshBody: Encodable {
    let refreshToken: String
}

/// `POST /assistant` gövdesi — sohbet geçmişi + yeni mesaj.
struct AssistantAskBody: Encodable {
    let history: [AssistantHistoryMessage]
    let text: String
}

/// `POST /assistant/commit` gövdesi — onaylanan öneri.
struct AssistantCommitBody: Encodable {
    let action: AssistantProposedAction
}

/// `POST /transactions` gövdesi. `nil` alanlar gönderilmez.
struct CreateTransactionBody: Encodable {
    let amount: Double
    let kind: String          // "INCOME" | "EXPENSE"
    let description: String
    let date: String          // "YYYY-MM-DD"
    let categoryId: String?
    let accountId: String?
    let note: String?

    init(
        amount: Double,
        kind: String,
        description: String,
        date: String,
        categoryId: String? = nil,
        accountId: String? = nil,
        note: String? = nil
    ) {
        self.amount = amount
        self.kind = kind
        self.description = description
        self.date = date
        self.categoryId = categoryId
        self.accountId = accountId
        self.note = note
    }

    private enum CodingKeys: String, CodingKey {
        case amount, kind, description, date, categoryId, accountId, note
    }

    func encode(to encoder: any Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(amount, forKey: .amount)
        try container.encode(kind, forKey: .kind)
        try container.encode(description, forKey: .description)
        try container.encode(date, forKey: .date)
        // Yalnızca dolu olan opsiyonel alanları serileştir (null göndermemek için).
        try container.encodeIfPresent(categoryId, forKey: .categoryId)
        try container.encodeIfPresent(accountId, forKey: .accountId)
        try container.encodeIfPresent(note, forKey: .note)
    }
}
