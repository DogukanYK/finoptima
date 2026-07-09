//
//  FindeksViewModel.swift
//  FinOptima
//
//  `GET /findeks` verisini yükleyen görünüm modeli. Skor, band, faktörler ve
//  öneriler tek bir `FindeksResponse` içinde döner. Ağ çağrısı `APIClient` (actor)
//  üzerinden yapılır; hata mesajları `APIError`'ın Türkçe açıklamasına düşer.
//

import Foundation
import Observation

@MainActor
@Observable
final class FindeksViewModel {

    /// Ekranın yükleme durumu.
    enum State {
        case idle
        case loading
        case loaded(FindeksResponse)
        case failed(String)
    }

    private(set) var state: State = .idle

    private let api: APIClient

    init(api: APIClient = .shared) {
        self.api = api
    }

    // MARK: - Türetilmiş durumlar

    var isIdle: Bool {
        if case .idle = state { return true }
        return false
    }

    var isLoading: Bool {
        if case .loading = state { return true }
        return false
    }

    // MARK: - Yükleme

    /// Yalnızca henüz veri yoksa yükler (sekmeye ilk girişte `.task` için).
    func loadIfNeeded() async {
        guard isIdle else { return }
        await load()
    }

    /// Findeks özetini sunucudan çeker. Mevcut veriyi spinner ile değiştirmemek
    /// için, elde yüklü bir sonuç varsa `loading` durumuna geçmez (pull-to-refresh
    /// akıcı kalır).
    func load() async {
        if case .loaded = state {
            // Sessiz yenileme: mevcut içerik ekranda kalır.
        } else {
            state = .loading
        }

        do {
            let response = try await api.findeks()
            state = .loaded(response)
        } catch let error as APIError {
            state = .failed(error.errorDescription ?? "Findeks bilgisi alınamadı.")
        } catch {
            state = .failed("Findeks bilgisi alınamadı. Lütfen tekrar deneyin.")
        }
    }
}
