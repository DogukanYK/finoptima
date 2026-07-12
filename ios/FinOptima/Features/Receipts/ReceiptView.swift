import SwiftUI
import PhotosUI

/// Fişler — fiş/dekont fotoğrafı seç, yapay zekâ tutar/tarih/satıcıyı çıkarsın,
/// onayla ve harcama olarak ekle. Import altyapısını (ImportViewModel) yeniden
/// kullanır; tek-harcama odaklı sade akış.
struct ReceiptView: View {
    @State private var model = ImportViewModel()
    @State private var photoItem: PhotosPickerItem?

    var body: some View {
        content
            .navigationTitle("Fişler")
            .navigationBarTitleDisplayMode(.inline)
            .background(Theme.bg.ignoresSafeArea())
            .onChange(of: photoItem) { _, item in
                guard let item else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self) {
                        await model.parse(data: data, fileName: "fis.jpg", mimeType: "image/jpeg")
                    }
                    photoItem = nil
                }
            }
    }

    @ViewBuilder
    private var content: some View {
        switch model.phase {
        case .idle: idleView
        case .uploading: busy("Fiş okunuyor…")
        case .review: reviewView
        case .committing: busy("Kaydediliyor…")
        case .done: doneView
        }
    }

    private var idleView: some View {
        VStack(spacing: 20) {
            Spacer()
            Image(systemName: "doc.viewfinder")
                .font(.system(size: 30, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 68, height: 68)
                .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                .shadow(color: Theme.primary.opacity(0.3), radius: 14, y: 8)
            VStack(spacing: 8) {
                Text("Fişini çek, AI harcamaya çevirsin")
                    .font(.display(20, .bold)).foregroundStyle(Theme.ink)
                    .multilineTextAlignment(.center)
                Text("Fiş ya da dekont fotoğrafını seç; tutar, tarih ve satıcı otomatik çıkar.")
                    .font(.subheadline).foregroundStyle(Theme.muted)
                    .multilineTextAlignment(.center)
            }
            PhotosPicker(selection: $photoItem, matching: .images) {
                Label("Fiş Fotoğrafı Seç", systemImage: "camera.fill")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(PressableStyle())
            if let err = model.errorMessage {
                Text(err).font(.footnote).foregroundStyle(Theme.destructive).multilineTextAlignment(.center)
            }
            Spacer(); Spacer()
        }
        .padding(24)
    }

    private var reviewView: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 12) {
                    Text("Fişten çıkan harcama\(model.rows.count > 1 ? "lar" : "")")
                        .font(.footnote).foregroundStyle(Theme.muted)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    ForEach(model.rows) { row in
                        HStack(spacing: 12) {
                            Image(systemName: row.kind == "INCOME" ? "arrow.down.left" : "arrow.up.right")
                                .font(.callout.weight(.semibold))
                                .foregroundStyle(row.kind == "INCOME" ? Theme.income : Theme.expense)
                                .frame(width: 38, height: 38)
                                .background((row.kind == "INCOME" ? Theme.income : Theme.expense).opacity(0.14), in: Circle())
                            VStack(alignment: .leading, spacing: 3) {
                                Text(row.description).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink).lineLimit(1)
                                Text("\(Format.shortDate(row.date))\(row.categoryName.map { " · \($0)" } ?? "")")
                                    .font(.caption).foregroundStyle(Theme.muted)
                            }
                            Spacer(minLength: 8)
                            AmountText(value: row.amount, color: Theme.ink, size: 16, weight: .bold)
                        }
                        .card(padding: 12)
                    }
                }
                .padding(16)
            }
            VStack(spacing: 0) {
                Divider().overlay(Theme.line)
                HStack(spacing: 12) {
                    Button("Vazgeç") { model.reset() }
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.muted)
                        .frame(maxWidth: .infinity).padding(.vertical, 14)
                        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Theme.line))
                    Button {
                        Haptics.light(); Task { await model.commit() }
                    } label: {
                        Text("Ekle")
                            .font(.subheadline.weight(.bold)).foregroundStyle(.white)
                            .frame(maxWidth: .infinity).padding(.vertical, 15)
                            .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .buttonStyle(PressableStyle())
                }
                .padding(16)
                .background(.bar)
            }
        }
    }

    private func busy(_ text: String) -> some View {
        VStack(spacing: 16) {
            ProgressView().controlSize(.large)
            Text(text).font(.subheadline).foregroundStyle(Theme.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var doneView: some View {
        VStack(spacing: 18) {
            Image(systemName: "checkmark.circle.fill").font(.system(size: 52)).foregroundStyle(Theme.accent)
            Text("\(model.imported) harcama eklendi").font(.display(22, .bold)).foregroundStyle(Theme.ink)
            Button { Haptics.light(); model.reset() } label: {
                Text("Yeni fiş ekle")
                    .font(.subheadline.weight(.semibold)).foregroundStyle(Theme.primary)
                    .padding(.horizontal, 20).padding(.vertical, 12)
                    .background(Theme.primary.opacity(0.12), in: Capsule())
            }
            .buttonStyle(PressableStyle())
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity).padding(24)
    }
}
