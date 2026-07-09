//
//  DebtsView.swift
//  FinOptima
//
//  "Borçlar" sekmesi: toplam bakiye özeti + borç listesi (GET /debts).
//  MainTabView içindeki NavigationStack tarafından sarmalanır; burada yalnızca
//  içerik ve başlık tanımlanır. Standart SwiftUI (List/refreshable), Türkçe UI.
//

import Foundation
import SwiftUI

struct DebtsView: View {
    @State private var model = DebtsViewModel()

    var body: some View {
        content
            .navigationTitle("Borçlar")
            .navigationBarTitleDisplayMode(.large)
            .background(Theme.bg)
            .task { await model.loadIfNeeded() }
    }

    // MARK: - Durum dağıtımı

    @ViewBuilder
    private var content: some View {
        if model.isEmpty {
            switch model.phase {
            case .idle, .loading:
                loadingState
            case .failed(let message):
                failureState(message)
            case .loaded:
                emptyState
            }
        } else {
            debtList
        }
    }

    // MARK: - Liste

    private var debtList: some View {
        List {
            Section {
                summary
                    .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            }

            Section {
                ForEach(model.debts) { debt in
                    DebtRow(debt: debt)
                        .listRowBackground(Theme.surface)
                }
            } header: {
                Text("Borç Listesi")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Theme.muted)
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(Theme.bg)
        .refreshable { await model.reload() }
    }

    private var summary: some View {
        HStack(spacing: 12) {
            StatCard(
                title: "Toplam Borç",
                amount: model.totalBalance,
                icon: "creditcard.fill",
                tint: Theme.expense
            )
            StatCard(
                title: "Borç Sayısı",
                value: "\(model.count)",
                icon: "list.bullet.rectangle",
                tint: Theme.primary
            )
        }
    }

    // MARK: - Boş / yükleniyor / hata durumları

    private var loadingState: some View {
        CenteredState {
            ProgressView()
                .controlSize(.large)
            Text("Borçlar yükleniyor…")
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
        }
    }

    private var emptyState: some View {
        CenteredState {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 52, weight: .semibold))
                .foregroundStyle(Theme.accent)
            Text("Kayıtlı borç yok")
                .font(.headline)
                .foregroundStyle(Theme.ink)
            Text("Takip edilen bir borcunuz bulunmuyor.")
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
        }
        .refreshableScroll { await model.reload() }
    }

    private func failureState(_ message: String) -> some View {
        CenteredState {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 52, weight: .semibold))
                .foregroundStyle(Theme.destructive)
            Text("Borçlar yüklenemedi")
                .font(.headline)
                .foregroundStyle(Theme.ink)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            Button {
                Task { await model.retry() }
            } label: {
                Label("Tekrar Dene", systemImage: "arrow.clockwise")
                    .frame(maxWidth: 220)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .padding(.top, 8)
        }
    }
}

// MARK: - Borç satırı

private struct DebtRow: View {
    let debt: Debt

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: DebtKind.icon(for: debt.kind))
                .font(.headline)
                .foregroundStyle(Theme.expense)
                .frame(width: 40, height: 40)
                .background(Theme.expense.opacity(0.12), in: Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(debt.name)
                    .font(.headline)
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    Text(DebtKind.label(for: debt.kind))
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                    if let apr = aprText {
                        Text("•").font(.caption).foregroundStyle(Theme.muted)
                        Text("%\(apr) faiz")
                            .font(.caption)
                            .foregroundStyle(Theme.muted)
                    }
                }

                if let day = debt.dueDay {
                    Text("Her ayın \(day). günü ödeme")
                        .font(.caption2)
                        .foregroundStyle(Theme.muted)
                }
            }

            Spacer(minLength: 8)

            VStack(alignment: .trailing, spacing: 4) {
                AmountText(value: debt.balance, color: Theme.ink, font: .headline)
                if debt.paidTotal > 0 {
                    Text("Ödenen \(Format.money(debt.paidTotal))")
                        .font(.caption2)
                        .foregroundStyle(Theme.accent)
                }
            }
        }
        .padding(.vertical, 6)
    }

    /// Yıllık faiz oranı — 0 ise gizlenir, aksi halde tr_TR biçiminde (en çok 2 basamak).
    private var aprText: String? {
        guard debt.apr > 0 else { return nil }
        return Self.percent.string(from: NSNumber(value: debt.apr))
    }

    private static let percent: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.locale = Locale(identifier: "tr_TR")
        f.minimumFractionDigits = 0
        f.maximumFractionDigits = 2
        return f
    }()
}

// MARK: - Borç türü eşlemesi

/// Sunucudan gelen ham `kind` değerini Türkçe etikete ve SF Symbol ikonuna çevirir.
/// Bilinmeyen türlerde ham değer korunur (veri gizlenmez), genel bir ikon kullanılır.
private enum DebtKind {
    static func label(for kind: String) -> String {
        switch normalize(kind) {
        case "creditcard", "credit_card", "card": return "Kredi Kartı"
        case "loan", "personalloan", "personal_loan": return "İhtiyaç Kredisi"
        case "mortgage", "housing", "housingloan", "housing_loan": return "Konut Kredisi"
        case "autoloan", "auto_loan", "vehicle", "car": return "Taşıt Kredisi"
        case "bnpl", "installment", "installments": return "Taksit"
        case "overdraft", "kmh": return "Kredili Mevduat"
        case "other": return "Diğer"
        default:
            let trimmed = kind.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.isEmpty ? "Borç" : trimmed
        }
    }

    static func icon(for kind: String) -> String {
        switch normalize(kind) {
        case "creditcard", "credit_card", "card": return "creditcard"
        case "loan", "personalloan", "personal_loan": return "banknote"
        case "mortgage", "housing", "housingloan", "housing_loan": return "house"
        case "autoloan", "auto_loan", "vehicle", "car": return "car"
        case "bnpl", "installment", "installments": return "cart"
        case "overdraft", "kmh": return "arrow.down.circle"
        default: return "creditcard"
        }
    }

    private static func normalize(_ kind: String) -> String {
        kind.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }
}

// MARK: - Ortak durum yerleşimi

/// Boş/yükleniyor/hata durumlarını ekranın ortasında, Theme.bg zemininde toplayan sarmalayıcı.
private struct CenteredState<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(spacing: 12) {
            content
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bg)
    }
}

private extension View {
    /// Boş durum ekranına da pull-to-refresh kazandırmak için kaydırılabilir sarmalayıcı.
    func refreshableScroll(_ action: @escaping @Sendable () async -> Void) -> some View {
        ScrollView {
            self.frame(maxWidth: .infinity, minHeight: 480)
        }
        .scrollBounceBehavior(.always)
        .background(Theme.bg)
        .refreshable { await action() }
    }
}

// MARK: - Önizleme

#Preview("Borçlar") {
    NavigationStack {
        DebtsView()
    }
}
