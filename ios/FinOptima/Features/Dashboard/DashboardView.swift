import SwiftUI

/// Ana panel: bakiye/gelir/gider/net özet kartları, son işlemler ve yaklaşan
/// ödemeler. `GET /dashboard` verisini `DashboardViewModel` üzerinden okur.
struct DashboardView: View {
    @Environment(AppState.self) private var appState
    @State private var model = DashboardViewModel()

    var body: some View {
        content
            .navigationTitle("Panel")
            .navigationBarTitleDisplayMode(.large)
            .background(Theme.bg.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(role: .destructive) {
                        appState.logout()
                    } label: {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                    }
                    .tint(Theme.destructive)
                    .accessibilityLabel("Çıkış Yap")
                }
            }
            .task { await model.loadIfNeeded() }
    }

    // MARK: - Durum dağıtımı

    @ViewBuilder
    private var content: some View {
        if model.isLoading && model.dashboard == nil {
            loadingView
        } else if let dashboard = model.dashboard {
            loaded(dashboard)
        } else {
            errorView
        }
    }

    private var loadingView: some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text("Panel yükleniyor…")
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var errorView: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 44, weight: .semibold))
                .foregroundStyle(Theme.muted)
            Text(model.errorMessage ?? "Panel yüklenemedi.")
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            Button {
                Task { await model.reload() }
            } label: {
                Label("Tekrar Dene", systemImage: "arrow.clockwise")
            }
            .buttonStyle(.borderedProminent)
            .tint(Theme.primary)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Yüklenmiş içerik

    private func loaded(_ dashboard: Dashboard) -> some View {
        ScrollView {
            VStack(spacing: 16) {
                summaryCards(dashboard)
                if dashboard.trend.contains(where: { $0.income > 0 || $0.expense > 0 }) {
                    trendSection(dashboard.trend)
                }
                if !dashboard.breakdown.isEmpty {
                    breakdownSection(dashboard.breakdown)
                }
                recentSection(dashboard.recent)
                if !dashboard.upcoming.isEmpty {
                    upcomingSection(dashboard.upcoming)
                }
            }
            .padding(16)
        }
        .refreshable { await model.refresh() }
    }

    // MARK: - Özet kartları

    private func summaryCards(_ dashboard: Dashboard) -> some View {
        let netTint: Color = dashboard.net >= 0 ? Theme.income : Theme.expense
        return VStack(spacing: 12) {
            StatCard(
                title: "Toplam Bakiye",
                amount: dashboard.balance,
                icon: "wallet.pass.fill",
                tint: Theme.primary
            )

            HStack(spacing: 12) {
                StatCard(
                    title: "Gelir",
                    amount: dashboard.income,
                    icon: "arrow.down.circle.fill",
                    tint: Theme.income,
                    subtitle: "Bu ay"
                )
                StatCard(
                    title: "Gider",
                    amount: dashboard.expense,
                    icon: "arrow.up.circle.fill",
                    tint: Theme.expense,
                    subtitle: "Bu ay"
                )
            }

            StatCard(
                title: "Net",
                amount: dashboard.net,
                icon: "chart.line.uptrend.xyaxis",
                tint: netTint,
                subtitle: "Bu ay gelir − gider"
            )
        }
    }

    // MARK: - Son işlemler

    private func recentSection(_ transactions: [Transaction]) -> some View {
        SectionCard(title: "Son İşlemler") {
            if transactions.isEmpty {
                EmptyRow(text: "Henüz işlem yok.")
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(transactions.enumerated()), id: \.element.id) { index, tx in
                        if index > 0 {
                            Divider().overlay(Theme.line)
                        }
                        TransactionRow(transaction: tx)
                            .padding(.vertical, 10)
                    }
                }
            }
        }
    }

    // MARK: - Yaklaşan ödemeler

    private func upcomingSection(_ items: [Upcoming]) -> some View {
        SectionCard(title: "Yaklaşan") {
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    if index > 0 {
                        Divider().overlay(Theme.line)
                    }
                    UpcomingRow(item: item)
                        .padding(.vertical, 10)
                }
            }
        }
    }

    // MARK: - 6 aylık trend

    private func trendSection(_ points: [TrendPoint]) -> some View {
        let maxVal = points.flatMap { [$0.income, $0.expense] }.max() ?? 1
        return SectionCard(title: "Gelir & Gider · Son 6 ay") {
            VStack(spacing: 10) {
                HStack(alignment: .bottom, spacing: 10) {
                    ForEach(points) { p in
                        VStack(spacing: 5) {
                            HStack(alignment: .bottom, spacing: 3) {
                                Capsule().fill(Theme.income)
                                    .frame(width: 8, height: barHeight(p.income, maxVal))
                                Capsule().fill(Theme.expense)
                                    .frame(width: 8, height: barHeight(p.expense, maxVal))
                            }
                            Text(monthShort(p.month))
                                .font(.caption2)
                                .foregroundStyle(Theme.muted)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 84, alignment: .bottom)

                HStack(spacing: 16) {
                    legendDot(Theme.income, "Gelir")
                    legendDot(Theme.expense, "Gider")
                }
                .font(.caption2)
                .foregroundStyle(Theme.muted)
            }
        }
    }

    private func legendDot(_ color: Color, _ label: String) -> some View {
        HStack(spacing: 5) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text(label)
        }
    }

    private func barHeight(_ v: Double, _ maxVal: Double) -> CGFloat {
        guard maxVal > 0 else { return 2 }
        return max(2, CGFloat(v / maxVal) * 62)
    }

    private func monthShort(_ ym: String) -> String {
        let months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
        let parts = ym.split(separator: "-")
        if parts.count == 2, let m = Int(parts[1]), m >= 1, m <= 12 { return months[m - 1] }
        return ym
    }

    // MARK: - Kategori dağılımı

    private func breakdownSection(_ items: [Breakdown]) -> some View {
        let total = items.reduce(0) { $0 + $1.total }
        return SectionCard(title: "Harcama dağılımı · Bu ay") {
            VStack(spacing: 12) {
                ForEach(items.prefix(6)) { b in
                    let ratio = total > 0 ? b.total / total : 0
                    VStack(spacing: 6) {
                        HStack(spacing: 8) {
                            Circle().fill(Color(hex: b.color)).frame(width: 9, height: 9)
                            Text(b.name).font(.footnote).foregroundStyle(Theme.ink).lineLimit(1)
                            Spacer(minLength: 8)
                            Text(Format.money(b.total))
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(Theme.ink)
                        }
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(Theme.line)
                                Capsule().fill(Color(hex: b.color))
                                    .frame(width: max(4, geo.size.width * ratio))
                            }
                        }
                        .frame(height: 6)
                    }
                }
            }
        }
    }
}

