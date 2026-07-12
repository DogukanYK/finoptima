import Foundation
import Observation

/// Profil ekranının veri kaynağı. `GET /profile` okur, `PATCH /profile` ile ad ve
/// AI profil tanımını günceller.
@MainActor
@Observable
final class ProfileViewModel {
    private(set) var profile: ProfileResponse?
    private(set) var isLoading = false
    private(set) var saving = false
    private(set) var errorMessage: String?
    var savedFlash = false

    private let api: APIClient
    init(api: APIClient = .shared) { self.api = api }

    func loadIfNeeded() async {
        guard profile == nil else { return }
        await load()
    }

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            profile = try await api.profile()
        } catch {
            errorMessage = "Profil yüklenemedi."
        }
    }

    func save(name: String, aiIdentity: String) async {
        saving = true
        errorMessage = nil
        defer { saving = false }
        do {
            _ = try await api.updateProfile(ProfileUpdateBody(name: name, aiIdentity: aiIdentity))
            savedFlash = true
            await load()
        } catch {
            errorMessage = "Kaydedilemedi. Lütfen tekrar dene."
        }
    }
}
