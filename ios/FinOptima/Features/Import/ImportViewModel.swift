import Foundation
import Observation

/// Banka dökümü import akışı: dosya/foto yükle → AI okur → satırları gözden geçir
/// → seçilenleri kaydet.
@MainActor
@Observable
final class ImportViewModel {
    enum Phase { case idle, uploading, review, committing, done }

    private(set) var phase: Phase = .idle
    private(set) var rows: [ImportRow] = []
    private(set) var included: Set<String> = []
    private(set) var detectedBank: String?
    private(set) var fileName = ""
    private(set) var imported = 0
    private(set) var errorMessage: String?

    private let api: APIClient
    init(api: APIClient = .shared) { self.api = api }

    var includedCount: Int { included.count }
    func isIncluded(_ row: ImportRow) -> Bool { included.contains(row.id) }

    func toggle(_ row: ImportRow) {
        if included.contains(row.id) { included.remove(row.id) } else { included.insert(row.id) }
    }

    func parse(data: Data, fileName: String, mimeType: String) async {
        phase = .uploading
        errorMessage = nil
        do {
            let res = try await api.importStatement(fileData: data, fileName: fileName, mimeType: mimeType)
            if res.ok, let rows = res.rows, !rows.isEmpty {
                self.rows = rows
                // Varsayılan: mükerrer olmayanları işaretle.
                self.included = Set(rows.filter { !$0.duplicate }.map { $0.id })
                self.detectedBank = res.detectedBank
                self.fileName = res.fileName ?? fileName
                phase = .review
            } else {
                errorMessage = res.error ?? "Belgeden işlem çıkarılamadı."
                phase = .idle
            }
        } catch let e as APIError {
            errorMessage = e.errorDescription ?? "Yükleme başarısız oldu."
            phase = .idle
        } catch {
            errorMessage = "Yükleme başarısız oldu."
            phase = .idle
        }
    }

    func commit() async {
        let selected = rows
            .filter { included.contains($0.id) }
            .map { row -> ImportRow in
                var copy = row
                // Kullanıcı mükerrer bir satırı bilerek seçtiyse force ile geç.
                copy.force = row.duplicate ? true : nil
                return copy
            }
        guard !selected.isEmpty else { return }
        phase = .committing
        errorMessage = nil
        do {
            let res = try await api.commitImport(
                ImportCommitBody(bankName: detectedBank ?? "", fileName: fileName, rows: selected, newAccount: nil)
            )
            imported = res.imported
            phase = .done
        } catch {
            errorMessage = "Kaydedilemedi. Tekrar dener misin?"
            phase = .review
        }
    }

    func reset() {
        phase = .idle
        rows = []
        included = []
        detectedBank = nil
        fileName = ""
        imported = 0
        errorMessage = nil
    }
}
