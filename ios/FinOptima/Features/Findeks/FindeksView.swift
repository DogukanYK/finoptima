//
//  FindeksView.swift
//  FinOptima
//
//  Findeks sekmesi: dairesel skor göstergesi (ScoreGauge) + band + skoru
//  besleyen faktörler ve öneriler. Veri `FindeksViewModel` üzerinden
//  `GET /findeks` ile gelir. Standart SwiftUI (ScrollView/List), Türkçe UI.
//

import SwiftUI

struct FindeksView: View {
    @State private var vm = FindeksViewModel()

    var body: some View {
        content
            .navigationTitle("Findeks")
            .navigationBarTitleDisplayMode(.large)
            .background(Theme.bg.ignoresSafeArea())
            .task { await vm.loadIfNeeded() }
    }

    @ViewBuilder
    private var content: some View {
        switch vm.state {
        case .idle, .loading:
            loadingView
        case .failed(let message):
            errorView(message)
        case .loaded(let data):
            loadedView(data)
        }
    }

    // MARK: - Durum görünümleri

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
            Text("Findeks bilgileri yükleniyor…")
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40, weight: .semibold))
                .foregroundStyle(Theme.destructive)
            Text("Bir sorun oluştu")
                .font(.headline)
                .foregroundStyle(Theme.ink)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            Button {
                Task { await vm.load() }
            } label: {
                Label("Tekrar Dene", systemImage: "arrow.clockwise")
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func loadedView(_ data: FindeksResponse) -> some View {
        ScrollView {
            VStack(spacing: 20) {
                ScoreGauge(
                    score: headlineScore(data),
                    band: headlineBand(data),
                    caption: data.hasReport ? "Findeks Kredi Notu" : "Tahmini Findeks Notu",
                    isEstimated: !data.hasReport
                )

                if let note = statusNote(data) {
                    InfoNote(text: note, isEstimated: !data.hasReport)
                }

                healthCard(data.estimated)

                if let coach = data.coach {
                    section(title: "AI Koç Planı", icon: "sparkles") {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(coach.plan.summary)
                                .font(.subheadline)
                                .foregroundStyle(Theme.muted)
                            ForEach(coach.plan.steps) { step in
                                CoachStepCard(step: step)
                            }
                        }
                    }
                }

                if !data.estimated.factors.isEmpty {
                    section(title: "Skoru Etkileyen Faktörler", icon: "list.bullet.rectangle") {
                        VStack(spacing: 12) {
                            ForEach(data.estimated.factors, id: \.key) { factor in
                                FactorRow(factor: factor)
                            }
                        }
                    }
                }

                if !data.estimated.advice.isEmpty {
                    section(title: "Öneriler", icon: "lightbulb") {
                        VStack(spacing: 12) {
                            ForEach(Array(data.estimated.advice.enumerated()), id: \.offset) { _, advice in
                                AdviceCard(advice: advice)
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .refreshable { await vm.load() }
    }

    // MARK: - Bölüm sarmalayıcı

    @ViewBuilder
    private func section<Content: View>(
        title: String,
        icon: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(Theme.primary)
                    .frame(width: 30, height: 30)
                    .background(Theme.primarySoft, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                Text(title)
                    .font(.display(19, .bold))
                    .foregroundStyle(Theme.ink)
                Spacer(minLength: 0)
            }
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func healthCard(_ estimate: FindeksEstimate) -> some View {
        let ratio = min(max(Double(estimate.healthScore) / 100, 0), 1)
        let tint = FindeksPalette.color(forRatio: ratio)
        return VStack(alignment: .leading, spacing: 16) {
            HStack(spacing: 12) {
                Image(systemName: "heart.text.square.fill")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(tint)
                    .frame(width: 42, height: 42)
                    .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                VStack(alignment: .leading, spacing: 2) {
                    Text("Finansal Sağlık")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                    Text("Genel finansal durumun")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                }
                Spacer(minLength: 8)

                HStack(alignment: .firstTextBaseline, spacing: 1) {
                    Text("\(estimate.healthScore)")
                        .font(.display(30, .bold))
                        .monospacedDigit()
                        .foregroundStyle(tint)
                    Text("/100")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Theme.muted)
                }
            }
            MeterBar(ratio: ratio, tint: tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    // MARK: - Yardımcılar

    private func headlineScore(_ data: FindeksResponse) -> Int {
        data.hasReport ? data.score : data.estimated.estimatedScore
    }

    private func headlineBand(_ data: FindeksResponse) -> String {
        let band = data.hasReport ? data.band : data.estimated.band
        return band.isEmpty ? "—" : band
    }

    private func statusNote(_ data: FindeksResponse) -> String? {
        if data.hasReport {
            if let date = data.reportDate, !date.isEmpty {
                return "Rapor tarihi: \(Format.longDate(date))"
            }
            return nil
        }
        return "Henüz resmi Findeks raporunuz yok. Aşağıdaki not, finansal verilerinize göre tahmin edilmiştir."
    }
}

// MARK: - Bilgi notu

private struct InfoNote: View {
    let text: String
    var isEstimated: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: isEstimated ? "info.circle" : "calendar")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(isEstimated ? FindeksPalette.amber : Theme.primary)
            Text(text)
                .font(.footnote)
                .foregroundStyle(Theme.muted)
            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            (isEstimated ? FindeksPalette.amber : Theme.primary).opacity(0.08),
            in: RoundedRectangle(cornerRadius: Theme.controlRadius, style: .continuous)
        )
    }
}

// MARK: - AI Koç adım kartı

private struct CoachStepCard: View {
    let step: CoachStep

    private var priorityColor: Color {
        switch step.priority {
        case "high": return Theme.destructive
        case "medium": return Theme.primary
        default: return Theme.muted
        }
    }
    private var priorityLabel: String {
        switch step.priority {
        case "high": return "Yüksek öncelik"
        case "medium": return "Orta öncelik"
        default: return "Düşük öncelik"
        }
    }
    private var priorityIcon: String {
        switch step.priority {
        case "high": return "flame.fill"
        case "medium": return "bolt.fill"
        default: return "leaf.fill"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                PillBadge(text: priorityLabel, color: priorityColor, icon: priorityIcon)
                Spacer(minLength: 0)
            }

            Text(step.title)
                .font(.display(17, .semibold))
                .foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(step.action)
                .font(.subheadline)
                .foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
            Text(step.why)
                .font(.caption)
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 5) {
                Image(systemName: "arrow.up.right.circle.fill").font(.caption)
                Text(step.impact).font(.caption.weight(.semibold))
            }
            .foregroundStyle(Theme.accent)
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(Theme.accentSoft, in: Capsule())
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card(padding: 14)
    }
}

// MARK: - Faktör satırı

private struct FactorRow: View {
    let factor: FindeksFactor

    private var ratio: Double {
        min(max(Double(factor.score) / 100, 0), 1)
    }

    private var tint: Color { FindeksPalette.color(forRatio: ratio) }

    private var weightText: String {
        let percent = factor.weight <= 1 ? factor.weight * 100 : factor.weight
        return "Ağırlık %\(Int(percent.rounded()))"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text(factor.label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.ink)
                Spacer(minLength: 8)
                Text("\(factor.score)")
                    .font(.display(19, .bold))
                    .monospacedDigit()
                    .foregroundStyle(tint)
            }

            MeterBar(ratio: ratio, tint: tint)

            HStack(alignment: .top, spacing: 8) {
                PillBadge(text: weightText, color: Theme.muted)

                if !factor.detail.isEmpty {
                    Text(factor.detail)
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card(padding: 14)
    }
}

// MARK: - Öneri kartı

private struct AdviceCard: View {
    let advice: FindeksAdvice

    private var color: Color {
        switch advice.severity.lowercased() {
        case "high", "critical", "error", "danger", "yüksek", "kritik":
            return Theme.destructive
        case "medium", "warning", "warn", "orta", "uyarı":
            return FindeksPalette.amber
        case "good", "success", "positive", "iyi", "olumlu":
            return Theme.accent
        default:
            return Theme.primary
        }
    }

    private var icon: String {
        switch advice.severity.lowercased() {
        case "high", "critical", "error", "danger", "yüksek", "kritik":
            return "exclamationmark.triangle.fill"
        case "medium", "warning", "warn", "orta", "uyarı":
            return "exclamationmark.circle.fill"
        case "good", "success", "positive", "iyi", "olumlu":
            return "checkmark.circle.fill"
        default:
            return "lightbulb.fill"
        }
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.body.weight(.semibold))
                .foregroundStyle(color)
                .frame(width: 34, height: 34)
                .background(color.opacity(0.14), in: Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(advice.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                if !advice.body.isEmpty {
                    Text(advice.body)
                        .font(.footnote)
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 0)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card(padding: 14)
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                .strokeBorder(color.opacity(0.35), lineWidth: 1)
        )
    }
}

// MARK: - Yatay ölçek çubuğu

private struct MeterBar: View {
    let ratio: Double
    var tint: Color = Theme.primary

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Theme.line.opacity(0.55))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [tint.opacity(0.7), tint],
                            startPoint: .leading, endPoint: .trailing
                        )
                    )
                    .frame(width: max(8, geo.size.width * min(max(ratio, 0), 1)))
                    .shadow(color: tint.opacity(0.35), radius: 4, x: 0, y: 2)
            }
        }
        .frame(height: 10)
    }
}

// MARK: - Önizleme

#Preview("Findeks") {
    NavigationStack {
        FindeksView()
    }
}
