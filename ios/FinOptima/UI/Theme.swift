import SwiftUI

// MARK: - Color(hex:)

extension Color {
    /// "#2563EB", "2563EB", "RGB" (3), or "AARRGGBB" (8) — sırayla ARGB.
    init(hex: String) {
        let cleaned = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)

        let a, r, g, b: UInt64
        switch cleaned.count {
        case 3: // RGB (4-bit)
            (a, r, g, b) = (255,
                            (value >> 8 & 0xF) * 17,
                            (value >> 4 & 0xF) * 17,
                            (value & 0xF) * 17)
        case 6: // RRGGBB (8-bit)
            (a, r, g, b) = (255,
                            value >> 16 & 0xFF,
                            value >> 8 & 0xFF,
                            value & 0xFF)
        case 8: // AARRGGBB (8-bit)
            (a, r, g, b) = (value >> 24 & 0xFF,
                            value >> 16 & 0xFF,
                            value >> 8 & 0xFF,
                            value & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }

        self.init(.sRGB,
                  red: Double(r) / 255,
                  green: Double(g) / 255,
                  blue: Double(b) / 255,
                  opacity: Double(a) / 255)
    }

    /// Aydınlık/karanlık moda göre çözümlenen dinamik renk.
    init(light: String, dark: String) {
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(Color(hex: dark))
                : UIColor(Color(hex: light))
        })
    }
}

// MARK: - Palette

/// FinOptima renk paleti — web ile aynı ton. Işıklı değerler spec'ten; karanlık
/// için sistem yüzeyleriyle uyumlu koyu tonlar. primary/accent/destructive her iki
/// modda sabit marka renkleri kalır.
enum Theme {
    static let primary = Color(hex: "2563EB")
    static let accent = Color(hex: "059669")
    static let destructive = Color(hex: "DC2626")

    static let bg = Color(light: "F8FAFC", dark: "0B1120")
    static let surface = Color(light: "FFFFFF", dark: "1E293B")
    static let ink = Color(light: "0F172A", dark: "F1F5F9")
    static let muted = Color(light: "64748B", dark: "94A3B8")
    static let line = Color(light: "E2E8F0", dark: "334155")

    static let cyan = Color(hex: "0EA5E9")

    // Anlam renkleri (gelir yeşil / gider kırmızı).
    static let income = accent
    static let expense = destructive

    // Genişletilmiş yüzeyler / yumuşak zeminler.
    static let surface2 = Color(light: "F1F5F9", dark: "162032")
    static let primarySoft = Color(light: "EAF1FE", dark: "1B2A4A")
    static let accentSoft = Color(light: "E7F6F0", dark: "13312A")

    // Marka gradyanları.
    static let brandGradient = LinearGradient(
        colors: [Color(hex: "2563EB"), Color(hex: "0EA5E9")],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )
    static let darkGradient = LinearGradient(
        colors: [Color(hex: "0F172A"), Color(hex: "172554")],
        startPoint: .topLeading, endPoint: .bottomTrailing
    )

    // Ortak ölçüler.
    static let cardRadius: CGFloat = 20
    static let controlRadius: CGFloat = 14
}

// MARK: - Tipografi (Space Grotesk display)

extension Font {
    /// Space Grotesk — başlıklar ve sayılar için ayırt edici display font
    /// (web ile aynı kimlik). Font yüklenemezse sisteme düşer.
    static func display(_ size: CGFloat, _ weight: Font.Weight = .bold) -> Font {
        .custom("Space Grotesk", size: size).weight(weight)
    }
}

// MARK: - Kart stili

private struct CardModifier: ViewModifier {
    var padding: CGFloat
    var radius: CGFloat
    var elevated: Bool
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(Theme.line.opacity(0.7), lineWidth: 1)
            )
            .shadow(color: .black.opacity(elevated ? 0.07 : 0.04), radius: elevated ? 16 : 8, x: 0, y: elevated ? 8 : 3)
    }
}

extension View {
    /// Yüzey renginde, yuvarlak köşeli, yumuşak gölgeli kart.
    func card(padding: CGFloat = 16, radius: CGFloat = Theme.cardRadius, elevated: Bool = true) -> some View {
        modifier(CardModifier(padding: padding, radius: radius, elevated: elevated))
    }
}

// MARK: - Bas-küçül etkileşimi

/// Basınca hafifçe küçülen, yaylı geri dönen dokunma stili (tactile fintech).
struct PressableStyle: ButtonStyle {
    var scale: CGFloat = 0.97
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? scale : 1)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Haptik

enum Haptics {
    static func light() { UIImpactFeedbackGenerator(style: .light).impactOccurred() }
    static func soft() { UIImpactFeedbackGenerator(style: .soft).impactOccurred() }
    static func success() { UINotificationFeedbackGenerator().notificationOccurred(.success) }
}

// MARK: - Formatting

/// Para ve tarih biçimlendirme yardımcıları (tr_TR).
enum Format {

    // Grouping "." / decimal "," — çıktının başına manuel "₺".
    private static let decimal: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.locale = Locale(identifier: "tr_TR")
        f.minimumFractionDigits = 2
        f.maximumFractionDigits = 2
        return f
    }()

    // "YYYY-MM-DD" ayrıştırıcı — sabit, konumdan bağımsız.
    private static let isoDay: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "Europe/Istanbul")
        return f
    }()

    private static let dayMonth: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "tr_TR")
        f.setLocalizedDateFormatFromTemplate("d MMM")
        return f
    }()

    private static let dayMonthYear: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "tr_TR")
        f.setLocalizedDateFormatFromTemplate("d MMM yyyy")
        return f
    }()

    /// 1234.56 → "₺1.234,56" (negatifte "-₺1.234,56").
    static func money(_ value: Double) -> String {
        let magnitude = decimal.string(from: NSNumber(value: abs(value))) ?? "0,00"
        let sign = value < 0 ? "-" : ""
        return "\(sign)₺\(magnitude)"
    }

    /// İşaretli tutar: pozitifte "+₺…", negatifte "-₺…".
    static func signedMoney(_ value: Double) -> String {
        value > 0 ? "+" + money(value) : money(value)
    }

    /// "2026-07-09" → "9 Tem". Ayrıştırılamazsa girdi aynen döner.
    static func shortDate(_ isoDate: String) -> String {
        guard let date = isoDay.date(from: isoDate) else { return isoDate }
        return dayMonth.string(from: date)
    }

    /// "2026-07-09" → "9 Tem 2026". Ayrıştırılamazsa girdi aynen döner.
    static func longDate(_ isoDate: String) -> String {
        guard let date = isoDay.date(from: isoDate) else { return isoDate }
        return dayMonthYear.string(from: date)
    }
}
