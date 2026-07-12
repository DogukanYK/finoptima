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
        ("Ayarlar", "gearshape"),
        ("Profil", "person.crop.circle"),
    ]

    var body: some View {
        List {
            Section {
                NavigationLink {
                    DebtsView()
                } label: {
                    Label("Borçlar", systemImage: "creditcard")
                }
            }

            Section("Yakında") {
                ForEach(upcoming, id: \.title) { item in
                    HStack {
                        Label(item.title, systemImage: item.icon)
                        Spacer()
                        Text("yakında")
                            .font(.caption)
                            .foregroundStyle(Theme.muted)
                    }
                    .foregroundStyle(Theme.muted)
                }
            }

            Section {
                Button(role: .destructive) {
                    appState.logout()
                } label: {
                    Label("Çıkış Yap", systemImage: "rectangle.portrait.and.arrow.right")
                }
            }
        }
        .navigationTitle("Daha")
    }
}
