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
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundStyle(Theme.ink)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func healthCard(_ estimate: FindeksEstimate) -> some View {
        let ratio = min(max(Double(estimate.healthScore) / 100, 0), 1)
        return VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Finansal Sağlık")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.ink)
                Spacer()
                Text("\(estimate.healthScore)/100")
                    .font(.subheadline.weight(.bold))
                    .monospacedDigit()
                    .foregroundStyle(FindeksPalette.color(forRatio: ratio))
            }
            MeterBar(ratio: ratio, tint: FindeksPalette.color(forRatio: ratio))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                .strokeBorder(Theme.line, lineWidth: 1)
        )
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

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(priorityLabel)
                .font(.caption2.weight(.bold))
                .foregroundStyle(priorityColor)
                .padding(.horizontal, 8).padding(.vertical, 3)
                .background(priorityColor.opacity(0.12), in: Capsule())

            Text(step.title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(Theme.ink)
            Text(step.action)
                .font(.footnote)
                .foregroundStyle(Theme.ink)
            Text(step.why)
                .font(.caption)
                .foregroundStyle(Theme.muted)
            HStack(spacing: 5) {
                Image(systemName: "arrow.up.right").font(.caption2)
                Text(step.impact)
            }
            .font(.caption.weight(.medium))
            .foregroundStyle(Theme.accent)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
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
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(factor.label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.ink)
                Spacer(minLength: 8)
                Text("\(factor.score)")
                    .font(.subheadline.weight(.bold))
                    .monospacedDigit()
                    .foregroundStyle(tint)
            }

            MeterBar(ratio: ratio, tint: tint)

            HStack(alignment: .top, spacing: 8) {
                Text(weightText)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(Theme.muted)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Theme.line.opacity(0.6), in: Capsule())

                if !factor.detail.isEmpty {
                    Text(factor.detail)
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 0)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                .strokeBorder(Theme.line, lineWidth: 1)
        )
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
                .frame(width: 28, height: 28)
                .background(color.opacity(0.12), in: Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(advice.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.ink)
                if !advice.body.isEmpty {
                    Text(advice.body)
                        .font(.footnote)
                        .foregroundStyle(Theme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
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
                    .fill(Theme.line)
                Capsule()
                    .fill(tint)
                    .frame(width: max(0, geo.size.width * min(max(ratio, 0), 1)))
            }
        }
        .frame(height: 8)
    }
}

// MARK: - Önizleme

#Preview("Findeks") {
    NavigationStack {
        FindeksView()
    }
}
