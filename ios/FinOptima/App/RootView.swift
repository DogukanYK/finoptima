import SwiftUI

/// Uygulama durumuna göre doğru ekranı gösteren kök görünüm.
struct RootView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        switch appState.phase {
        case .loggedOut:
            LoginView()
        case .locked:
            LockView()
        case .ready:
            MainTabView()
        }
    }
}

// MARK: - Ana sekmeli arayüz

/// Giriş yapılmış kullanıcı için ana arayüz: 4 sekme (Panel · Findeks · İşlemler ·
/// Daha) + ortada yükseltilmiş parlak mavi AI Asistan butonu.
struct MainTabView: View {
    @State private var tab = 0
    @State private var showAssistant = false

    var body: some View {
        TabView(selection: $tab) {
            NavigationStack { DashboardView().toolbar(.hidden, for: .tabBar) }.tag(0)
            NavigationStack { FindeksView().toolbar(.hidden, for: .tabBar) }.tag(1)
            NavigationStack { TransactionsView().toolbar(.hidden, for: .tabBar) }.tag(2)
            NavigationStack { MoreView().toolbar(.hidden, for: .tabBar) }.tag(3)
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            FloatingTabBar(selection: $tab) {
                Haptics.light()
                showAssistant = true
            }
        }
        .fullScreenCover(isPresented: $showAssistant) {
            NavigationStack {
                AssistantView()
                    .toolbar {
                        ToolbarItem(placement: .topBarLeading) {
                            Button { showAssistant = false } label: {
                                Image(systemName: "chevron.down").font(.headline)
                            }
                        }
                    }
            }
        }
    }
}

// MARK: - Merkez AI butonlu özel alt bar

private struct FloatingTabBar: View {
    @Binding var selection: Int
    let onAssistant: () -> Void

    var body: some View {
        HStack(spacing: 0) {
            tabButton(0, icon: "square.grid.2x2", label: "Panel")
            tabButton(1, icon: "gauge.with.needle", label: "Findeks")
            Color.clear.frame(width: 64)   // merkez FAB için boşluk
            tabButton(2, icon: "arrow.left.arrow.right", label: "İşlemler")
            tabButton(3, icon: "ellipsis", label: "Daha")
        }
        .frame(height: 52)
        .padding(.top, 8)
        .background(
            Rectangle()
                .fill(.bar)
                .overlay(Divider().overlay(Theme.line), alignment: .top)
                .ignoresSafeArea(edges: .bottom)
        )
        .overlay(alignment: .top) {
            Button(action: onAssistant) {
                Image(systemName: "sparkles")
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(width: 60, height: 60)
                    .background(Theme.brandGradient, in: Circle())
                    .overlay(Circle().strokeBorder(Theme.bg, lineWidth: 5))
                    .shadow(color: Theme.primary.opacity(0.5), radius: 12, x: 0, y: 6)
                    .accessibilityLabel("AI Asistan")
            }
            .buttonStyle(PressableStyle())
            .offset(y: -26)
        }
    }

    private func tabButton(_ idx: Int, icon: String, label: String) -> some View {
        Button {
            Haptics.light()
            selection = idx
        } label: {
            VStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: 20, weight: .medium))
                Text(label).font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(selection == idx ? Theme.primary : Theme.muted)
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Kilit ekranı

/// Face ID / cihaz parolası ile kilit açma ekranı.
struct LockView: View {
    @Environment(AppState.self) private var appState
    @State private var isAuthenticating = false

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            Image(systemName: "lock.shield")
                .font(.system(size: 64, weight: .semibold))
                .foregroundStyle(.tint)

            VStack(spacing: 8) {
                Text("FinOptima")
                    .font(.largeTitle.bold())
                Text("Devam etmek için kimliğinizi doğrulayın")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            Button {
                Task { await runUnlock() }
            } label: {
                Label("Face ID ile Aç", systemImage: "faceid")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(isAuthenticating)

            Button("Çıkış Yap", role: .destructive) {
                appState.logout()
            }
            .padding(.top, 4)
        }
        .padding(24)
        .task {
            // Ekran göründüğünde kilit açmayı otomatik dene.
            await runUnlock()
        }
    }

    private func runUnlock() async {
        guard !isAuthenticating else { return }
        isAuthenticating = true
        await appState.unlock()
        isAuthenticating = false
    }
}
