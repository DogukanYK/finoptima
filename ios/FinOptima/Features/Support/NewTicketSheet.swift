import SwiftUI

/// Yeni destek talebi formu — konu + kategori + mesaj.
struct NewTicketSheet: View {
    /// Talep başarıyla oluşturulduktan sonra çağrılır (liste yenileme).
    let onCreated: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var subject = ""
    @State private var category: SupportCategory = .other
    @State private var message = ""
    @State private var saving = false
    @State private var errorMessage: String?

    private var canSave: Bool {
        !subject.trimmingCharacters(in: .whitespaces).isEmpty &&
        !message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Konu (ör. Ekstre yüklenmiyor)", text: $subject)
                    Picker("Kategori", selection: $category) {
                        ForEach(SupportCategory.allCases) { cat in
                            Text(cat.label).tag(cat)
                        }
                    }
                }
                Section {
                    TextField("Sorununu anlat…", text: $message, axis: .vertical)
                        .lineLimit(4...8)
                }
                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(Theme.destructive)
                    }
                }
            }
            .navigationTitle("Yeni Talep")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Vazgeç") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if saving {
                        ProgressView()
                    } else {
                        Button("Kaydet") { save() }
                            .disabled(!canSave)
                    }
                }
            }
        }
    }

    private func save() {
        saving = true
        errorMessage = nil
        let body = SupportCreateBody(
            subject: subject.trimmingCharacters(in: .whitespaces),
            category: category.rawValue,
            body: message.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        Task {
            do {
                let res = try await APIClient.shared.createSupportTicket(body)
                saving = false
                if res.ok {
                    Haptics.success()
                    await onCreated()
                    dismiss()
                } else {
                    errorMessage = "Talep oluşturulamadı, tekrar dener misin?"
                }
            } catch {
                saving = false
                errorMessage = (error as? APIError)?.errorDescription ?? "Talep oluşturulamadı, tekrar dener misin?"
            }
        }
    }
}
