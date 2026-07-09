//
//  DebtsViewModel.swift
//  FinOptima
//
//  "Borçlar" sekmesinin durum yöneticisi. GET /debts ucundan borç listesini ve
//  toplam bakiyeyi çeker. @MainActor + @Observable olduğundan UI güncellemeleri
//  ana iş parçacığında güvenle yapılır; ağ işi actor olan APIClient'a devredilir.
//

import Foundation
import Observation

@MainActor
@Observable
final class DebtsViewModel {

    /// Yüklemenin üst düzey durumu. Hata mesajı Türkçe, kullanıcıya gösterilebilir.
    enum Phase: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    private(set) var phase: Phase = .idle
    private(set) var debts: [Debt] = []
    private(set) var totals: DebtTotals?

    private let client: APIClient

    init(client: APIClient = .shared) {
        self.client = client
    }

    // MARK: - Türetilmiş değerler

    /// Toplam borç bakiyesi — sunucu toplamı yoksa satırlardan hesaplanır.
    var totalBalance: Double {
        totals?.totalBalance ?? debts.reduce(0) { $0 + $1.balance }
    }

    /// Borç sayısı — sunucu toplamı yoksa liste uzunluğu.
    var count: Int {
        totals?.count ?? debts.count
    }

    var isEmpty: Bool {
        debts.isEmpty
    }

    // MARK: - Yükleme

    /// İlk gösterimde çağrılır; zaten yüklüyse tekrar ağ isteği yapmaz.
    func loadIfNeeded() async {
        if case .loaded = phase { return }
        phase = .loading
        await fetch()
    }

    /// Pull-to-refresh. Mevcut liste ekranda kalır (spinner'a düşülmez);
    /// yalnızca veriler tazelenir.
    func reload() async {
        await fetch()
    }

    /// Hata ekranındaki "Tekrar Dene" için — dolu bir yükleme göstergesiyle yeniden dener.
    func retry() async {
        phase = .loading
        await fetch()
    }

    private func fetch() async {
        do {
            let response = try await client.debts()
            debts = response.items
            totals = response.totals
            phase = .loaded
        } catch let error as APIError {
            handle(message: error.errorDescription ?? "Borçlar yüklenemedi.")
        } catch {
            handle(message: "Borçlar yüklenemedi.")
        }
    }

    /// Hata durumunu uygula: elde veri varsa listeyi koru (yenileme hatasını yut),
    /// yoksa hata ekranını göster.
    private func handle(message: String) {
        if debts.isEmpty {
            phase = .failed(message)
        } else {
            phase = .loaded
        }
    }
}
