//
//  AddTransactionSheet.swift
//  FinOptima
//
//  Yeni işlem (gelir/gider) ekleme formu — standart SwiftUI `Form` + `sheet`.
//
//  - Tür (Gelir/Gider), tutar, açıklama, tarih zorunlu; kategori, hesap, not opsiyonel.
//  - Kategori/hesap seçicileri GET /refs'ten gelen referanslarla doldurulur; kategoriler
//    seçili türe göre süzülür.
//  - Kaydet → çağırana verilen `onCreate` kapanışı (POST /transactions) çağrılır;
//    başarıda sayfa kapanır, hatada Türkçe uyarı gösterilir. Force-unwrap yok.
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
            Form {
                kindSection
                detailSection
                categorySection
                accountSection
                noteSection
            }
            .navigationTitle("Yeni İşlem")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("İptal") { dismiss() }
                        .disabled(isSaving)
                }
                ToolbarItem(placement: .confirmationAction) {
                    if isSaving {
                        ProgressView()
                    } else {
                        Button("Kaydet") { Task { await save() } }
                            .disabled(!canSave)
                    }
                }
            }
            .interactiveDismissDisabled(isSaving)
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

    // MARK: - Bölümler

    private var kindSection: some View {
        Section {
            Picker("Tür", selection: $kind) {
                ForEach(Kind.allCases) { option in
                    Text(option.title).tag(option)
                }
            }
            .pickerStyle(.segmented)
            .onChange(of: kind) { _, _ in
                // Tür değişince, kategori seçili türle uyumsuzsa sıfırla.
                if let selected = categoryId,
                   !filteredCategories.contains(where: { $0.id == selected }) {
                    categoryId = nil
                }
            }
        }
    }

    private var detailSection: some View {
        Section("Detaylar") {
            HStack {
                Text("Tutar")
                    .foregroundStyle(Theme.muted)
                Spacer(minLength: 12)
                TextField("0,00", text: $amountText)
                    .keyboardType(.decimalPad)
                    .multilineTextAlignment(.trailing)
                    .monospacedDigit()
                Text("₺")
                    .foregroundStyle(Theme.muted)
            }

            TextField("Açıklama", text: $description)
                .textInputAutocapitalization(.sentences)

            DatePicker(
                "Tarih",
                selection: $date,
                displayedComponents: .date
            )
            .datePickerStyle(.compact)
        }
    }

    private var categorySection: some View {
        Section("Kategori") {
            if filteredCategories.isEmpty {
                Text("Bu tür için kategori yok")
                    .foregroundStyle(Theme.muted)
                    .font(.subheadline)
            } else {
                Picker("Kategori", selection: $categoryId) {
                    Text("Kategori yok").tag(String?.none)
                    ForEach(filteredCategories) { category in
                        Text(category.name).tag(String?.some(category.id))
                    }
                }
            }
        }
    }

    private var accountSection: some View {
        Section("Hesap") {
            if accounts.isEmpty {
                Text("Tanımlı hesap yok")
                    .foregroundStyle(Theme.muted)
                    .font(.subheadline)
            } else {
                Picker("Hesap", selection: $accountId) {
                    Text("Hesap yok").tag(String?.none)
                    ForEach(accounts) { account in
                        Text(accountLabel(account)).tag(String?.some(account.id))
                    }
                }
            }
        }
    }

    private var noteSection: some View {
        Section("Not") {
            TextField("İsteğe bağlı not", text: $note, axis: .vertical)
                .lineLimit(1...4)
        }
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
