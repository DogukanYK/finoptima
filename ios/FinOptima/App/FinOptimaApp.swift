import SwiftUI

/// FinOptima iOS uygulamasının giriş noktası.
@main
struct FinOptimaApp: App {
    @State private var appState = AppState.shared
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("appearance") private var appearance = "system"

    private var preferredScheme: ColorScheme? {
        switch appearance {
        case "light": return .light
        case "dark": return .dark
        default: return nil // sistem
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
                .preferredColorScheme(preferredScheme)
        }
        .onChange(of: scenePhase) { _, newPhase in
            // Uygulama arka plana alındığında oturumu kilitle;
            // öne geldiğinde LockView yeniden Face ID isteyecek.
            if newPhase == .background {
                appState.lock()
            }
        }
    }
}
