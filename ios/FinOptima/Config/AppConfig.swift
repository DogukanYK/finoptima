import Foundation

/// Uygulama geneli yapılandırma sabitleri.
enum AppConfig {
    /// Backend mobil API taban adresi. Tüm uçlar bu adresin altında çağrılır
    /// (ör. `\(baseURL.absoluteString)/auth/login`).
    ///
    /// Not: geçersiz bir literal asla gerçekleşmez; `??` yalnızca force-unwrap
    /// kullanmamak için güvenli bir yedek sağlar.
    static let baseURL: URL = URL(string: "https://www.finoptima.dev/api/mobile")
        ?? URL(fileURLWithPath: "/")
}
