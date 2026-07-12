import Foundation

/// FinOptima mobil API istemcisi.
///
/// - `AppConfig.baseURL` tabanına göre istek kurar, `Bearer` erişim jetonunu
///   `KeychainStore`'dan ekler.
/// - Kimlik doğrulamalı bir istek `401` alırsa **tek sefer** refresh dener
///   (`POST /auth/refresh`), yeni jetonları saklar ve isteği bir kez daha yollar.
///   Refresh de `401` verirse oturumu kapatır (jetonları siler + oturum-bitti
///   kancasını tetikler).
/// - Eşzamanlı `401`'lerde tek bir refresh çağrısı yapılması için refresh işlemi
///   tek bir `Task` altında birleştirilir (rotasyonlu refresh token güvenliği).
///
/// Ağ G/Ç'sini ana iş parçacığından uzak tutmak ve durum erişimini serileştirmek
/// için `actor` olarak tasarlandı.
actor APIClient {

    /// Uygulama genelinde paylaşılan istemci.
    static let shared = APIClient()

    private let session: URLSession
    private let keychain: KeychainStore
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    /// Oturum kurtarılamaz biçimde sona erdiğinde (refresh `401`) çağrılır.
    /// Uygulama başlangıcında ayarlanır; genellikle `AppState`'i `.loggedOut`'a taşır.
    private var sessionExpiredHandler: (@Sendable () async -> Void)?

    /// Devam eden refresh işlemi — eşzamanlı çağrıların birleştirilmesi için.
    private var inFlightRefresh: Task<Void, Error>?

    init(session: URLSession = .shared, keychain: KeychainStore = KeychainStore()) {
        self.session = session
        self.keychain = keychain
        // Sunucu camelCase alan adları ve string/ISO tarihler kullanır → varsayılan strateji.
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    /// Oturum-bitti kancasını ayarlar (uygulama açılışında bir kez).
    func setSessionExpiredHandler(_ handler: @escaping @Sendable () async -> Void) {
        sessionExpiredHandler = handler
    }

    // MARK: - Genel istek API'si

    /// Gövdeli istek. `authed == true` ise `Bearer` eklenir ve `401` durumunda
    /// tek seferlik refresh + yeniden deneme uygulanır.
    func request<Body: Encodable, Response: Decodable>(
        path: String,
        method: HTTPMethod = .get,
        body: Body?,
        authed: Bool = true
    ) async throws -> Response {
        do {
            return try await send(path: path, method: method, body: body, authed: authed)
        } catch let error as APIError where authed && error.status == 401 {
            // 401 → tek sefer refresh dene. Refresh başarısız olursa (oturum kapatılır ve)
            // hata yukarı taşınır; başarılıysa isteği bir kez daha yolla.
            try await refreshTokens()
            return try await send(path: path, method: method, body: body, authed: authed)
        }
    }

    /// Gövdesiz istek (çoğunlukla `GET`).
    func request<Response: Decodable>(
        path: String,
        method: HTTPMethod = .get,
        authed: Bool = true
    ) async throws -> Response {
        try await request(path: path, method: method, body: Optional<EmptyBody>.none, authed: authed)
    }

    /// `Endpoint` tabanlı, gövdesiz kısayol.
    func request<Response: Decodable>(_ endpoint: Endpoint) async throws -> Response {
        try await request(path: endpoint.path, method: endpoint.method, authed: endpoint.authed)
    }

    /// `Endpoint` tabanlı, gövdeli kısayol.
    func request<Body: Encodable, Response: Decodable>(
        _ endpoint: Endpoint,
        body: Body
    ) async throws -> Response {
        try await request(path: endpoint.path, method: endpoint.method, body: body, authed: endpoint.authed)
    }

    // MARK: - Tek istek gönderimi

    private func send<Body: Encodable, Response: Decodable>(
        path: String,
        method: HTTPMethod,
        body: Body?,
        authed: Bool
    ) async throws -> Response {
        let urlRequest = try makeURLRequest(path: path, method: method, body: body, authed: authed)

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.transport("Bağlantı kurulamadı. İnternet bağlantınızı kontrol edin.")
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.transport("Sunucudan geçersiz yanıt alındı.")
        }

        guard (200..<300).contains(http.statusCode) else {
            throw decodeError(data: data, status: http.statusCode, response: http)
        }

        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            throw APIError.decoding("Sunucu yanıtı çözümlenemedi.")
        }
    }

    private func makeURLRequest<Body: Encodable>(
        path: String,
        method: HTTPMethod,
        body: Body?,
        authed: Bool
    ) throws -> URLRequest {
        guard let url = URL(string: AppConfig.baseURL.absoluteString + path) else {
            throw APIError.transport("Geçersiz istek adresi.")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            do {
                request.httpBody = try encoder.encode(body)
            } catch {
                throw APIError.encoding("İstek gövdesi hazırlanamadı.")
            }
        }

        if authed, let token = keychain.accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        return request
    }

    /// Hatalı HTTP yanıtını `APIError`'a çevirir (hata zarfı + `Retry-After`).
    private func decodeError(data: Data, status: Int, response: HTTPURLResponse) -> APIError {
        let retryAfter = response.value(forHTTPHeaderField: "Retry-After").flatMap { TimeInterval($0) }
        if let body = try? decoder.decode(APIErrorBody.self, from: data) {
            return APIError(code: body.error.code, message: body.error.message, status: status, retryAfter: retryAfter)
        }
        return APIError(
            code: "http_\(status)",
            message: HTTPURLResponse.localizedString(forStatusCode: status),
            status: status,
            retryAfter: retryAfter
        )
    }

    // MARK: - Refresh (birleştirilmiş)

    /// Devam eden bir refresh varsa ona katılır; yoksa yeni bir refresh başlatır.
    /// Kontrol-et-ve-ata bölümü askıya alma noktası içermediğinden actor üzerinde
    /// atomiktir → eşzamanlı `401`'ler tek bir refresh çağrısını paylaşır.
    private func refreshTokens() async throws {
        if let existing = inFlightRefresh {
            try await existing.value
            return
        }

        let task = Task<Void, Error> { [self] in
            try await performRefresh()
        }
        inFlightRefresh = task
        defer { inFlightRefresh = nil }
        try await task.value
    }

    private func performRefresh() async throws {
        guard let refreshToken = keychain.refreshToken else {
            await signOut()
            throw APIError.noSession
        }

        let body = RefreshBody(refreshToken: refreshToken)
        do {
            let refreshed: RefreshResponse = try await send(
                path: Endpoint.refresh.path,
                method: Endpoint.refresh.method,
                body: body,
                authed: false
            )
            keychain.saveTokens(access: refreshed.accessToken, refresh: refreshed.refreshToken)
        } catch let error as APIError where error.status == 401 {
            // Refresh token da geçersiz → oturumu kapat.
            await signOut()
            throw error
        }
    }

    /// Jetonları siler ve oturum-bitti kancasını tetikler.
    private func signOut() async {
        keychain.clear()
        await sessionExpiredHandler?()
    }

    /// Gövdesiz istekler için yer tutucu.
    private struct EmptyBody: Encodable {}
}

