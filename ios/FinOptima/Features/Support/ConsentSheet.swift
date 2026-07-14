import SwiftUI

// MARK: - Kapsam

/// Destek ekibine geçici olarak açılabilen veri kapsamları.
/// Ham değerler backend ile birebir aynı (`scopes` dizisi).
enum SupportConsentScope: String, CaseIterable, Identifiable {
    case dashboard = "dashboard"
    case transactions = "transactions"
    case debts = "debts"
    case findeks = "findeks"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .dashboard: return "Panel özeti"
        case .transactions: return "Son işlemler"
        case .debts: return "Borçlar"
        case .findeks: return "Findeks notu"
        }
    }

    var detail: String {
        switch self {
        case .dashboard: return "Aylık gelir, gider ve bakiye özetin"
        case .transactions: return "Son işlemlerinin tarih, tutar ve açıklaması"
        case .debts: return "Kayıtlı borçların ve taksit planların"
        case .findeks: return "Findeks kredi notun ve geçmişi"
        }
    }

    var icon: String {
        switch self {
        case .dashboard: return "square.grid.2x2.fill"
        case .transactions: return "arrow.left.arrow.right"
        case .debts: return "creditcard.fill"
        case .findeks: return "gauge.medium"
        }
    }

    /// Ham backend değeri → Türkçe etiket (bilinmeyen değer aynen döner).
    static func label(for raw: String) -> String {
        SupportConsentScope(rawValue: raw)?.label ?? raw
    }
}

// MARK: - Tarih biçimlendirme

/// İzin zaman damgaları (ISO) → "14 Tem 2026 18:30".
enum ConsentFormat {
    private static let isoFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let isoPlain = ISO8601DateFormatter()

    private static let display: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "tr_TR")
        f.dateFormat = "d MMM yyyy HH:mm"
        return f
    }()

    /// Ayrıştırılamazsa girdi aynen döner.
    static func dateTime(_ iso: String) -> String {
        guard let date = isoFractional.date(from: iso) ?? isoPlain.date(from: iso) else { return iso }
        return display.string(from: date)
    }
}

// MARK: - İzin sayfası

/// Veri erişim izni formu — kapsam seçimi + süre. Varsayılan olarak hiçbir kapsam
/// açık değildir; kullanıcı seçmeden "İzin Ver" pasiftir.
struct ConsentSheet: View {
    /// İzni kaydeder (süre + kapsamlar) ve talebi yeniden yükler — hata fırlatır.
    let onGrant: (Int, [String]) async throws -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var selected: Set<SupportConsentScope> = []
    @State private var hours = 24
    @State private var saving = false
    @State private var errorMessage: String?

    private static let hourOptions = [24, 48, 72]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    intro
                    scopeCard
                    durationCard
                    if let errorMessage {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(Theme.destructive)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    grantButton
                    kvkkNote
                }
                .padding(16)
            }
            .background(Theme.bg.ignoresSafeArea())
            .navigationTitle("Veri Erişim İzni")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Vazgeç") { dismiss() }
                }
            }
        }
    }

    // MARK: - Bölümler

    private var intro: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "hand.raised.fill")
                .font(.footnote.weight(.bold))
                .foregroundStyle(Theme.primary)
                .frame(width: 32, height: 32)
                .background(Theme.primarySoft, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            Text("Destek ekibi varsayılan olarak yalnızca hesap özetini görür — tutarlarını, işlemlerini ve borçlarını göremez. İstersen seçtiğin kapsamlarda, seçtiğin süre boyunca geçici erişim verebilirsin. Dilediğin an geri alabilirsin.")
                .font(.footnote)
                .foregroundStyle(Theme.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    private var scopeCard: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Paylaşılacak veriler")
                .font(.display(17, .bold))
                .foregroundStyle(Theme.ink)
            Text("Yalnızca açtığın kapsamlar görünür olur.")
                .font(.caption)
                .foregroundStyle(Theme.muted)
                .padding(.bottom, 6)

            ForEach(Array(SupportConsentScope.allCases.enumerated()), id: \.element.id) { index, scope in
                if index > 0 {
                    Divider().overlay(Theme.line).padding(.vertical, 4)
                }
                Toggle(isOn: binding(for: scope)) {
                    HStack(spacing: 10) {
                        Image(systemName: scope.icon)
                            .font(.footnote.weight(.bold))
                            .foregroundStyle(Theme.primary)
                            .frame(width: 30, height: 30)
                            .background(Theme.primarySoft, in: RoundedRectangle(cornerRadius: 9, style: .continuous))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(scope.label)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(Theme.ink)
                            Text(scope.detail)
                                .font(.caption2)
                                .foregroundStyle(Theme.muted)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                .tint(Theme.primary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    private var durationCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Erişim süresi")
                .font(.display(17, .bold))
                .foregroundStyle(Theme.ink)
            Picker("Erişim süresi", selection: $hours) {
                ForEach(Self.hourOptions, id: \.self) { option in
                    Text("\(option) saat").tag(option)
                }
            }
            .pickerStyle(.segmented)
            Text("Süre dolduğunda erişim kendiliğinden kapanır.")
                .font(.caption)
                .foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    private var grantButton: some View {
        Button {
            grant()
        } label: {
            HStack(spacing: 8) {
                if saving {
                    ProgressView().tint(.white)
                } else {
                    Image(systemName: "lock.open.fill").font(.subheadline.weight(.bold))
                }
                Text(saving ? "Veriliyor…" : "İzin Ver")
                    .font(.display(16, .bold))
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: Theme.controlRadius, style: .continuous))
            .shadow(color: Theme.primary.opacity(canGrant ? 0.3 : 0), radius: 10, x: 0, y: 5)
        }
        .buttonStyle(PressableStyle())
        .disabled(!canGrant)
        .opacity(canGrant ? 1 : 0.45)
        .animation(.easeInOut(duration: 0.15), value: canGrant)
    }

    private var kvkkNote: some View {
        Text("Kimlik ve adres bilgilerin hiçbir durumda paylaşılmaz.")
            .font(.caption)
            .foregroundStyle(Theme.muted)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
    }

    // MARK: - Durum

    private var canGrant: Bool { !saving && !selected.isEmpty }

    private func binding(for scope: SupportConsentScope) -> Binding<Bool> {
        Binding(
            get: { selected.contains(scope) },
            set: { isOn in
                if isOn { selected.insert(scope) } else { selected.remove(scope) }
            }
        )
    }

    private func grant() {
        guard canGrant else { return }
        saving = true
        errorMessage = nil
        // Kapsamları sabit sırada (enum sırası) gönder — sunucu tarafında okunaklı kalsın.
        let scopes = SupportConsentScope.allCases
            .filter { selected.contains($0) }
            .map(\.rawValue)
        Task {
            do {
                try await onGrant(hours, scopes)
                saving = false
                Haptics.success()
                dismiss()
            } catch {
                saving = false
                errorMessage = (error as? APIError)?.errorDescription ?? "İzin verilemedi, tekrar dener misin?"
            }
        }
    }
}
