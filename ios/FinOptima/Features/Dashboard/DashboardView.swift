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