// MARK: - Bölüm kabı

/// Başlıklı, yüzey renginde, ince kenarlıklı bölüm kartı.
private struct SectionCard<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.headline)
                .foregroundStyle(Theme.ink)
            content
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                .strokeBorder(Theme.line, lineWidth: 1)
        )
    }
}

// MARK: - İşlem satırı

private struct TransactionRow: View {
    let transaction: Transaction

    private var isIncome: Bool { transaction.kind == "INCOME" }

    /// Gider işlemleri eksi işaretli gösterilir.
    private var signedAmount: Double {
        isIncome ? transaction.amount : -transaction.amount
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: isIncome ? "arrow.down.circle.fill" : "arrow.up.circle.fill")
                .font(.title3)
                .foregroundStyle(isIncome ? Theme.income : Theme.expense)

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.description.isEmpty ? "İşlem" : transaction.description)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Text(Format.shortDate(transaction.date))
                    if let category = transaction.category {
                        Text("·")
                        Text(category.name).lineLimit(1)
                    }
                }
                .font(.caption)
                .foregroundStyle(Theme.muted)
            }

            Spacer(minLength: 8)

            AmountText(
                value: signedAmount,
                signed: true,
                color: isIncome ? Theme.income : Theme.expense,
                font: .subheadline
            )
        }
    }
}

// MARK: - Yaklaşan satırı

private struct UpcomingRow: View {
    let item: Upcoming

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "calendar")
                .font(.title3)
                .foregroundStyle(Theme.primary)

            VStack(alignment: .leading, spacing: 2) {
                Text(item.title)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)
                Text(Format.shortDate(item.date))
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
            }

            Spacer(minLength: 8)

            if let amount = item.amount {
                AmountText(value: amount, color: Theme.ink, font: .subheadline)
            }
        }
    }
}

// MARK: - Boş satır

private struct EmptyRow: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.subheadline)
            .foregroundStyle(Theme.muted)
            .frame(maxWidth: .infinity, alignment: .center)
            .padding(.vertical, 8)
    }
}
