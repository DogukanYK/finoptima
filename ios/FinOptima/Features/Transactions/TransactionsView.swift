//
//  TransactionsView.swift
//  FinOptima
//
//  "İşlemler" sekmesi — gelir/gider listesi (premium sunum).
//
//  - Üstte özel kapsül filtre chip'leri + gelir/gider StatCard'ları.
//  - Aranabilir (`.searchable`) ve tazelenebilir (`.refreshable`) kart listesi.
//  - Keyset sayfalama: liste sonunda "Daha fazla yükle" butonu (`nextCursor`).
//  - Sağ üstteki "+" ile `AddTransactionSheet` açılır (POST /transactions).
//
//  Yalnızca sunum düzenlendi; veri akışı / ViewModel imzaları aynen korunur.
//

import SwiftUI

struct TransactionsView: View {

    @State private var viewModel = TransactionsViewModel()
    @State private var showingAdd = false

    var body: some View {
        @Bindable var vm = viewModel

        List {
            summarySection
            transactionsSection
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("İşlemler")
        .searchable(
            text: $vm.searchText,
            placement: .navigationBarDrawer(displayMode: .automatic),
            prompt: "Açıklamada ara"
        )
        .onChange(of: vm.searchText) { _, _ in
            vm.searchTextChanged()
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Haptics.light()
                    showingAdd = true
                } label: {
                    Image(systemName: "plus")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(.white)
                        .frame(width: 30, height: 30)
                        .background(Theme.brandGradient, in: Circle())
                        .shadow(color: Theme.primary.opacity(0.35), radius: 6, x: 0, y: 3)
                }
                .accessibilityLabel("İşlem Ekle")
            }
        }
        .refreshable {
            await viewModel.reload()
        }
        .task {
            await viewModel.onAppear()
        }
        .sheet(isPresented: $showingAdd) {
            AddTransactionSheet(
                categories: viewModel.categories,
                accounts: viewModel.accounts,
                onCreate: { body in
                    try await viewModel.create(body)
                }
            )
        }
    }

    // MARK: - Özet + süzgeç bölümü

    private var summarySection: some View {
        @Bindable var vm = viewModel

        return Section {
            // Filtre chip'leri (kapsül; seçili = marka mavisi dolgulu).
            HStack(spacing: 8) {
                ForEach(TransactionsViewModel.KindFilter.allCases) { filter in
                    FilterChip(title: filter.title, isSelected: vm.kindFilter == filter) {
                        guard vm.kindFilter != filter else { return }
                        Haptics.light()
                        vm.kindFilter = filter
                        Task { await viewModel.kindFilterChanged() }
                    }
                }
            }
            .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 12, trailing: 16))
            .listRowSeparator(.hidden)
            .listRowBackground(Color.clear)

            if let totals = viewModel.totals {
                HStack(spacing: 12) {
                    StatCard(
                        title: "Gelir",
                        amount: totals.income,
                        icon: "arrow.down.circle.fill",
                        tint: Theme.income
                    )
                    StatCard(
                        title: "Gider",
                        amount: totals.expense,
                        icon: "arrow.up.circle.fill",
                        tint: Theme.expense
                    )
                }
                .listRowInsets(EdgeInsets(top: 0, leading: 16, bottom: 6, trailing: 16))
                .listRowSeparator(.hidden)
                .listRowBackground(Color.clear)
            }
        }
    }

    // MARK: - İşlem listesi bölümü

    @ViewBuilder
    private var transactionsSection: some View {
        switch viewModel.state {
        case .loading where viewModel.items.isEmpty:
            Section {
                loadingRow
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
            }

        case .failed(let message) where viewModel.items.isEmpty:
            Section {
                errorRow(message)
                    .listRowSeparator(.hidden)
                    .listRowBackground(Color.clear)
            }

        default:
            if viewModel.items.isEmpty {
                Section {
                    emptyRow
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)
                }
            } else {
                Section {
                    SectionHeader(title: "Hareketler")
                        .listRowInsets(EdgeInsets(top: 4, leading: 16, bottom: 4, trailing: 16))
                        .listRowSeparator(.hidden)
                        .listRowBackground(Color.clear)

                    ForEach(viewModel.items) { transaction in
                        TransactionRow(transaction: transaction)
                            .listRowInsets(EdgeInsets(top: 5, leading: 16, bottom: 5, trailing: 16))
                            .listRowSeparator(.hidden)
                            .listRowBackground(Color.clear)
                    }
                    if viewModel.canLoadMore {
                        loadMoreRow
                            .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 16, trailing: 16))
                            .listRowSeparator(.hidden)
                            .listRowBackground(Color.clear)
                    }
                }
            }
        }
    }

    // MARK: - Yardımcı satırlar

    private var loadingRow: some View {
        HStack {
            Spacer()
            ProgressView("Yükleniyor…")
                .tint(Theme.primary)
            Spacer()
        }
        .padding(.vertical, 40)
    }

    private func errorRow(_ message: String) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 34, weight: .semibold))
                .foregroundStyle(Theme.expense)
                .frame(width: 64, height: 64)
                .background(Theme.expense.opacity(0.12), in: Circle())
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            Button {
                Haptics.light()
                Task { await viewModel.reload() }
            } label: {
                Label("Tekrar Dene", systemImage: "arrow.clockwise")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 11)
                    .background(Theme.brandGradient, in: Capsule())
            }
            .buttonStyle(PressableStyle())
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }

    private var emptyRow: some View {
        VStack(spacing: 14) {
            Image(systemName: "tray")
                .font(.system(size: 34, weight: .semibold))
                .foregroundStyle(Theme.primary)
                .frame(width: 64, height: 64)
                .background(Theme.primarySoft, in: Circle())
            Text("İşlem yok")
                .font(.display(19, .bold))
                .foregroundStyle(Theme.ink)
            Text(viewModel.hasActiveFilters
                 ? "Süzgeçlere uyan işlem bulunamadı."
                 : "Henüz işlem eklenmemiş. Sağ üstteki + ile ekleyebilirsiniz.")
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 44)
        .padding(.horizontal, 24)
    }

    private var loadMoreRow: some View {
        Button {
            Haptics.light()
            Task { await viewModel.loadMore() }
        } label: {
            HStack(spacing: 8) {
                Spacer()
                if viewModel.isLoadingMore {
                    ProgressView().tint(Theme.primary)
                    Text("Yükleniyor…")
                } else {
                    Image(systemName: "arrow.down.circle")
                    Text("Daha fazla yükle")
                }
                Spacer()
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(Theme.primary)
            .padding(.vertical, 13)
            .frame(maxWidth: .infinity)
            .background(Theme.primarySoft, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(PressableStyle())
        .disabled(viewModel.isLoadingMore)
    }
}

// MARK: - Filtre chip'i

/// Kapsül biçimli tür süzgeci; seçili olan marka mavisiyle dolar.
private struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(isSelected ? .white : Theme.muted)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(isSelected ? AnyShapeStyle(Theme.primary) : AnyShapeStyle(Theme.surface2))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .strokeBorder(Theme.line.opacity(isSelected ? 0 : 0.7), lineWidth: 1)
                )
                .shadow(color: Theme.primary.opacity(isSelected ? 0.25 : 0), radius: 8, x: 0, y: 4)
        }
        .buttonStyle(PressableStyle())
    }
}

