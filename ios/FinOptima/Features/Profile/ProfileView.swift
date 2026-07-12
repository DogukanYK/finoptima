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
        VStack(spacing: 14) {
            Circle()
                .fill(Theme.brandGradient)
                .frame(width: 84, height: 84)
                .overlay(
                    Text(String(p.name.prefix(1)).uppercased())
                        .font(.display(38, .bold)).foregroundStyle(.white)
                )
                .overlay(
                    Circle().strokeBorder(.white.opacity(0.25), lineWidth: 1)
                )
                .shadow(color: Theme.primary.opacity(0.35), radius: 16, x: 0, y: 8)

            VStack(spacing: 4) {
                Text(p.name).font(.display(22, .bold)).foregroundStyle(Theme.ink)
                Text(p.email).font(.subheadline).foregroundStyle(Theme.muted)
            }

            HStack(spacing: 8) {
                if p.role == "ADMIN" {
                    PillBadge(text: "Yönetici", color: Theme.primary, icon: "checkmark.seal.fill")
                }
                if model.savedFlash {
                    PillBadge(text: "Kaydedildi", color: Theme.accent, icon: "checkmark.circle.fill")
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 20)
        .padding(.horizontal, 16)
        .background(
            RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                .fill(Theme.primarySoft)
        )
        .overlay(
            RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                .strokeBorder(Theme.primary.opacity(0.15), lineWidth: 1)
        )
    }

    @ViewBuilder
    private func field<Content: View>(title: String, subtitle: String? = nil, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title.uppercased())
                .font(.caption2.weight(.semibold))
                .tracking(0.5)
                .foregroundStyle(Theme.muted)
            if let subtitle {
                Text(subtitle).font(.caption).foregroundStyle(Theme.muted)
            }
            content()
                .font(.subheadline)
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.surface2, in: RoundedRectangle(cornerRadius: Theme.controlRadius, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: Theme.controlRadius, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }

    private func infoCard(_ p: ProfileResponse) -> some View {
        VStack(spacing: 0) {
            infoRow("İki adımlı doğrulama", value: p.twoFactorEnabled ? "Açık" : "Kapalı", icon: "lock.shield.fill", tint: p.twoFactorEnabled ? Theme.accent : Theme.muted)
            Divider().overlay(Theme.line).padding(.leading, 46)
            infoRow("Üyelik", value: Format.shortDate(p.createdAt), icon: "calendar", tint: Theme.cyan)
            if !p.profession.isEmpty {
                Divider().overlay(Theme.line).padding(.leading, 46)
                infoRow("Meslek", value: p.profession, icon: "briefcase.fill", tint: Theme.primary)
            }
        }
        .card(padding: 6)
    }

    private func infoRow(_ label: String, value: String, icon: String, tint: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(tint)
                .frame(width: 34, height: 34)
                .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            Text(label).font(.subheadline).foregroundStyle(Theme.ink)
            Spacer()
            Text(value).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.muted)
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 10)
    }
}
