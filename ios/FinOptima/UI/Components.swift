import SwiftUI

// MARK: - AmountText

/// Tabular (monospaced) rakamlarla para tutarı. Renk verilmezse Theme.ink.
struct AmountText: View {
    let value: Double
    var signed: Bool = false
    var color: Color?
    var font: Font = .body
    var weight: Font.Weight = .semibold

    var body: some View {
        Text(signed ? Format.signedMoney(value) : Format.money(value))
            .font(font.weight(weight))
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
                Image(systemName: icon)
                    .font(.caption2.weight(.bold))
            }
            Text(text)
                .font(.caption.weight(.semibold))
        }
        .foregroundStyle(color)
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(color.opacity(0.12), in: Capsule())
    }
}

// MARK: - StatCard

/// Panel özet kartı: başlık + büyük değer, opsiyonel ikon/alt başlık.
struct StatCard: View {
    let title: String
    let value: String
    var icon: String?
    var tint: Color = Theme.primary
    var subtitle: String?

    /// Double tutar için kolaylık başlatıcı — değeri ₺ biçiminde gösterir.
    init(title: String,
         amount: Double,
         icon: String? = nil,
         tint: Color = Theme.primary,
         subtitle: String? = nil) {
        self.title = title
        self.value = Format.money(amount)
        self.icon = icon
        self.tint = tint
        self.subtitle = subtitle
    }

    init(title: String,
         value: String,
         icon: String? = nil,
         tint: Color = Theme.primary,
         subtitle: String? = nil) {
        self.title = title
        self.value = value
        self.icon = icon
        self.tint = tint
        self.subtitle = subtitle
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(Theme.muted)
                Spacer(minLength: 8)
                if let icon {
                    Image(systemName: icon)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(tint)
                        .padding(6)
                        .background(tint.opacity(0.12), in: Circle())
                }
            }

            Text(value)
                .font(.title2.weight(.bold))
                .monospacedDigit()
                .foregroundStyle(Theme.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)

            if let subtitle {
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
            }
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

// MARK: - Previews

#Preview("Components") {
    ScrollView {
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                StatCard(title: "Gelir", amount: 18450.75, icon: "arrow.down.circle.fill", tint: Theme.income)
                StatCard(title: "Gider", amount: -9230.40, icon: "arrow.up.circle.fill", tint: Theme.expense)
            }

            StatCard(title: "Net Bakiye", amount: 9220.35, icon: "wallet.pass.fill", subtitle: "Bu ay")

            HStack(spacing: 8) {
                PillBadge(text: "Gelir", color: Theme.income, icon: "arrow.down")
                PillBadge(text: "Gider", color: Theme.expense, icon: "arrow.up")
                PillBadge(text: "Beklemede")
            }

            VStack(alignment: .leading, spacing: 8) {
                AmountText(value: 1234.56, font: .title3)
                AmountText(value: 1234.56, signed: true, color: Theme.income, font: .headline)
                AmountText(value: -980.00, signed: true, color: Theme.expense, font: .headline)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
    }
    .background(Theme.bg)
}
