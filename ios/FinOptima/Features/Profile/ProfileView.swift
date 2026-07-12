import SwiftUI

/// Profil ekranı — kullanıcı bilgisi, düzenlenebilir ad ve AI profil tanımı.
struct ProfileView: View {
    @State private var model = ProfileViewModel()
    @State private var name = ""
    @State private var aiIdentity = ""
    @FocusState private var focused: Bool

    var body: some View {
        content
            .navigationTitle("Profil")
            .navigationBarTitleDisplayMode(.large)
            .background(Theme.bg.ignoresSafeArea())
            .task { await model.loadIfNeeded(); sync() }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if model.saving {
                        ProgressView()
                    } else {
                        Button("Kaydet") {
                            focused = false
                            Task { await model.save(name: name, aiIdentity: aiIdentity) }
                        }
                        .disabled(name.trimmingCharacters(in: .whitespaces).count < 2)
                    }
                }
            }
    }

    private func sync() {
        if let p = model.profile {
            name = p.name
            aiIdentity = p.aiIdentity
        }
    }

    @ViewBuilder
    private var content: some View {
        if model.isLoading && model.profile == nil {
            ProgressView("Yükleniyor…").frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let p = model.profile {
            ScrollView {
                VStack(spacing: 16) {
                    header(p)

                    field(title: "Ad Soyad") {
                        TextField("Adın", text: $name)
                            .focused($focused)
                            .textInputAutocapitalization(.words)
                    }

                    field(title: "AI Profil Tanımı", subtitle: "AI önerilerini kişiselleştirmek için kendinden bahset.") {
                        TextField("Örn: 32 yaşında, serbest çalışan, İstanbul…", text: $aiIdentity, axis: .vertical)
                            .lineLimit(3...6)
                            .focused($focused)
                    }

                    infoCard(p)

                    if let err = model.errorMessage {
                        Text(err).font(.footnote).foregroundStyle(Theme.destructive)
                    }
                }
                .padding(16)
            }
            .onChange(of: model.profile?.name) { sync() }
        } else {
            VStack(spacing: 12) {
                Image(systemName: "person.crop.circle.badge.exclamationmark").font(.largeTitle).foregroundStyle(Theme.muted)
                Text(model.errorMessage ?? "Profil yüklenemedi.").foregroundStyle(Theme.muted)
                Button("Tekrar Dene") { Task { await model.load(); sync() } }.buttonStyle(.borderedProminent)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private func header(_ p: ProfileResponse) -> some View {
        VStack(spacing: 10) {
            Circle()
                .fill(LinearGradient(colors: [Theme.primary, Color(hex: "0EA5E9")], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 72, height: 72)
                .overlay(
                    Text(String(p.name.prefix(1)).uppercased())
                        .font(.title.bold()).foregroundStyle(.white)
                )
            VStack(spacing: 2) {
                Text(p.name).font(.title3.bold()).foregroundStyle(Theme.ink)
                Text(p.email).font(.subheadline).foregroundStyle(Theme.muted)
            }
            if p.role == "ADMIN" {
                Text("Yönetici").font(.caption.weight(.semibold))
                    .foregroundStyle(Theme.primary)
                    .padding(.horizontal, 10).padding(.vertical, 3)
                    .background(Theme.primary.opacity(0.12), in: Capsule())
            }
            if model.savedFlash {
                Label("Kaydedildi", systemImage: "checkmark.circle.fill")
                    .font(.caption).foregroundStyle(Theme.accent)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    @ViewBuilder
    private func field<Content: View>(title: String, subtitle: String? = nil, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
            if let subtitle {
                Text(subtitle).font(.caption).foregroundStyle(Theme.muted)
            }
            content()
                .font(.subheadline)
                .padding(12)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func infoCard(_ p: ProfileResponse) -> some View {
        VStack(spacing: 0) {
            infoRow("İki adımlı doğrulama", value: p.twoFactorEnabled ? "Açık" : "Kapalı", icon: "lock.shield", tint: p.twoFactorEnabled ? Theme.accent : Theme.muted)
            Divider().overlay(Theme.line)
            infoRow("Üyelik", value: Format.shortDate(p.createdAt), icon: "calendar", tint: Theme.muted)
            if !p.profession.isEmpty {
                Divider().overlay(Theme.line)
                infoRow("Meslek", value: p.profession, icon: "briefcase", tint: Theme.muted)
            }
        }
        .padding(.horizontal, 14)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
    }

    private func infoRow(_ label: String, value: String, icon: String, tint: Color) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon).foregroundStyle(tint).frame(width: 22)
            Text(label).font(.subheadline).foregroundStyle(Theme.ink)
            Spacer()
            Text(value).font(.subheadline.weight(.medium)).foregroundStyle(Theme.muted)
        }
        .padding(.vertical, 12)
    }
}
