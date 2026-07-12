//
//  AddTransactionSheet.swift
//  FinOptima
//
//  Yeni işlem (gelir/gider) ekleme formu — premium sunum (kartlı ScrollView).
//
//  - Tür (Gelir/Gider) büyük ikili seçici, tutar girişi büyük Space Grotesk.
//  - Kategori/hesap seçicileri GET /refs'ten gelen referanslarla doldurulur; kategoriler
//    seçili türe göre süzülür.
//  - Kaydet → alttaki gradyanlı "Ekle" butonu `onCreate` kapanışını (POST /transactions)
//    çağırır; başarıda sayfa kapanır, hatada Türkçe uyarı gösterilir. Force-unwrap yok.
//
//  Yalnızca sunum düzenlendi; alan durumu / kaydetme mantığı aynen korunur.
//

import SwiftUI

struct AddTransactionSheet: View {

    /// Kategori seçici için referanslar (VM'den geçirilir).
    let categories: [RefCategory]
    /// Hesap seçici için referanslar (VM'den geçirilir).
    let accounts: [RefAccount]
    /// İşlemi oluşturan eylem — başarıda döner, hatada `throw` eder.
    let onCreate: (CreateTransactionBody) async throws -> Void

    @Environment(\.dismiss) private var dismiss

    // MARK: - Form durumu

    private enum Kind: String, CaseIterable, Identifiable {
        case income = "INCOME"
        case expense = "EXPENSE"

        var id: String { rawValue }
        var title: String { self == .income ? "Gelir" : "Gider" }
        var tint: Color { self == .income ? Theme.income : Theme.expense }
        var icon: String { self == .income ? "arrow.down" : "arrow.up" }
    }

    @State private var kind: Kind = .expense
    @State private var amountText: String = ""
    @State private var description: String = ""
    @State private var date: Date = Date()
    @State private var categoryId: String?
    @State private var accountId: String?
    @State private var note: String = ""

    @State private var isSaving = false
    @State private var errorMessage: String?

    @FocusState private var fieldFocused: Bool

    // MARK: - Türetilmiş değerler

    /// Seçili türe uyan kategoriler (RefCategory.kind eşleşmesi).
    private var filteredCategories: [RefCategory] {
        categories.filter { $0.kind == kind.rawValue }
    }

