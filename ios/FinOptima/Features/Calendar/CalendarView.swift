import SwiftUI

/// Takvim — yaklaşan hatırlatma / fatura / etkinlikler; ekle, ödendi işaretle, sil.
struct CalendarView: View {
    @State private var model = CalendarViewModel()
    @State private var showAdd = false

    var body: some View {
        content
            .navigationTitle("Takvim")
            .background(Theme.bg.ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Haptics.light(); showAdd = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showAdd) {
                AddEventSheet { title, date, type, amount, note in
                    await model.add(title: title, date: date, type: type, amount: amount, note: note)
                }
            }
            .task { await model.loadIfNeeded() }
    }

    @ViewBuilder
    private var content: some View {
        if model.isLoading && model.events.isEmpty {
            ProgressView("Yükleniyor…").frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if model.events.isEmpty {
            ContentUnavailableView {
                Label("Etkinlik yok", systemImage: "calendar")
            } description: {
                Text("Fatura, hatırlatma veya ödeme ekleyerek başla.")
            } actions: {
                Button("Etkinlik ekle") { showAdd = true }.buttonStyle(.borderedProminent)
            }
        } else {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if !model.upcoming.isEmpty {
                        section("Yaklaşan", events: model.upcoming)
                    }
                    if !model.past.isEmpty {
                        section("Geçmiş", events: model.past)
                    }
                }
                .padding(16)
            }
            .refreshable { await model.load() }
        }
    }

    private func section(_ title: String, events: [CalendarEventItem]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: title)
            ForEach(events) { ev in
                EventRow(event: ev,
                         onToggle: { Task { await model.togglePaid(ev) } },
                         onDelete: { Task { await model.delete(ev) } })
            }
        }
    }
}

// MARK: - Etkinlik satırı

private struct EventRow: View {
    let event: CalendarEventItem
    let onToggle: () -> Void
    let onDelete: () -> Void

    private var meta: (icon: String, tint: Color, label: String) {
        switch event.type {
        case "BILL": return ("doc.text.fill", Theme.expense, "Fatura")
        case "EVENT": return ("calendar", Theme.cyan, "Etkinlik")
        default: return ("bell.fill", Theme.primary, "Hatırlatma")
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: meta.icon)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(meta.tint)
                .frame(width: 38, height: 38)
                .background(meta.tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 11, style: .continuous))

            VStack(alignment: .leading, spacing: 3) {
                Text(event.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.ink)
                    .strikethrough(event.isPaid, color: Theme.muted)
                    .lineLimit(1)
                HStack(spacing: 6) {
                    Text(Format.shortDate(event.date))
                    Text("·"); Text(meta.label)
                }
                .font(.caption)
                .foregroundStyle(Theme.muted)
            }

            Spacer(minLength: 8)

            if let amount = event.amount {
                AmountText(value: amount, color: event.isPaid ? Theme.muted : Theme.ink, size: 15, weight: .bold)
            }

            Button(action: { Haptics.light(); onToggle() }) {
                Image(systemName: event.isPaid ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(event.isPaid ? Theme.accent : Theme.muted)
            }
            .buttonStyle(.plain)
        }
        .opacity(event.isPaid ? 0.65 : 1)
        .card(padding: 12)
        .contextMenu {
            Button(role: .destructive, action: onDelete) {
                Label("Sil", systemImage: "trash")
            }
        }
    }
}

// MARK: - Etkinlik ekleme

private struct AddEventSheet: View {
    let onSave: (_ title: String, _ date: Date, _ type: String, _ amount: Double?, _ note: String?) async -> Bool

    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var date = Date()
    @State private var type = "REMINDER"
    @State private var amountText = ""
    @State private var note = ""
    @State private var saving = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("Başlık (ör. Elektrik faturası)", text: $title)
                    Picker("Tür", selection: $type) {
                        Text("Hatırlatma").tag("REMINDER")
                        Text("Fatura").tag("BILL")
                        Text("Etkinlik").tag("EVENT")
                    }
                    DatePicker("Tarih", selection: $date, displayedComponents: .date)
                }
                Section {
                    TextField("Tutar (opsiyonel)", text: $amountText)
                        .keyboardType(.decimalPad)
                    TextField("Not (opsiyonel)", text: $note, axis: .vertical)
                        .lineLimit(2...4)
                }
            }
            .navigationTitle("Yeni Etkinlik")
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
                            .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                }
            }
        }
    }

    private func save() {
        saving = true
        let amount = parseAmount(amountText)
        Task {
            let ok = await onSave(
                title.trimmingCharacters(in: .whitespaces),
                date, type, amount,
                note.isEmpty ? nil : note
            )
            saving = false
            if ok { Haptics.success(); dismiss() }
        }
    }

    /// "1.234,56" / "1234.56" → Double
    private func parseAmount(_ s: String) -> Double? {
        let cleaned = s.trimmingCharacters(in: .whitespaces)
        guard !cleaned.isEmpty else { return nil }
        let normalized = cleaned.replacingOccurrences(of: ".", with: "").replacingOccurrences(of: ",", with: ".")
        return Double(normalized) ?? Double(cleaned)
    }
}
