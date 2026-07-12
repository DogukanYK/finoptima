import SwiftUI

/// "Daha" sekmesi — ana sekmelere sığmayan bölümler ve hesap işlemleri.
/// Faz 1: Borçlar + hesaptan çıkış. Sonraki fazlarda Takvim, Banka Dökümü,
/// Fişler, Ayarlar, Profil buraya bağlanacak.
struct MoreView: View {
    @Environment(AppState.self) private var appState

    private let upcoming: [(title: String, icon: String)] = [
        ("Takvim", "calendar"),
        ("Banka Dökümü", "doc.text.magnifyingglass"),
        ("Fişler", "doc.viewfinder"),
    ]

    var body: some View {
        List {
            Section {
                NavigationLink {
                    ProfileView()
                } label: {
                    menuRow("Profil", subtitle: "Hesap bilgilerin ve AI tanımı", icon: "person.crop.circle.fill", tint: Theme.primary)
                }
                NavigationLink {
                    DebtsView()
                } label: {
                    menuRow("Borçlar", subtitle: "Kredi ve kart borçların", icon: "creditcard.fill", tint: Theme.expense)
                }
                NavigationLink {
                    SettingsView()
                } label: {
                    menuRow("Ayarlar", subtitle: "Görünüm, kategoriler, güvenlik", icon: "gearshape.fill", tint: Theme.cyan)
                }
            }

            Section("Yakında") {
                ForEach(upcoming, id: \.title) { item in
                    HStack(spacing: 12) {
                        iconBadge(item.icon, tint: Theme.muted)
                        Text(item.title).foregroundStyle(Theme.muted)
                        Spacer()
                        PillBadge(text: "yakında", color: Theme.muted)
                    }
                }
            }

            Section {
                Button(role: .destructive) {
                    Haptics.light()
                    appState.logout()
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(Theme.destructive)
                            .frame(width: 34, height: 34)
                            .background(Theme.destructive.opacity(0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                        Text("Çıkış Yap").font(.subheadline.weight(.semibold)).foregroundStyle(Theme.destructive)
                        Spacer()
                    }
                }
            }
        }
        .navigationTitle("Daha")
    }

    private func iconBadge(_ systemImage: String, tint: Color) -> some View {
        Image(systemName: systemImage)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(tint)
            .frame(width: 34, height: 34)
            .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private func menuRow(_ title: String, subtitle: String, icon: String, tint: Color) -> some View {
        HStack(spacing: 12) {
            iconBadge(icon, tint: tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink)
                Text(subtitle).font(.caption).foregroundStyle(Theme.muted)
            }
        }
        .padding(.vertical, 4)
    }
}
