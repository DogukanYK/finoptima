//
//  ScoreGauge.swift
//  FinOptima
//
//  Findeks kredi notu için dairesel (yarım-üstü açık, 270°) gösterge. Koyu bir
//  kart içinde çizilir: alttaki iz yayı + skora göre kırpılmış (trim) renkli yay,
//  ortada büyük skor ve band rozeti. Çizim SwiftUI `Shape` (arc) + `trim` ile
//  yapılır; force-unwrap yoktur.
//

import SwiftUI

// MARK: - Yay şekli (270°, altta boşluk)

/// Saat 7 hizasından başlayıp saat 5 hizasında biten 270°'lik yay.
/// `trim(from:to:)` ile ilerleme (skor) kadarı doldurulur.
private struct GaugeArc: Shape {
    var startAngle: Angle = .degrees(135)
    var sweep: Angle = .degrees(270)

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let radius = min(rect.width, rect.height) / 2
        let center = CGPoint(x: rect.midX, y: rect.midY)
        path.addArc(
            center: center,
            radius: radius,
            startAngle: startAngle,
            endAngle: startAngle + sweep,
            clockwise: false
        )
        return path
    }
}

// MARK: - Skor → renk

/// Findeks/oransal skorları renklere eşler (kırmızı → amber → mavi → yeşil).
enum FindeksPalette {
    static let amber = Color(hex: "F59E0B")

    /// 0...1 aralığındaki orana göre gösterge/rozet rengi.
    static func color(forRatio ratio: Double) -> Color {
        switch ratio {
        case ..<0.30: return Theme.destructive
        case ..<0.50: return amber
        case ..<0.72: return Theme.primary
        default:       return Theme.accent
        }
    }
}

// MARK: - ScoreGauge

/// Koyu kart içinde dairesel skor göstergesi.
///
/// - `score` / `band`: gösterilecek not ve band metni.
/// - `minValue`...`maxValue`: yay ölçeği (varsayılan Findeks 1–1900).
/// - `caption`: göstergenin üstündeki küçük başlık.
/// - `isEstimated`: tahmini skor için "Tahmini" rozeti gösterir.
struct ScoreGauge: View {
    let score: Int
    let band: String
    var minValue: Double = 1
    var maxValue: Double = 1900
    var caption: String? = nil
    var isEstimated: Bool = false

    private let lineWidth: CGFloat = 16

    /// Animasyon 0'dan başlasın diye görünümde tetiklenir.
    @State private var isAnimated = false

    private var ratio: Double {
        let span = maxValue - minValue
        guard span > 0 else { return 0 }
        return min(max((Double(score) - minValue) / span, 0), 1)
    }

    private var tint: Color { FindeksPalette.color(forRatio: ratio) }

    private var displayRatio: Double { isAnimated ? ratio : 0 }

    var body: some View {
        VStack(spacing: 16) {
            header
            gauge
            scaleLabels
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(cardBackground)
        .clipShape(RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
        .onAppear { isAnimated = true }
    }

    // MARK: Alt parçalar

    private var header: some View {
        HStack(spacing: 8) {
            if let caption {
                Label(caption, systemImage: "gauge.with.needle")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color(hex: "CBD5E1"))
            }
            Spacer(minLength: 8)
            if isEstimated {
                Text("Tahmini")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(FindeksPalette.amber)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(FindeksPalette.amber.opacity(0.18), in: Capsule())
            }
        }
    }

    private var gauge: some View {
        ZStack {
            GaugeArc()
                .stroke(
                    Color.white.opacity(0.12),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )

            GaugeArc()
                .trim(from: 0, to: displayRatio)
                .stroke(
                    tint,
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
                .animation(.easeOut(duration: 0.85), value: displayRatio)

            centerContent
                .padding(lineWidth + 6)
        }
        .padding(lineWidth / 2)
        .frame(height: 200)
    }

    private var centerContent: some View {
        VStack(spacing: 8) {
            Text("\(score)")
                .font(.system(size: 46, weight: .bold, design: .rounded))
                .monospacedDigit()
                .foregroundStyle(.white)
                .lineLimit(1)
                .minimumScaleFactor(0.6)

            Text(band)
                .font(.callout.weight(.semibold))
                .foregroundStyle(tint)
                .padding(.horizontal, 12)
                .padding(.vertical, 5)
                .background(tint.opacity(0.18), in: Capsule())
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
    }

    private var scaleLabels: some View {
        HStack {
            Text("\(Int(minValue))")
            Spacer()
            Text("\(Int(maxValue))")
        }
        .font(.caption2.weight(.medium))
        .monospacedDigit()
        .foregroundStyle(Color(hex: "64748B"))
        .padding(.horizontal, 4)
    }

    /// Temadan bağımsız sabit koyu (lacivert) arka plan.
    private var cardBackground: some View {
        LinearGradient(
            colors: [Color(hex: "17233B"), Color(hex: "0B1120")],
            startPoint: .top,
            endPoint: .bottom
        )
    }
}

// MARK: - Önizleme

#Preview("ScoreGauge") {
    ScrollView {
        VStack(spacing: 16) {
            ScoreGauge(score: 1620, band: "Çok İyi", caption: "Findeks Kredi Notu")
            ScoreGauge(score: 940, band: "Orta Riskli", caption: "Tahmini Findeks Notu", isEstimated: true)
            ScoreGauge(score: 320, band: "Çok Riskli", caption: "Findeks Kredi Notu")
        }
        .padding()
    }
    .background(Theme.bg)
}
