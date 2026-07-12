import SwiftUI

/// "Daha" sekmesi — ana sekmelere sığmayan bölümler ve hesap işlemleri.
/// Faz 1: Borçlar + hesaptan çıkış. Sonraki fazlarda Takvim, Banka Dökümü,
/// Fişler, Ayarlar, Profil buraya bağlanacak.
struct MoreView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        List {
            Section {
                NavigationLink {
                    SupportListView()
                } label: {
                    menuRow("Destek", subtitle: "Sorun bildir, AI'dan yardım al", icon: "lifepreserver.fill", tint: Theme.primary)
                }
                NavigationLink {
                    ImportView()
                } label: {
                    menuRow("Banka Dökümü", subtitle: "Ekstre yükle, AI işlemleri çıkarsın", icon: "doc.text.viewfinder", tint: Theme.accent)
                }
                NavigationLink {
                    ReceiptView()
                } label: {
                    menuRow("Fişler", subtitle: "Fiş fotoğrafı → AI harcama", icon: "doc.viewfinder", tint: Theme.accent)
                }
                NavigationLink {
                    CalendarView()
                } label: {
                    menuRow("Takvim", subtitle: "Fatura, hatırlatma ve ödemeler", icon: "calendar", tint: Theme.primary)
                }
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
