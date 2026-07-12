import SwiftUI

// MARK: - AmountText

/// Para tutarı — Space Grotesk display font + tabular rakamlar. `size` puntoyu verir.
struct AmountText: View {
    let value: Double
    var signed: Bool = false
    var color: Color?
    var size: CGFloat = 17
    var weight: Font.Weight = .semibold

    var body: some View {
        Text(signed ? Format.signedMoney(value) : Format.money(value))
            .font(.display(size, weight))
            .monospacedDigit()
            .foregroundStyle(color ?? Theme.ink)
    }
}

// MARK: - PillBadge

/// Yumuşak dolgulu, kapsül biçimli küçük etiket (durum/kategori).
struct PillBadge: View {
    let text: String
    var color: Color = Theme.primary
    var icon: String?

    var body: some View {
        HStack(spacing: 4) {
            if let icon {
                Image(systemName: icon).font(.caption2.weight(.bold))
            }
            Text(text).font(.caption.weight(.semibold))
        }
        .foregroundStyle(color)
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(color.opacity(0.14), in: Capsule())
    }
}

// MARK: - SectionHeader

/// Ekran bölüm başlığı — Space Grotesk, opsiyonel "Tümü" aksiyonu.
struct SectionHeader: View {
    let title: String
    var actionTitle: String?
    var action: (() -> Void)?

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.display(19, .bold))
                .foregroundStyle(Theme.ink)
            Spacer()
            if let actionTitle, let action {
                Button(action: action) {
                    HStack(spacing: 2) {
                        Text(actionTitle)
                        Image(systemName: "chevron.right").font(.caption2.weight(.bold))
                    }
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Theme.primary)
                }
            }
        }
    }
}

// MARK: - StatCard

/// Panel özet kartı: üstte ikon rozeti, başlık + büyük Space Grotesk değer.
struct StatCard: View {
    let title: String
    let value: String
    var icon: String?
    var tint: Color = Theme.primary
    var subtitle: String?

    init(title: String, amount: Double, icon: String? = nil, tint: Color = Theme.primary, subtitle: String? = nil) {
        self.title = title
        self.value = Format.money(amount)
        self.icon = icon
        self.tint = tint
        self.subtitle = subtitle
    }

    init(title: String, value: String, icon: String? = nil, tint: Color = Theme.primary, subtitle: String? = nil) {
        self.title = title
        self.value = value
        self.icon = icon
        self.tint = tint
        self.subtitle = subtitle
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                if let icon {
                    Image(systemName: icon)
                        .font(.footnote.weight(.bold))
                        .foregroundStyle(tint)
                        .frame(width: 30, height: 30)
                        .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                }
                Text(title.uppercased())
                    .font(.caption2.weight(.semibold))
                    .tracking(0.4)
                    .foregroundStyle(Theme.muted)
                    .lineLimit(1)
                Spacer(minLength: 0)
            }

            Text(value)
                .font(.display(23, .bold))
                .monospacedDigit()
                .foregroundStyle(Theme.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.6)

            if let subtitle {
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card(padding: 15)
    }
}

// MARK: - Previews

#Preview("Components") {
    ScrollView {
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                StatCard(title: "Gelir", amount: 18450.75, icon: "arrow.down.circle.fill", tint: Theme.income, subtitle: "Bu ay")
                StatCard(title: "Gider", amount: -9230.40, icon: "arrow.up.circle.fill", tint: Theme.expense, subtitle: "Bu ay")
            }
            SectionHeader(title: "Son İşlemler", actionTitle: "Tümü", action: {})
            HStack(spacing: 8) {
                PillBadge(text: "Gelir", color: Theme.income, icon: "arrow.down")
                PillBadge(text: "Gider", color: Theme.expense, icon: "arrow.up")
            }
            AmountText(value: 1234.56, signed: true, color: Theme.income, size: 20, weight: .bold)
        }
        .padding()
    }
    .background(Theme.bg)
}
