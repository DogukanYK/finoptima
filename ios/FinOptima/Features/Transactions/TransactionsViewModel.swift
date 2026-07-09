//
//  TransactionsViewModel.swift
//  FinOptima
//
//  "İşlemler" sekmesinin veri katmanı.
//
//  - GET /transactions'ı keyset (cursor) sayfalamayla okur: `reload()` ilk sayfayı
//    baştan getirir, `loadMore()` `nextCursor` ile bir sonraki sayfayı ekler.
//  - Filtreler (tür + arama) değiştiğinde liste sıfırdan yeniden yüklenir.
//  - GET /refs ile kategori/hesap referanslarını (ekleme formu picker'ları için) çeker.
//  - POST /transactions ile yeni işlem oluşturur, ardından listeyi + toplamları tazeler.
//
//  Eşzamanlılık: @MainActor @Observable — tüm durum ana iş parçacığında güncellenir,
//  ağ G/Ç'si APIClient actor'ünde yapılır. Force-unwrap yok.
//

import Foundation
import Observation

@MainActor
@Observable
final class TransactionsViewModel {

    // MARK: - Liste durumu

    /// Üst düzey yükleme durumu (ilk sayfa / boş liste ekranları için).
    enum ListState: Equatable {
        case idle
        case loading
        case loaded
        case failed(String)
    }

    /// Tür süzgeci — segment kontrolü değerleri.
    enum KindFilter: String, CaseIterable, Identifiable {
        case all
        case income
        case expense

        var id: String { rawValue }

        var title: String {
            switch self {
            case .all: return "Tümü"
            case .income: return "Gelir"
            case .expense: return "Gider"
            }
        }

        /// API'ye gönderilecek `kind` değeri (`all` → filtre yok).
        var apiValue: String? {
            switch self {
            case .all: return nil
            case .income: return "INCOME"
            case .expense: return "EXPENSE"
            }
        }
    }

    // MARK: - Yayınlanan durum

    private(set) var items: [Transaction] = []
    private(set) var totals: Totals?
    private(set) var nextCursor: String?

    /// Ekleme formu picker'ları için referanslar.
    private(set) var categories: [RefCategory] = []
    private(set) var accounts: [RefAccount] = []

    private(set) var state: ListState = .idle
    private(set) var isLoadingMore = false

    /// Kullanıcı süzgeçleri (görünümden iki yönlü bağlanır).
    var kindFilter: KindFilter = .all
    var searchText: String = ""

    // MARK: - Özel

    private let client = APIClient.shared

    /// Yarışan yüklemelerde eski yanıtın yeni listenin üstüne yazmasını engeller.
    private var loadGeneration = 0

    /// Arama kutusu için borçlanmalı (debounce) yeniden yükleme görevi.
    private var searchTask: Task<Void, Never>?

    /// Daha getirilecek sayfa var mı?
    var canLoadMore: Bool { nextCursor != nil }

    /// Süzgeçler etkin mi (boş-liste mesajını uyarlamak için)?
    var hasActiveFilters: Bool {
        kindFilter != .all || !searchText.trimmingCharacters(in: .whitespaces).isEmpty
    }

    // MARK: - Yaşam döngüsü

    /// Sekme ilk göründüğünde: referansları + ilk sayfayı getir (yalnızca bir kez).
    func onAppear() async {
        guard state == .idle else { return }
        async let refs: Void = loadRefs()
        await reload()
        await refs
    }

    // MARK: - Liste yükleme

    /// Listeyi baştan (cursor = nil) yükler. Süzgeç değişiminde ve tazelemede kullanılır.
    func reload() async {
        loadGeneration += 1
        let generation = loadGeneration

        if items.isEmpty {
            state = .loading
        }

        do {
            let response = try await client.transactions(
                kind: kindFilter.apiValue,
                search: trimmedSearch,
                cursor: nil
            )
            // Bu yükleme başlatıldıktan sonra daha yenisi geldiyse sonucu yok say.
            guard generation == loadGeneration else { return }
            items = response.items
            nextCursor = response.nextCursor
            totals = response.totals
            state = .loaded
        } catch {
            guard generation == loadGeneration else { return }
            // Elde veri varsa listeyi koru; yoksa hata ekranı göster.
            if items.isEmpty {
                state = .failed(message(for: error))
            } else {
                state = .loaded
            }
        }
    }

    /// Bir sonraki sayfayı `nextCursor` ile getirir ve mevcut listeye ekler.
    func loadMore() async {
        guard let cursor = nextCursor, !isLoadingMore else { return }
        let generation = loadGeneration
        isLoadingMore = true
        defer { isLoadingMore = false }

        do {
            let response = try await client.transactions(
                kind: kindFilter.apiValue,
                search: trimmedSearch,
                cursor: cursor
            )
            // Arada liste sıfırlandıysa (yeni filtre) eski sayfayı ekleme.
            guard generation == loadGeneration else { return }
            items.append(contentsOf: response.items)
            nextCursor = response.nextCursor
            totals = response.totals
        } catch {
            // Sayfa ekleme hatası sessiz kalır; kullanıcı butona yeniden basabilir.
        }
    }

    /// Kategori + hesap referanslarını yükler (sessiz — hata olsa da liste çalışır).
    func loadRefs() async {
        do {
            let response = try await client.refs()
            categories = response.categories
            accounts = response.accounts
        } catch {
            // Picker'lar boş kalır; işlem yine de açıklama + tutarla oluşturulabilir.
        }
    }

    // MARK: - Süzgeç etkileşimleri

    /// Tür segmenti değişti → listeyi hemen yeniden yükle.
    func kindFilterChanged() async {
        await reload()
    }

    /// Arama metni değişti → 350 ms borçlanmayla yeniden yükle.
    func searchTextChanged() {
        searchTask?.cancel()
        searchTask = Task { [weak self] in
            try? await Task.sleep(for: .milliseconds(350))
            guard let self, !Task.isCancelled else { return }
            await self.reload()
        }
    }

    // MARK: - Oluşturma

    /// Yeni işlem oluşturur ve başarılıysa listeyi + toplamları tazeler.
    /// Hata durumunda çağırana `APIError`/hata yükselir (form uyarı gösterir).
    func create(_ body: CreateTransactionBody) async throws {
        _ = try await client.createTransaction(body)
        await reload()
    }

    // MARK: - Yardımcılar

    private var trimmedSearch: String? {
        let trimmed = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private func message(for error: Error) -> String {
        if let apiError = error as? APIError, let description = apiError.errorDescription {
            return description
        }
        return error.localizedDescription
    }
}
