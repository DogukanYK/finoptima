import SwiftUI

/// Ana panel: bakiye hero kartı, gelir/gider/net özetleri, trend & kategori
/// grafikleri, son işlemler ve yaklaşan ödemeler. `GET /dashboard` verisini
/// `DashboardViewModel` üzerinden okur.
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
        VStack(spacing: 18) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 40, weight: .semibold))
                .foregroundStyle(Theme.expense)
                .frame(width: 76, height: 76)
                .background(Theme.expense.opacity(0.12), in: Circle())
            Text(model.errorMessage ?? "Panel yüklenemedi.")
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            Button {
                Haptics.light()
                Task { await model.reload() }
            } label: {
                Label("Tekrar Dene", systemImage: "arrow.clockwise")
                    .font(.subheadline.weight(.semibold))
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(Theme.brandGradient, in: Capsule())
                    .foregroundStyle(.white)
            }
            .buttonStyle(PressableStyle())
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Yüklenmiş içerik

    private func loaded(_ dashboard: Dashboard) -> some View {
        ScrollView {
            VStack(spacing: 18) {
                heroCard(dashboard)
                statsRow(dashboard)
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

    // MARK: - Hero: Toplam Bakiye

    private func heroCard(_ dashboard: Dashboard) -> some View {
        let netValues = dashboard.trend.reduce(into: [Double]()) { acc, p in
            let prev = acc.last ?? 0
            acc.append(prev + (p.income - p.expense))
        }
        return ZStack(alignment: .topTrailing) {
            // Yumuşak ışıltı aksanı
            Circle()
                .fill(Color.white.opacity(0.10))
                .frame(width: 190, height: 190)
                .blur(radius: 6)
                .offset(x: 80, y: -70)
            Circle()
                .fill(Theme.cyan.opacity(0.22))
                .frame(width: 120, height: 120)
                .blur(radius: 30)
                .offset(x: 40, y: 60)

            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 10) {
                    Image(systemName: "wallet.pass.fill")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 34, height: 34)
                        .background(Color.white.opacity(0.16), in: RoundedRectangle(cornerRadius: 11, style: .continuous))
                    Text("Toplam Bakiye")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.white.opacity(0.72))
                    Spacer(minLength: 8)
                    Text("tüm zamanlar net")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.85))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.white.opacity(0.14), in: Capsule())
                }

                AmountText(value: dashboard.balance, color: .white, size: 34, weight: .bold)

                if netValues.count >= 2 {
                    HeroSparkline(values: netValues)
                        .frame(height: 40)
                        .padding(.top, 2)
                }
            }
            .padding(20)
        }
        .background(Theme.darkGradient, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .strokeBorder(Color.white.opacity(0.08), lineWidth: 1)
        )
        .shadow(color: Theme.primary.opacity(0.28), radius: 22, x: 0, y: 12)
    }

    // MARK: - Gelir / Gider / Net

    private func statsRow(_ dashboard: Dashboard) -> some View {
        let netTint: Color = dashboard.net >= 0 ? Theme.income : Theme.expense
        return VStack(spacing: 12) {
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

    // MARK: - 6 aylık trend

    private func trendSection(_ points: [TrendPoint]) -> some View {
        let maxVal = points.flatMap { [$0.income, $0.expense] }.max() ?? 1
        let chartHeight: CGFloat = 108
        let incomeFill = LinearGradient(
            colors: [Theme.income, Theme.income.opacity(0.55)],
            startPoint: .top, endPoint: .bottom
        )
        let expenseFill = LinearGradient(
            colors: [Theme.expense, Theme.expense.opacity(0.55)],
            startPoint: .top, endPoint: .bottom
        )

        return VStack(alignment: .leading, spacing: 16) {
            SectionHeader(title: "Gelir & Gider · Son 6 ay")

            HStack(alignment: .top, spacing: 8) {
                // Y ekseni (Space Grotesk sayılar)
                VStack(alignment: .trailing, spacing: 0) {
                    Text(compactAxis(maxVal)).font(.display(9.5, .medium))
                    Spacer(minLength: 0)
                    Text(compactAxis(maxVal / 2)).font(.display(9.5, .medium))
                    Spacer(minLength: 0)
                    Text("₺0").font(.display(9.5, .medium))
                }
                .foregroundStyle(Theme.muted)
                .frame(width: 40, height: chartHeight, alignment: .trailing)

                // Izgara + çubuklar
                ZStack(alignment: .bottom) {
                    VStack(spacing: 0) {
                        gridline
                        Spacer(minLength: 0)
                        gridline
                        Spacer(minLength: 0)
                        gridline
                    }
                    .frame(height: chartHeight)

                    HStack(alignment: .bottom, spacing: 8) {
                        ForEach(points) { p in
                            HStack(alignment: .bottom, spacing: 5) {
                                bar(p.income, maxVal, chartHeight, incomeFill)
                                bar(p.expense, maxVal, chartHeight, expenseFill)
                            }
                            .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(height: chartHeight, alignment: .bottom)
                }
            }

            // Ay etiketleri (çubuklarla hizalı)
            HStack(spacing: 8) {
                Color.clear.frame(width: 40)
                HStack(spacing: 8) {
                    ForEach(points) { p in
                        Text(monthShort(p.month))
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(Theme.muted)
                            .frame(maxWidth: .infinity)
                    }
                }
            }

            HStack(spacing: 18) {
                legendDot(Theme.income, "Gelir")
                legendDot(Theme.expense, "Gider")
                Spacer()
            }
            .font(.caption2.weight(.medium))
            .foregroundStyle(Theme.muted)
        }
        .card()
    }

    private var gridline: some View {
        Rectangle().fill(Theme.line.opacity(0.6)).frame(height: 1)
    }

    private func bar(_ v: Double, _ maxVal: Double, _ height: CGFloat, _ fill: LinearGradient) -> some View {
        UnevenRoundedRectangle(topLeadingRadius: 5, topTrailingRadius: 5, style: .continuous)
            .fill(fill)
            .frame(width: 11, height: barHeight(v, maxVal, height))
    }

    private func legendDot(_ color: Color, _ label: String) -> some View {
        HStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 2.5, style: .continuous)
                .fill(color)
                .frame(width: 9, height: 9)
            Text(label)
        }
    }

    private func barHeight(_ v: Double, _ maxVal: Double, _ height: CGFloat) -> CGFloat {
        guard maxVal > 0 else { return 3 }
        return max(3, CGFloat(v / maxVal) * height)
    }

    private func monthShort(_ ym: String) -> String {
        let months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
        let parts = ym.split(separator: "-")
        if parts.count == 2, let m = Int(parts[1]), m >= 1, m <= 12 { return months[m - 1] }
        return ym
    }

    /// Eksen için kısaltılmış tutar: "12,5B" / "1,2Mn".
    private func compactAxis(_ v: Double) -> String {
        let a = abs(v)
        func trim(_ x: Double) -> String {
            let s = String(format: "%.1f", x)
            return (s.hasSuffix(".0") ? String(s.dropLast(2)) : s).replacingOccurrences(of: ".", with: ",")
        }
        if a >= 1_000_000 { return "₺" + trim(v / 1_000_000) + "Mn" }
        if a >= 1_000 { return "₺" + trim(v / 1_000) + "B" }
        return "₺" + String(Int(v.rounded()))
    }

    // MARK: - Kategori dağılımı

    private func breakdownSection(_ items: [Breakdown]) -> some View {
        let total = items.reduce(0) { $0 + $1.total }
        return VStack(alignment: .leading, spacing: 16) {
            SectionHeader(title: "Harcama dağılımı · Bu ay")
            VStack(spacing: 14) {
                ForEach(items.prefix(6)) { b in
                    let ratio = total > 0 ? b.total / total : 0
                    let color = Color(hex: b.color)
                    HStack(spacing: 12) {
                        Image(systemName: categorySymbol(b.icon))
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(color)
                            .frame(width: 36, height: 36)
                            .background(color.opacity(0.14), in: RoundedRectangle(cornerRadius: 11, style: .continuous))

                        VStack(alignment: .leading, spacing: 7) {
                            HStack(spacing: 8) {
                                Text(b.name)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(Theme.ink)
                                    .lineLimit(1)
                                Spacer(minLength: 8)
                                AmountText(value: b.total, color: Theme.ink, size: 14, weight: .semibold)
                            }
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    Capsule().fill(Theme.line.opacity(0.7))
                                    Capsule()
                                        .fill(LinearGradient(
                                            colors: [color, color.opacity(0.6)],
                                            startPoint: .leading, endPoint: .trailing
                                        ))
                                        .frame(width: max(6, geo.size.width * ratio))
                                }
                            }
                            .frame(height: 7)
                        }
                    }
                }
            }
        }
        .card()
    }

    // MARK: - Son işlemler

    private func recentSection(_ transactions: [Transaction]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Son İşlemler")
            VStack(spacing: 0) {
                if transactions.isEmpty {
                    EmptyRow(text: "Henüz işlem yok.")
                } else {
                    ForEach(Array(transactions.enumerated()), id: \.element.id) { index, tx in
                        if index > 0 {
                            Divider().overlay(Theme.line).padding(.leading, 52)
                        }
                        TransactionRow(transaction: tx)
                            .padding(.vertical, 11)
                    }
                }
            }
            .card(padding: 14)
        }
    }

    // MARK: - Yaklaşan ödemeler

    private func upcomingSection(_ items: [Upcoming]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            SectionHeader(title: "Yaklaşan")
            VStack(spacing: 0) {
                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                    if index > 0 {
                        Divider().overlay(Theme.line).padding(.leading, 52)
                    }
                    UpcomingRow(item: item)
                        .padding(.vertical, 11)
                }
            }
            .card(padding: 14)
        }
    }
}