    /// Girilen tutarın çözümlenmiş hâli (tr_TR virgül veya nokta kabul eder).
    private var parsedAmount: Double? {
        let raw = amountText.trimmingCharacters(in: .whitespaces)
        guard !raw.isEmpty else { return nil }

        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "tr_TR")
        formatter.numberStyle = .decimal
        if let number = formatter.number(from: raw) {
            return number.doubleValue
        }
        // Yedek: nokta ondalıklı ("12.50") giriş.
        return Double(raw.replacingOccurrences(of: ",", with: "."))
    }

    private var trimmedDescription: String {
        description.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var canSave: Bool {
        guard let amount = parsedAmount, amount > 0 else { return false }
        return !trimmedDescription.isEmpty && !isSaving
    }

    // MARK: - Görünüm

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    kindSelector
                    amountCard
                    detailCard
                    categoryCard
                    accountCard
                    noteCard
                }
                .padding(16)
            }
            .background(Theme.bg.ignoresSafeArea())
            .scrollDismissesKeyboard(.interactively)
            .safeAreaInset(edge: .bottom) { saveBar }
            .navigationTitle("Yeni İşlem")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: kind) { _, _ in
                // Tür değişince, kategori seçili türle uyumsuzsa sıfırla.
                if let selected = categoryId,
                   !filteredCategories.contains(where: { $0.id == selected }) {
                    categoryId = nil
                }
            }
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("İptal") { dismiss() }
                        .disabled(isSaving)
                }
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("Bitti") { fieldFocused = false }
                        .font(.body.weight(.semibold))
                }
            }
            .interactiveDismissDisabled(isSaving)
            .presentationDragIndicator(.visible)
            .alert(
                "İşlem kaydedilemedi",
                isPresented: Binding(
                    get: { errorMessage != nil },
                    set: { if !$0 { errorMessage = nil } }
                )
            ) {
                Button("Tamam", role: .cancel) { errorMessage = nil }
            } message: {
                Text(errorMessage ?? "Bilinmeyen bir hata oluştu.")
            }
        }
    }

    // MARK: - Tür seçici

    private var kindSelector: some View {
        HStack(spacing: 10) {
            ForEach(Kind.allCases) { option in
                let selected = kind == option
                Button {
                    guard kind != option else { return }
                    Haptics.light()
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.75)) {
                        kind = option
                    }
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: option.icon)
                            .font(.subheadline.weight(.bold))
                        Text(option.title)
                            .font(.subheadline.weight(.semibold))
                    }
                    .foregroundStyle(selected ? .white : Theme.muted)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .fill(selected ? AnyShapeStyle(option.tint) : AnyShapeStyle(Theme.surface2))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(Theme.line.opacity(selected ? 0 : 0.7), lineWidth: 1)
                    )
                    .shadow(color: option.tint.opacity(selected ? 0.28 : 0), radius: 10, x: 0, y: 5)
                }
                .buttonStyle(PressableStyle())
            }
        }
    }

    // MARK: - Tutar (hero)

    private var amountCard: some View {
        VStack(spacing: 10) {
            Text("TUTAR")
                .font(.caption2.weight(.semibold))
                .tracking(0.6)
                .foregroundStyle(Theme.muted)

            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text("₺")
                    .font(.display(28, .semibold))
                    .foregroundStyle(Theme.muted)
                TextField("0,00", text: $amountText)
                    .font(.display(40, .bold))
                    .foregroundStyle(kind.tint)
                    .monospacedDigit()
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.center)
                    .focused($fieldFocused)
            }
            .frame(maxWidth: .infinity)
        }
        .frame(maxWidth: .infinity)
        .contentShape(Rectangle())
        .onTapGesture { fieldFocused = true }
        .card(padding: 20)
    }

    // MARK: - Açıklama + tarih

    private var detailCard: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                iconBadge("text.alignleft")
                TextField("Açıklama", text: $description)
                    .font(.subheadline)
                    .textInputAutocapitalization(.sentences)
                    .focused($fieldFocused)
            }
            .padding(14)

            Divider().overlay(Theme.line)

            HStack(spacing: 12) {
                iconBadge("calendar")
                Text("Tarih")
                    .font(.subheadline)
                    .foregroundStyle(Theme.ink)
                Spacer()
                DatePicker("", selection: $date, displayedComponents: .date)
                    .labelsHidden()
                    .tint(Theme.primary)
            }
            .padding(14)
        }
        .card(padding: 0)
    }

    // MARK: - Kategori

    private var categoryCard: some View {
        HStack(spacing: 12) {
            iconBadge("tag", tint: Theme.cyan)
            Text("Kategori")
                .font(.subheadline)
                .foregroundStyle(Theme.ink)
            Spacer()
            if filteredCategories.isEmpty {
                Text("Bu tür için yok")
                    .font(.subheadline)
                    .foregroundStyle(Theme.muted)
            } else {
                Picker("Kategori", selection: $categoryId) {
                    Text("Kategori yok").tag(String?.none)
                    ForEach(filteredCategories) { category in
                        Text(category.name).tag(String?.some(category.id))
                    }
                }
                .labelsHidden()
                .tint(Theme.primary)
            }
        }
        .padding(14)
        .card(padding: 0)
    }

    // MARK: - Hesap

    private var accountCard: some View {
        HStack(spacing: 12) {
            iconBadge("building.columns", tint: Theme.accent)
            Text("Hesap")
                .font(.subheadline)
                .foregroundStyle(Theme.ink)
            Spacer()
            if accounts.isEmpty {
                Text("Tanımlı hesap yok")
                    .font(.subheadline)
                    .foregroundStyle(Theme.muted)
            } else {
                Picker("Hesap", selection: $accountId) {
                    Text("Hesap yok").tag(String?.none)
                    ForEach(accounts) { account in
                        Text(accountLabel(account)).tag(String?.some(account.id))
                    }
                }
                .labelsHidden()
                .tint(Theme.primary)
            }
        }
        .padding(14)
        .card(padding: 0)
    }

    // MARK: - Not

    private var noteCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                iconBadge("note.text", tint: Theme.muted)
                Text("Not")
                    .font(.subheadline)
                    .foregroundStyle(Theme.ink)
                Spacer()
            }
            TextField("İsteğe bağlı not", text: $note, axis: .vertical)
                .font(.subheadline)
                .lineLimit(1...4)
                .focused($fieldFocused)
        }
        .padding(14)
        .card(padding: 0)
    }

    // MARK: - Kaydet çubuğu

    private var saveBar: some View {
        Button {
            Haptics.light()
            Task { await save() }
        } label: {
            HStack(spacing: 8) {
                if isSaving {
                    ProgressView().tint(.white)
                } else {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.headline)
                }
                Text(isSaving ? "Kaydediliyor…" : "Ekle")
                    .font(.headline)
            }
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(canSave ? AnyShapeStyle(Theme.brandGradient) : AnyShapeStyle(Theme.line))
            )
            .opacity(canSave ? 1 : 0.6)
            .shadow(color: Theme.primary.opacity(canSave ? 0.3 : 0), radius: 14, x: 0, y: 8)
        }
        .buttonStyle(PressableStyle())
        .disabled(!canSave)
        .padding(.horizontal, 16)
        .padding(.top, 10)
        .padding(.bottom, 8)
        .background(Theme.bg)
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.line.opacity(0.7)).frame(height: 1)
        }
    }

    // MARK: - Yardımcı görünüm

    private func iconBadge(_ system: String, tint: Color = Theme.primary) -> some View {
        Image(systemName: system)
            .font(.footnote.weight(.bold))
            .foregroundStyle(tint)
            .frame(width: 32, height: 32)
            .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    // MARK: - Eylemler

    private func save() async {
        guard let amount = parsedAmount, amount > 0 else { return }
        let trimmedNote = note.trimmingCharacters(in: .whitespacesAndNewlines)

        let body = CreateTransactionBody(
            amount: amount,
            kind: kind.rawValue,
            description: trimmedDescription,
            date: Self.isoDay.string(from: date),
            categoryId: categoryId,
            accountId: accountId,
            note: trimmedNote.isEmpty ? nil : trimmedNote
        )

        isSaving = true
        defer { isSaving = false }

        do {
            try await onCreate(body)
            Haptics.success()
            dismiss()
        } catch let error as APIError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func accountLabel(_ account: RefAccount) -> String {
        let bank = account.bankName.trimmingCharacters(in: .whitespaces)
        if bank.isEmpty || bank == account.label {
            return account.label
        }
        return "\(account.label) · \(bank)"
    }

    // MARK: - Tarih biçimlendirici

    /// `Date` → "YYYY-MM-DD" (konumdan bağımsız, Türkiye saat dilimi).
    private static let isoDay: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "Europe/Istanbul")
        return formatter
    }()
}
