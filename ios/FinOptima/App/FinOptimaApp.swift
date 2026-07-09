import SwiftUI

/// FinOptima iOS uygulamasının giriş noktası.
@main
struct FinOptimaApp: App {
    @State private var appState = AppState.shared
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appState)
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
