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

struct Dashboard: Decodable {
    let income: Double
    let expense: Double
    let net: Double
    let balance: Double
    let recent: [Transaction]
    let breakdown: [Breakdown]
    let trend: [TrendPoint]
    let upcoming: [Upcoming]
}

// MARK: - Hata Zarfı

struct APIErrorDetail: Decodable {
    let code: String
    let message: String
}

struct APIErrorBody: Decodable {
    let error: APIErrorDetail
}
