//
//  TransactionsView.swift
//  FinOptima
//
//  "İşlemler" sekmesi — gelir/gider listesi.
//
//  - Üstte tür segmenti + gelir/gider toplam kartları.
//  - Aranabilir (`.searchable`) ve tazelenebilir (`.refreshable`) liste.
//  - Keyset sayfalama: liste sonunda "Daha fazla yükle" butonu (`nextCursor`).
//  - Sağ üstteki "+" ile `AddTransactionSheet` açılır (POST /transactions).
//
//  Standart SwiftUI (List / Form / sheet). Custom "liquid glass" yok, Türkçe UI.
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
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(Theme.bg)
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
                    showingAdd = true
                } label: {
                    Label("Ekle", systemImage: "plus")
                }
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
            Picker("Tür", selection: $vm.kindFilter) {
                ForEach(TransactionsViewModel.KindFilter.allCases) { filter in
                    Text(filter.title).tag(filter)
                }
            }
            .pickerStyle(.segmented)
            .onChange(of: vm.kindFilter) { _, _ in
                Task { await viewModel.kindFilterChanged() }
            }
            .listRowInsets(EdgeInsets(top: 8, leading: 0, bottom: 8, trailing: 0))
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
                .listRowInsets(EdgeInsets(top: 0, leading: 0, bottom: 8, trailing: 0))
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
                    .listRowBackground(Color.clear)
            }

        case .failed(let message) where viewModel.items.isEmpty:
            Section {
                errorRow(message)
                    .listRowBackground(Color.clear)
            }

        default:
            if viewModel.items.isEmpty {
                Section {
                    emptyRow
                        .listRowBackground(Color.clear)
                }
            } else {
                Section {
                    ForEach(viewModel.items) { transaction in
                        TransactionRow(transaction: transaction)
                    }
                    if viewModel.canLoadMore {
                        loadMoreRow
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
            Spacer()
        }
        .padding(.vertical, 32)
    }

    private func errorRow(_ message: String) -> some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
                .foregroundStyle(Theme.expense)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)
            Button("Tekrar Dene") {
                Task { await viewModel.reload() }
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 32)
    }

    private var emptyRow: some View {
        ContentUnavailableView {
            Label("İşlem yok", systemImage: "tray")
        } description: {
            Text(viewModel.hasActiveFilters
                 ? "Süzgeçlere uyan işlem bulunamadı."
                 : "Henüz işlem eklenmemiş. Sağ üstteki + ile ekleyebilirsiniz.")
        }
    }

    private var loadMoreRow: some View {
        Button {
            Task { await viewModel.loadMore() }
        } label: {
            HStack {
                Spacer()
                if viewModel.isLoadingMore {
                    ProgressView()
                    Text("Yükleniyor…")
                } else {
                    Text("Daha fazla yükle")
                        .fontWeight(.semibold)
                }
                Spacer()
            }
        }
        .disabled(viewModel.isLoadingMore)
        .tint(Theme.primary)
    }
}

// MARK: - İşlem satırı

/// Tek bir işlem satırı: kategori rozeti, açıklama, tarih/hesap ve işaretli tutar.
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

    private var subtitle: String? {
        let date = Format.shortDate(transaction.date)
        if let account = transaction.account?.label, !account.isEmpty {
            return "\(date) · \(account)"
        }
        return date
    }

    var body: some View {
        HStack(spacing: 12) {
            glyph

            VStack(alignment: .leading, spacing: 2) {
                Text(transaction.description)
                    .font(.body)
                    .foregroundStyle(Theme.ink)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    if let category = transaction.category?.name, !category.isEmpty {
                        Text(category)
                            .foregroundStyle(categoryColor)
                    }
                    if let subtitle {
                        if transaction.category?.name.isEmpty == false {
                            Text("·").foregroundStyle(Theme.muted)
                        }
                        Text(subtitle)
                            .foregroundStyle(Theme.muted)
                    }
                }
                .font(.caption)
                .lineLimit(1)
            }

            Spacer(minLength: 8)

            AmountText(value: signedAmount, signed: true, color: tint, font: .callout)
        }
        .padding(.vertical, 4)
    }

    /// Kategori renginde daire içinde ikon/emoji; boşsa gelir/gider oku.
    private var glyph: some View {
        ZStack {
            Circle()
                .fill(categoryColor.opacity(0.14))
                .frame(width: 38, height: 38)

            if let icon = transaction.category?.icon, !icon.isEmpty {
                Text(icon)
                    .font(.callout)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .frame(width: 24, height: 24)
            } else {
                Image(systemName: isIncome ? "arrow.down" : "arrow.up")
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(categoryColor)
            }
        }
    }
}
