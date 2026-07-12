//
//  Models.swift
//  FinOptima
//
//  API veri modelleri. Tüm tipler backend sözleşmesindeki alan adlarıyla
//  birebir eşleşir. Sunucu camelCase döndürdüğü için özel CodingKeys yok.
//  Tarihler ("YYYY-MM-DD", ISO) String olarak saklanır ve UI katmanında biçimlenir.
//

import Foundation

// MARK: - Kimlik / Oturum

struct AuthUser: Decodable {
    let id: String
    let email: String
    let name: String
    let role: String
}

struct LoginResponse: Decodable {
    let tokenType: String
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
    let user: AuthUser
}

struct RefreshResponse: Decodable {
    let tokenType: String
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
}

// MARK: - Kullanıcı (/me)

struct MeUser: Decodable {
    let id: String
    let email: String
    let name: String
    let role: String
    let twoFactorEnabled: Bool
    let createdAt: String
}

struct MeResponse: Decodable {
    let user: MeUser
}

// MARK: - İşlemler (Transactions)

struct TxCategory: Decodable {
    let id: String
    let name: String
    let icon: String
    let color: String
}

struct TxAccount: Decodable {
    let id: String
    let label: String
    let bankName: String
}

struct Transaction: Decodable, Identifiable {
    let id: String
    let kind: String
    let amount: Double
    let date: String
    let description: String
    let note: String?
    let source: String
    let category: TxCategory?
    let account: TxAccount?
}

struct Totals: Decodable {
    let income: Double
    let expense: Double
}

struct TransactionsResponse: Decodable {
    let items: [Transaction]
    let nextCursor: String?
    let totals: Totals
}

struct CreateTxResponse: Decodable {
    let transaction: Transaction
}

// MARK: - Findeks

struct FindeksFactor: Decodable {
    let key: String
    let label: String
    let score: Int
    let weight: Double
    let detail: String
}

struct FindeksAdvice: Decodable {
    let title: String
    let body: String
    let severity: String
}

struct FindeksEstimate: Decodable {
    let estimatedScore: Int
    let healthScore: Int
    let band: String
    let factors: [FindeksFactor]
    let advice: [FindeksAdvice]
}

struct FindeksResponse: Decodable {
    // `report` alanı sözleşme gereği kasıtlı olarak dahil edilmez; decode'da yok sayılır.
    let hasReport: Bool
    let score: Int
    let band: String
    let reportDate: String?
    let estimated: FindeksEstimate
    let coach: CoachEnvelope?   // AI koç planı (varsa)
}

// MARK: - AI Koç (Coach)

struct CoachStep: Decodable, Identifiable {
    let priority: String   // high | medium | low
    let title: String
    let why: String
    let action: String
    let impact: String
    var id: String { title }
}

struct CoachPlan: Decodable {
    let summary: String
    let steps: [CoachStep]
}

struct CoachEnvelope: Decodable {
    let plan: CoachPlan
    let generatedAt: String
}

// MARK: - AI Asistan

struct AssistantProposedAction: Codable, Identifiable {
    let type: String          // "transaction"
    let kind: String          // INCOME | EXPENSE
    let amount: Double
    let description: String
    let category: String?
    let date: String
    let note: String?
    var id: String { "\(kind)-\(amount)-\(description)-\(date)" }
}

struct AssistantReplyResponse: Decodable {
    let reply: String
    let actions: [AssistantProposedAction]
    let navigate: String?
}

struct AssistantCommitCreated: Decodable {
    let kind: String
    let amount: Double
    let description: String
    let date: String
    let categoryName: String?
}

struct AssistantCommitResponse: Decodable {
    let ok: Bool
    let created: AssistantCommitCreated?
    let error: String?
}

struct AssistantHistoryMessage: Encodable {
    let role: String   // user | assistant
    let content: String
}

// MARK: - Profil

struct ProfileResponse: Decodable {
    let name: String
    let email: String
    let role: String
    let twoFactorEnabled: Bool
    let createdAt: String
    let aiIdentity: String
    let profession: String
    let incomeRange: String
}