// MARK: - Hero sparkline (kümülatif net)

/// Beyaz, yumuşak alan dolgulu mini çizgi grafiği (hero kartı için).
private struct HeroSparkline: View {
    let values: [Double]

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let minV = values.min() ?? 0
            let maxV = values.max() ?? 1
            let range = max(maxV - minV, 0.0001)
            let pts: [CGPoint] = values.enumerated().map { i, v in
                let x = values.count > 1 ? w * CGFloat(i) / CGFloat(values.count - 1) : 0
                let y = h - CGFloat((v - minV) / range) * (h - 4) - 2
                return CGPoint(x: x, y: y)
            }
            ZStack {
                Path { p in
                    guard let first = pts.first else { return }
                    p.move(to: CGPoint(x: first.x, y: h))
                    p.addLine(to: first)
                    for pt in pts.dropFirst() { p.addLine(to: pt) }
                    if let last = pts.last { p.addLine(to: CGPoint(x: last.x, y: h)) }
                    p.closeSubpath()
                }
                .fill(LinearGradient(
                    colors: [Color.white.opacity(0.30), Color.white.opacity(0)],
                    startPoint: .top, endPoint: .bottom
                ))

                Path { p in
                    guard let first = pts.first else { return }
                    p.move(to: first)
                    for pt in pts.dropFirst() { p.addLine(to: pt) }
                }
                .stroke(Color.white.opacity(0.92), style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))

