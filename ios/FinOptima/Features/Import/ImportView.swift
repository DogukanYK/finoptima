import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

/// Banka Dökümü — PDF/ekstre ya da foto yükle, yapay zekâ işlemleri çıkarsın,
/// gözden geçirip kaydet.
struct ImportView: View {
    @State private var model = ImportViewModel()
    @State private var showFileImporter = false
    @State private var photoItem: PhotosPickerItem?

    var body: some View {
        content
            .navigationTitle("Banka Dökümü")
            .navigationBarTitleDisplayMode(.inline)
            .background(Theme.bg.ignoresSafeArea())
            .fileImporter(
                isPresented: $showFileImporter,
                allowedContentTypes: [.pdf, .commaSeparatedText, .image, .spreadsheet],
                allowsMultipleSelection: false
            ) { result in
                if case .success(let urls) = result, let url = urls.first {
                    Task { await handleFile(url) }
                }
            }
            .onChange(of: photoItem) { _, item in
                guard let item else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self) {
                        await model.parse(data: data, fileName: "fotograf.jpg", mimeType: "image/jpeg")
                    }
                    photoItem = nil
                }
            }
    }

    @ViewBuilder
    private var content: some View {
        switch model.phase {
        case .idle: idleView
        case .uploading: busyView("Yapay zekâ belgeni okuyor…")
        case .review: reviewView
        case .committing: busyView("İşlemler kaydediliyor…")
        case .done: doneView
        }
    }

    // MARK: - Başlangıç

    private var idleView: some View {
        ScrollView {
            VStack(spacing: 20) {
                VStack(spacing: 14) {
                    Image(systemName: "doc.text.viewfinder")
                        .font(.system(size: 30, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 68, height: 68)
                        .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .shadow(color: Theme.primary.opacity(0.3), radius: 14, y: 8)
                    Text("Ekstreni yükle, gerisini AI halletsin")
                        .font(.display(20, .bold))
                        .foregroundStyle(Theme.ink)
                        .multilineTextAlignment(.center)
                    Text("PDF, Excel/CSV ekstre ya da ekstre fotoğrafı. Hangi banka olursa olsun yapay zekâ işlemleri çıkarır, kategoriye ayırır ve mükerrerleri işaretler.")
                        .font(.subheadline)
                        .foregroundStyle(Theme.muted)
                        .multilineTextAlignment(.center)
                }
                .padding(.top, 24)

                VStack(spacing: 12) {
                    Button {
                        Haptics.light(); showFileImporter = true
                    } label: {
                        pickerLabel("Dosya Seç", subtitle: "PDF · Excel · CSV", icon: "doc.fill")
                    }
                    .buttonStyle(PressableStyle())

                    PhotosPicker(selection: $photoItem, matching: .images) {
                        pickerLabel("Fotoğraf Seç", subtitle: "Ekstre / dekont fotoğrafı", icon: "camera.fill")
                    }
                    .buttonStyle(PressableStyle())
                }

                if let err = model.errorMessage {
                    Text(err).font(.footnote).foregroundStyle(Theme.destructive).multilineTextAlignment(.center)
                }
            }
            .padding(16)
        }
    }

    private func pickerLabel(_ title: String, subtitle: String, icon: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.headline)
                .foregroundStyle(Theme.primary)
                .frame(width: 44, height: 44)
                .background(Theme.primary.opacity(0.12), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                Text(subtitle).font(.caption).foregroundStyle(Theme.muted)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.footnote.weight(.semibold)).foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    // MARK: - Gözden geçir

    private var reviewView: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 12) {
                    HStack(spacing: 8) {
                        if let bank = model.detectedBank, !bank.isEmpty {
                            PillBadge(text: bank, color: Theme.primary, icon: "building.columns.fill")
                        }
                        PillBadge(text: "\(model.rows.count) işlem bulundu", color: Theme.accent)
                        Spacer()
                    }

                    ForEach(model.rows) { row in
                        rowCard(row)
                    }
                }
                .padding(16)
            }

            // Alt kaydet çubuğu
            VStack(spacing: 0) {
                Divider().overlay(Theme.line)
                Button {
                    Haptics.light(); Task { await model.commit() }
                } label: {
                    Text(model.includedCount > 0 ? "\(model.includedCount) işlemi ekle" : "İşlem seç")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .opacity(model.includedCount > 0 ? 1 : 0.5)
                }
                .buttonStyle(PressableStyle())
                .disabled(model.includedCount == 0)
                .padding(16)
                .background(.bar)
            }
        }
    }

    private func rowCard(_ row: ImportRow) -> some View {
        let isIncome = row.kind == "INCOME"
        let on = model.isIncluded(row)
        return Button {
            model.toggle(row)
        } label: {
            HStack(spacing: 12) {
                Image(systemName: on ? "checkmark.circle.fill" : "circle")
                    .font(.title3)
                    .foregroundStyle(on ? Theme.primary : Theme.muted)

                VStack(alignment: .leading, spacing: 3) {
                    Text(row.description)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)
                    HStack(spacing: 6) {
                        Text(Format.shortDate(row.date))
                        if let cat = row.categoryName { Text("·"); Text(cat) }
                        if row.duplicate {
                            Text("· ")
                            Text("tekrar").foregroundStyle(Theme.expense)
                        }
                    }
                    .font(.caption)
                    .foregroundStyle(Theme.muted)
                    .lineLimit(1)
                }
                Spacer(minLength: 8)
                AmountText(value: isIncome ? row.amount : -row.amount, signed: true,
                           color: isIncome ? Theme.income : Theme.ink, size: 15, weight: .bold)
            }
            .padding(12)
            .frame(maxWidth: .infinity)
            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(on ? Theme.primary.opacity(0.4) : Theme.line, lineWidth: on ? 1.5 : 1)
            )
            .opacity(on ? 1 : 0.6)
        }
        .buttonStyle(PressableStyle(scale: 0.98))
    }

    // MARK: - Meşgul / Bitti

    private func busyView(_ text: String) -> some View {
        VStack(spacing: 16) {
            ProgressView().controlSize(.large)
            Text(text).font(.subheadline).foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var doneView: some View {
        VStack(spacing: 18) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 52))
                .foregroundStyle(Theme.accent)
            Text("\(model.imported) işlem eklendi")
                .font(.display(22, .bold))
                .foregroundStyle(Theme.ink)
            Text("İşlemler panele ve listeye işlendi.")
                .font(.subheadline).foregroundStyle(Theme.muted)
            Button {
                Haptics.light(); model.reset()
            } label: {
                Text("Başka bir döküm yükle")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.primary)
                    .padding(.horizontal, 20).padding(.vertical, 12)
                    .background(Theme.primary.opacity(0.12), in: Capsule())
            }
            .buttonStyle(PressableStyle())
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(24)
    }

    // MARK: - Dosya okuma

    private func handleFile(_ url: URL) async {
        guard url.startAccessingSecurityScopedResource() else {
            model.reset()
            return
        }
        defer { url.stopAccessingSecurityScopedResource() }
        guard let data = try? Data(contentsOf: url) else { return }
        let ext = url.pathExtension.lowercased()
        let mime: String
        switch ext {
        case "pdf": mime = "application/pdf"
        case "csv": mime = "text/csv"
        case "xlsx", "xls": mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        case "png": mime = "image/png"
        default: mime = "image/jpeg"
        }
        await model.parse(data: data, fileName: url.lastPathComponent, mimeType: mime)
    }
}