// MARK: - İşlem satırı

/// Tek bir işlem satırı: yön rozeti, açıklama, kategori/tarih ve işaretli tutar.
private struct TransactionRow: View {
    let transaction: Transaction

    private var isIncome: Bool { transaction.kind == "INCOME" }

    /// Görüntülenecek işaretli tutar (gider negatif gösterilir).
    private var signedAmount: Double {
        isIncome ? abs(transaction.amount) : -abs(transaction.amount)
    }

    private var tint: Color { isIncome ? Theme.income : Theme.expense }

    private var categoryColor: Color {
        if let hex = transaction.category?.color, !hex.isEmpty {
            return Color(hex: hex)
        }
        return tint
    }

    private var categoryName: String? {
        guard let name = transaction.category?.name, !name.isEmpty else { return nil }
        return name
    }

    private var metaText: String {
        var parts: [String] = []
        if let category = categoryName { parts.append(category) }
        parts.append(Format.shortDate(transaction.date))
        if let account = transaction.account?.label, !account.isEmpty {
            parts.append(account)
        }
        return parts.joined(separator: " · ")
    }

    var body: some View {
        HStack(spacing: 12) {
            glyph

            VStack(alignment: .leading, spacing: 3) {
                Text(transaction.description)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)

                HStack(spacing: 5) {
                    if categoryName != nil {
                        Circle()
                            .fill(categoryColor)
                            .frame(width: 6, height: 6)
                    }
                    Text(metaText)
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                        .lineLimit(1)
                }
            }

            Spacer(minLength: 8)

            AmountText(value: signedAmount, signed: true, color: tint, size: 16, weight: .bold)
        }
        .card(padding: 14, elevated: false)
    }

    /// Yön rozeti: gelir yeşil (arrow.down) / gider kırmızı (arrow.up), yumuşak daire.
    private var glyph: some View {
        Image(systemName: isIncome ? "arrow.down" : "arrow.up")
            .font(.footnote.weight(.bold))
            .foregroundStyle(tint)
            .frame(width: 40, height: 40)
            .background(tint.opacity(0.14), in: Circle())
    }
}
