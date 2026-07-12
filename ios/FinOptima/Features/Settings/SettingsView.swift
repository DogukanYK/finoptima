import SwiftUI

/// Ayarlar ekranı — görünüm (tema), kategoriler/hesaplar, güvenlik, hakkında.
struct SettingsView: View {
    @State private var model = SettingsViewModel()
    @AppStorage("appearance") private var appearance = "system"

    private var appVersion: String {
        let v = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        return v
    }

    var body: some View {
        Form {
            Section("Görünüm") {
                Picker("Tema", selection: $appearance) {
                    Text("Sistem").tag("system")
                    Text("Açık").tag("light")
                    Text("Koyu").tag("dark")
                }
                .pickerStyle(.segmented)
            }

            Section("Hesap") {
                NavigationLink {
                    CategoriesListView(categories: model.categories)
                } label: {
                    row("Kategoriler", systemImage: "tag.fill", tint: Theme.primary, count: model.categories.count)
                }
                NavigationLink {
                    AccountsListView(accounts: model.accounts)
                } label: {
                    row("Hesaplar & Kartlar", systemImage: "creditcard.fill", tint: Theme.cyan, count: model.accounts.count)
                }
            }

            Section("Güvenlik") {
                HStack(spacing: 12) {
                    iconBadge("lock.shield.fill", tint: model.twoFactorEnabled ? Theme.accent : Theme.muted)
                    Text("İki adımlı doğrulama")
                    Spacer()
                    Text(model.twoFactorEnabled ? "Açık" : "Kapalı")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(model.twoFactorEnabled ? Theme.accent : Theme.muted)
                }
                Text("Güvenlik ayarlarını finoptima.dev üzerinden yönetebilirsin.")
                    .font(.caption).foregroundStyle(Theme.muted)
            }

            Section("Hakkında") {
                HStack(spacing: 12) {
                    iconBadge("info.circle.fill", tint: Theme.muted)
                    Text("Sürüm")
                    Spacer()
                    Text(appVersion).font(.display(15, .semibold)).foregroundStyle(Theme.muted)
                }
                Link(destination: URL(string: "https://finoptima.dev")!) {
                    HStack(spacing: 12) {
                        iconBadge("globe", tint: Theme.primary)
                        Text("finoptima.dev").foregroundStyle(Theme.ink)
                        Spacer()
                        Image(systemName: "arrow.up.right").font(.caption.weight(.bold)).foregroundStyle(Theme.primary)
                    }
                }
            }
        }
        .navigationTitle("Ayarlar")
        .task { await model.loadIfNeeded() }
    }

    private func iconBadge(_ systemImage: String, tint: Color) -> some View {
        Image(systemName: systemImage)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(tint)
            .frame(width: 30, height: 30)
            .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 9, style: .continuous))
    }

    private func row(_ title: String, systemImage: String, tint: Color, count: Int) -> some View {
        HStack(spacing: 12) {
            iconBadge(systemImage, tint: tint)
            Text(title)
            Spacer()
            Text("\(count)")
                .font(.display(15, .semibold))
                .foregroundStyle(tint)
                .padding(.horizontal, 9).padding(.vertical, 2)
                .background(tint.opacity(0.12), in: Capsule())
        }
    }
}

// MARK: - Kategoriler listesi

private struct CategoriesListView: View {
    let categories: [RefCategory]

    var body: some View {
        List {
            Section("Gelir") {
                ForEach(categories.filter { $0.kind == "INCOME" }) { c in categoryRow(c) }
            }
            Section("Gider") {
                ForEach(categories.filter { $0.kind == "EXPENSE" }) { c in categoryRow(c) }
            }
        }
        .navigationTitle("Kategoriler")
        .overlay {
            if categories.isEmpty {
                ContentUnavailableView("Kategori yok", systemImage: "tag")
            }
        }
    }

    private func categoryRow(_ c: RefCategory) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color(hex: c.color))
                .frame(width: 30, height: 30)
                .overlay(Circle().strokeBorder(.white.opacity(0.5), lineWidth: 1.5))
                .shadow(color: Color(hex: c.color).opacity(0.35), radius: 4, x: 0, y: 2)
            Text(c.name).font(.subheadline.weight(.medium))
        }
        .padding(.vertical, 2)
    }
}

// MARK: - Hesaplar listesi

private struct AccountsListView: View {
    let accounts: [RefAccount]

    var body: some View {
        List {
            ForEach(accounts) { a in
                HStack(spacing: 12) {
                    Image(systemName: a.type == "CARD" ? "creditcard.fill" : "building.columns.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(a.type == "CARD" ? Theme.cyan : Theme.primary)
                        .frame(width: 38, height: 38)
                        .background(
                            (a.type == "CARD" ? Theme.cyan : Theme.primary).opacity(0.14),
                            in: RoundedRectangle(cornerRadius: 11, style: .continuous)
                        )
                    VStack(alignment: .leading, spacing: 2) {
                        Text(a.label.isEmpty ? a.bankName : a.label).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                        Text(a.bankName + (a.cardLast4.map { " ···· \($0)" } ?? ""))
                            .font(.caption).foregroundStyle(Theme.muted)
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .navigationTitle("Hesaplar")
        .overlay {
            if accounts.isEmpty {
                ContentUnavailableView("Hesap yok", systemImage: "creditcard")
            }
        }
    }
}
