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

/// Giriş yapılmış kullanıcı için ana sekmeli arayüz:
/// Panel · Findeks · İşlemler · Asistan · Daha.
struct MainTabView: View {
    var body: some View {
        TabView {
            NavigationStack {
                DashboardView()
            }
            .tabItem {
                Label("Panel", systemImage: "square.grid.2x2")
            }

            NavigationStack {
                FindeksView()
            }
            .tabItem {
                Label("Findeks", systemImage: "gauge.with.needle")
            }

            NavigationStack {
                TransactionsView()
            }
            .tabItem {
                Label("İşlemler", systemImage: "arrow.left.arrow.right")
            }

            NavigationStack {
                AssistantView()
            }
            .tabItem {
                Label("Asistan", systemImage: "sparkles")
            }

            NavigationStack {
                MoreView()
            }
            .tabItem {
                Label("Daha", systemImage: "ellipsis")
            }
        }
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