// MARK: - Tiplenmiş uç yardımcıları

extension APIClient {

    func login(email: String, password: String, totp: String? = nil) async throws -> LoginResponse {
        let body = LoginBody(email: email, password: password, totp: totp)
        return try await request(Endpoint.login, body: body)
    }

    /// Erişim jetonunu geçerli refresh token ile yeniler (dışarıdan tetiklenebilir).
    func refresh() async throws {
        try await refreshTokens()
    }

    func me() async throws -> MeResponse {
        try await request(Endpoint.me)
    }

    func findeks() async throws -> FindeksResponse {
        try await request(Endpoint.findeks)
    }

    func transactions(
        kind: String? = nil,
        categoryId: String? = nil,
        month: String? = nil,
        search: String? = nil,
        cursor: String? = nil
    ) async throws -> TransactionsResponse {
        try await request(
            Endpoint.transactions(kind: kind, categoryId: categoryId, month: month, search: search, cursor: cursor)
        )
    }

    func createTransaction(_ body: CreateTransactionBody) async throws -> CreateTxResponse {
        try await request(Endpoint.createTransaction, body: body)
    }

    func debts() async throws -> DebtsResponse {
        try await request(Endpoint.debts)
    }

    func refs() async throws -> RefsResponse {
        try await request(Endpoint.refs)
    }

    func dashboard() async throws -> Dashboard {
        try await request(Endpoint.dashboard)
    }

    func askAssistant(history: [AssistantHistoryMessage], text: String) async throws -> AssistantReplyResponse {
        let body = AssistantAskBody(history: history, text: text)
        return try await request(Endpoint.assistant, body: body)
    }

    func commitAssistantAction(_ action: AssistantProposedAction) async throws -> AssistantCommitResponse {
        let body = AssistantCommitBody(action: action)
        return try await request(Endpoint.assistantCommit, body: body)
    }
}