struct ProfileUpdateBody: Encodable {
    let name: String?
    let aiIdentity: String?
}

struct OkResponse: Decodable {
    let ok: Bool
}

// MARK: - Banka Dökümü Import

struct ImportRow: Codable, Identifiable {
    let date: String
    let description: String
    let amount: Double
    let kind: String            // INCOME | EXPENSE | TRANSFER
    let categoryId: String?
    let categoryName: String?
    let dedupHash: String
    var duplicate: Bool
    var force: Bool?
    var id: String { dedupHash + "|" + date + "|" + description }
}

struct ImportParseResponse: Decodable {
    let ok: Bool
    let error: String?
    let rows: [ImportRow]?
    let fileName: String?
    let detectedBank: String?
}

struct ImportNewAccount: Encodable {
    let label: String
    let type: String
}

struct ImportCommitBody: Encodable {
    let bankName: String
    let fileName: String
    let rows: [ImportRow]
    let newAccount: ImportNewAccount?
}

struct ImportCommitResponse: Decodable {
    let ok: Bool
    let imported: Int
    let skipped: Int
}

// MARK: - Takvim

struct CalendarEventItem: Decodable, Identifiable {
    let id: String
    let title: String
    let date: String
    let time: String?
    let type: String     // REMINDER | BILL | EVENT
    let amount: Double?
    let note: String?
    let isPaid: Bool
}

struct CalendarEventsResponse: Decodable {
    let events: [CalendarEventItem]
}

struct CreateEventBody: Encodable {
    let title: String
    let date: String     // yyyy-MM-dd
    let type: String
    let amount: Double?
    let note: String?
}

struct CreateEventResponse: Decodable {
    let ok: Bool
    let id: String
}

struct ToggleEventResponse: Decodable {
    let ok: Bool
    let isPaid: Bool
}

// MARK: - Borçlar (Debts)

struct Debt: Decodable, Identifiable {
    let id: String
    let name: String
    let kind: String
    let balance: Double
    let apr: Double
    let dueDay: Int?
    let paidTotal: Double
    let createdAt: String
}

struct DebtTotals: Decodable {
    let count: Int
    let totalBalance: Double
}

struct DebtsResponse: Decodable {
    let items: [Debt]
    let totals: DebtTotals
}

// MARK: - Referanslar (Kategoriler / Hesaplar)

struct RefCategory: Decodable, Identifiable {
    let id: String
    let name: String
    let icon: String
    let color: String
    let kind: String
}

struct RefAccount: Decodable, Identifiable {
    let id: String
    let label: String
    let bankName: String
    let type: String
    let cardLast4: String?
}

struct RefsResponse: Decodable {
    let categories: [RefCategory]
    let accounts: [RefAccount]
}

// MARK: - Panel (Dashboard)

struct Breakdown: Decodable, Identifiable {
    let name: String
    let color: String
    let icon: String
    let total: Double

    var id: String { name }
}

struct TrendPoint: Decodable, Identifiable {
    let month: String
    let income: Double
    let expense: Double

    var id: String { month }
}

struct Upcoming: Decodable, Identifiable {
    let id: String
    let title: String
    let date: String
    let type: String
    let amount: Double?
}

struct DashboardFindeks: Decodable {
    let score: Int
    let band: String
    let healthScore: Int
    let hasReport: Bool
}

struct DashboardCoach: Decodable {
    let title: String
    let action: String
    let priority: String
}

struct Dashboard: Decodable {
    let income: Double
    let expense: Double
    let net: Double
    let balance: Double
    let recent: [Transaction]
    let breakdown: [Breakdown]
    let trend: [TrendPoint]
    let upcoming: [Upcoming]
    let findeks: DashboardFindeks?
    let topCoach: DashboardCoach?
}

// MARK: - Hata Zarfı

struct APIErrorDetail: Decodable {
    let code: String
    let message: String
}

struct APIErrorBody: Decodable {
    let error: APIErrorDetail
}