                if let last = pts.last {
                    Circle()
                        .fill(Color.white)
                        .frame(width: 6, height: 6)
                        .position(last)
                }
            }
        }
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

    private var tint: Color { isIncome ? Theme.income : Theme.expense }

    private var symbol: String {
        if let icon = transaction.category?.icon, !icon.isEmpty {
            return categorySymbol(icon)
        }
        return isIncome ? "arrow.down" : "arrow.up"
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: symbol)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 40, height: 40)
                .background(tint.opacity(0.14), in: Circle())

            VStack(alignment: .leading, spacing: 3) {
                Text(transaction.description.isEmpty ? "İşlem" : transaction.description)
                    .font(.subheadline.weight(.semibold))
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
                color: tint,
                size: 16,
                weight: .bold
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
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Theme.primary)
                .frame(width: 40, height: 40)
                .background(Theme.primary.opacity(0.14), in: Circle())

            VStack(alignment: .leading, spacing: 3) {
                Text(item.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)
                Text(Format.shortDate(item.date))
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
            }

            Spacer(minLength: 8)

            if let amount = item.amount {
                AmountText(value: amount, color: Theme.ink, size: 15, weight: .semibold)
            }
        }
    }
}

// MARK: - Boş satır

private struct EmptyRow: View {
    let text: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "tray")
                .font(.system(size: 26, weight: .regular))
                .foregroundStyle(Theme.muted.opacity(0.7))
            Text(text)
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.vertical, 18)
    }
}

// MARK: - Kategori ikonu eşlemesi

/// Web tarafı lucide ikon adlarını geçerli SF Symbol'lara çevirir (bilinmeyende "tag.fill").
private func categorySymbol(_ lucide: String) -> String {
    switch lucide {
    case "shopping-cart": return "cart.fill"
    case "shopping-bag": return "bag.fill"
    case "utensils": return "fork.knife"
    case "bus": return "bus.fill"
    case "fuel": return "fuelpump.fill"
    case "receipt": return "doc.plaintext.fill"
    case "repeat": return "arrow.triangle.2.circlepath"
    case "home": return "house.fill"
    case "heart-pulse": return "heart.fill"
    case "shirt": return "tshirt.fill"
    case "party-popper": return "party.popper.fill"
    case "graduation-cap": return "graduationcap.fill"
    case "plane": return "airplane"
    case "circle-ellipsis": return "ellipsis.circle.fill"
    case "wallet": return "wallet.pass.fill"
    case "trending-up": return "chart.line.uptrend.xyaxis"
    case "trending-down": return "chart.line.downtrend.xyaxis"
    case "credit-card": return "creditcard.fill"
    case "piggy-bank": return "banknote.fill"
    case "gift": return "gift.fill"
    case "briefcase": return "briefcase.fill"
    case "smartphone": return "iphone"
    case "tag": return "tag.fill"
    default: return "tag.fill"
    }
}
