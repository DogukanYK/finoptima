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
                    row("Kategoriler", systemImage: "tag", count: model.categories.count)
                }
                NavigationLink {
                    AccountsListView(accounts: model.accounts)
                } label: {
                    row("Hesaplar & Kartlar", systemImage: "creditcard", count: model.accounts.count)
                }
            }

            Section("Güvenlik") {
                HStack {
                    Label("İki adımlı doğrulama", systemImage: "lock.shield")
                    Spacer()
                    Text(model.twoFactorEnabled ? "Açık" : "Kapalı")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(model.twoFactorEnabled ? Theme.accent : Theme.muted)
                }
                Text("Güvenlik ayarlarını finoptima.dev üzerinden yönetebilirsin.")
                    .font(.caption).foregroundStyle(Theme.muted)
            }

            Section("Hakkında") {
                HStack {
                    Text("Sürüm")
                    Spacer()
                    Text(appVersion).foregroundStyle(Theme.muted)
                }
                Link(destination: URL(string: "https://finoptima.dev")!) {
                    HStack {
                        Text("finoptima.dev")
                        Spacer()
                        Image(systemName: "arrow.up.right.square")
                    }
                }
            }
        }
        .navigationTitle("Ayarlar")
        .task { await model.loadIfNeeded() }
    }

    private func row(_ title: String, systemImage: String, count: Int) -> some View {
        HStack {
            Label(title, systemImage: systemImage)
            Spacer()
            Text("\(count)").foregroundStyle(Theme.muted)
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
        HStack(spacing: 10) {
            Circle().fill(Color(hex: c.color)).frame(width: 12, height: 12)
            Text(c.name)
        }
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
                        .foregroundStyle(Theme.primary)
                        .frame(width: 26)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(a.label.isEmpty ? a.bankName : a.label).font(.subheadline.weight(.medium))
                        Text(a.bankName + (a.cardLast4.map { " ···· \($0)" } ?? ""))
                            .font(.caption).foregroundStyle(Theme.muted)
                    }
                }
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
