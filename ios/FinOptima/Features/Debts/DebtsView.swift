//
//  DebtsView.swift
//  FinOptima
//
//  "Borçlar" sekmesi: toplam bakiye özeti + borç listesi (GET /debts).
//  MainTabView içindeki NavigationStack tarafından sarmalanır; burada yalnızca
//  içerik ve başlık tanımlanır. Standart SwiftUI (ScrollView/refreshable), Türkçe UI.
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
        ScrollView {
            VStack(spacing: 22) {
                summaryHero
                    .padding(.top, 4)

                VStack(alignment: .leading, spacing: 12) {
                    SectionHeader(title: "Borç Listesi")
                    LazyVStack(spacing: 12) {
                        ForEach(model.debts) { debt in
                            DebtRow(debt: debt)
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 28)
        }
        .background(Theme.bg)
        .scrollIndicators(.hidden)
        .refreshable { await model.reload() }
    }

    // MARK: - Toplam borç kahraman kartı

    private var summaryHero: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(spacing: 10) {
                Image(systemName: "creditcard.fill")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(.white.opacity(0.14), in: RoundedRectangle(cornerRadius: 11, style: .continuous))

                Text("TOPLAM BORÇ")
                    .font(.caption.weight(.semibold))
                    .tracking(1.2)
                    .foregroundStyle(.white.opacity(0.75))

                Spacer(minLength: 8)

                HStack(spacing: 5) {
                    Image(systemName: "list.bullet")
                        .font(.caption2.weight(.bold))
                    Text("\(model.count) borç")
                        .font(.caption.weight(.semibold))
                }
                .foregroundStyle(.white)
                .padding(.horizontal, 11)
                .padding(.vertical, 5)
                .background(.white.opacity(0.16), in: Capsule())
            }

            VStack(alignment: .leading, spacing: 5) {
                Text(Format.money(model.totalBalance))
                    .font(.display(38, .bold))
                    .monospacedDigit()
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)

                Text("Takip edilen toplam kalan bakiye")
                    .font(.footnote)
                    .foregroundStyle(.white.opacity(0.72))
            }
        }
        .padding(22)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            ZStack(alignment: .topTrailing) {
                Theme.darkGradient
                Image(systemName: "creditcard.fill")
                    .font(.system(size: 160, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.07))
                    .rotationEffect(.degrees(-10))
                    .offset(x: 36, y: -30)
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                .strokeBorder(.white.opacity(0.08), lineWidth: 1)
        )
        .shadow(color: Color(hex: "0F172A").opacity(0.35), radius: 20, x: 0, y: 12)
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
        ScrollView {
            ContentUnavailableView {
                VStack(spacing: 14) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 50, weight: .semibold))
                        .foregroundStyle(Theme.accent)
                        .frame(width: 92, height: 92)
                        .background(Theme.accentSoft, in: Circle())
                    Text("Kayıtlı borç yok")
                        .font(.display(20, .bold))
                        .foregroundStyle(Theme.ink)
                }
            } description: {
                Text("Takip edilen bir borcunuz bulunmuyor. Tüm hesaplarınız temiz görünüyor.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.muted)
            }
            .frame(maxWidth: .infinity, minHeight: 480)
        }
        .scrollBounceBehavior(.always)
        .background(Theme.bg)
        .refreshable { await model.reload() }
    }

    private func failureState(_ message: String) -> some View {
        CenteredState {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 34, weight: .semibold))
                .foregroundStyle(Theme.destructive)
                .frame(width: 84, height: 84)
                .background(Theme.destructive.opacity(0.12), in: Circle())

            Text("Borçlar yüklenemedi")
                .font(.display(20, .bold))
                .foregroundStyle(Theme.ink)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)

            Button {
                Haptics.light()
                Task { await model.retry() }
            } label: {
                Label("Tekrar Dene", systemImage: "arrow.clockwise")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: 240)
                    .padding(.vertical, 14)
                    .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: Theme.controlRadius, style: .continuous))
                    .shadow(color: Theme.primary.opacity(0.3), radius: 12, x: 0, y: 6)
            }
            .buttonStyle(PressableStyle())
            .padding(.top, 8)
        }
    }
}

// MARK: - Borç satırı

private struct DebtRow: View {
    let debt: Debt

    var body: some View {
        VStack(spacing: 14) {
            HStack(spacing: 14) {
                Image(systemName: DebtKind.icon(for: debt.kind))
                    .symbolVariant(.fill)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(Theme.primary)
                    .frame(width: 46, height: 46)
                    .background(Theme.primarySoft, in: RoundedRectangle(cornerRadius: 13, style: .continuous))

                VStack(alignment: .leading, spacing: 6) {
                    Text(debt.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)

                    HStack(spacing: 6) {
                        PillBadge(text: DebtKind.label(for: debt.kind), color: Theme.primary)
                        if let apr = aprText {
                            PillBadge(text: "%\(apr)", color: Theme.expense)
                        }
                    }

                    if let day = debt.dueDay {
                        HStack(spacing: 5) {
                            Image(systemName: "calendar")
                                .font(.caption2.weight(.semibold))
                            Text("Her ayın \(day). günü ödeme")
                                .font(.caption)
                        }
                        .foregroundStyle(Theme.muted)
                    }
                }

                Spacer(minLength: 8)

                VStack(alignment: .trailing, spacing: 3) {
                    Text("KALAN")
                        .font(.caption2.weight(.semibold))
                        .tracking(0.5)
                        .foregroundStyle(Theme.muted)
                    AmountText(value: debt.balance, color: Theme.ink, size: 19, weight: .bold)
                }
            }

            if debt.paidTotal > 0 {
                progress
            }
        }
        .card(padding: 16)
    }

    /// Ödenen tutarı toplam anapara (kalan + ödenen) içinde gösteren ince ilerleme çubuğu.
    @ViewBuilder private var progress: some View {
        let total = debt.balance + debt.paidTotal
        let ratio = total > 0 ? min(max(debt.paidTotal / total, 0), 1) : 0
        VStack(spacing: 7) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Theme.line.opacity(0.7))
                    Capsule()
                        .fill(Theme.accent)
                        .frame(width: max(geo.size.width * CGFloat(ratio), 6))
                }
            }
            .frame(height: 6)

            HStack(spacing: 4) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.caption2)
                    .foregroundStyle(Theme.accent)
                Text("Ödenen \(Format.money(debt.paidTotal))")
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(Theme.accent)
                Spacer(minLength: 8)
                Text("%\(Int((ratio * 100).rounded())) ödendi")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(Theme.muted)
            }
        }
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
        VStack(spacing: 14) {
            content
        }
        .padding(24)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.bg)
    }
}

// MARK: - Önizleme

#Preview("Borçlar") {
    NavigationStack {
        DebtsView()
    }
}
