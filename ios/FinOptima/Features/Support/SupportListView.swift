import SwiftUI

/// Destek ana ekranı — üstte "AI'ya Sor" gradyan kartı, altında talep listesi.
struct SupportListView: View {
    @State private var model = SupportListViewModel()
    @State private var showNewTicket = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                aiCard
                ticketsSection
            }
            .padding(16)
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Destek")
        .refreshable { await model.load() }
        .task { await model.loadIfNeeded() }
        .sheet(isPresented: $showNewTicket) {
            NewTicketSheet { await model.load() }
        }
    }

    // MARK: - AI'ya Sor kartı

    private var aiCard: some View {
        NavigationLink {
            SupportAIChatView(onTicketCreated: { Task { await model.load() } })
        } label: {
            HStack(spacing: 14) {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(.white.opacity(0.18))
                    .frame(width: 48, height: 48)
                    .overlay(
                        Image(systemName: "sparkles")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)
                    )
                VStack(alignment: .leading, spacing: 3) {
                    Text("AI'ya Sor")
                        .font(.display(19, .bold))
                        .foregroundStyle(.white)
                    Text("Sorununu anlat, anında yanıt al. Çözülmezse insan desteğe aktarılır.")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.85))
                        .multilineTextAlignment(.leading)
                }
                Spacer(minLength: 4)
                Image(systemName: "chevron.right")
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(.white.opacity(0.8))
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous))
            .shadow(color: Theme.primary.opacity(0.3), radius: 14, x: 0, y: 8)
        }
        .buttonStyle(PressableStyle())
    }

    // MARK: - Talep listesi

    @ViewBuilder
    private var ticketsSection: some View {
        HStack(alignment: .firstTextBaseline) {
            Text("Taleplerim")
                .font(.display(19, .bold))
                .foregroundStyle(Theme.ink)
            Spacer()
            Button {
                Haptics.light()
                showNewTicket = true
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "plus")
                    Text("Yeni Talep")
                }
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Theme.primary)
                .padding(.horizontal, 12).padding(.vertical, 7)
                .background(Theme.primarySoft, in: Capsule())
            }
            .buttonStyle(PressableStyle())
        }

        if let error = model.errorMessage, model.tickets.isEmpty {
            Text(error)
                .font(.footnote)
                .foregroundStyle(Theme.destructive)
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.vertical, 24)
        } else if model.isLoading && model.tickets.isEmpty {
            ProgressView("Yükleniyor…")
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
        } else if model.tickets.isEmpty {
            ContentUnavailableView {
                Label("Henüz talebin yok", systemImage: "lifepreserver")
            } description: {
                Text("Bir sorun yaşadığında AI'ya sorabilir veya talep oluşturabilirsin.")
            } actions: {
                Button("Yeni Talep") { showNewTicket = true }
                    .buttonStyle(.borderedProminent)
            }
            .padding(.vertical, 12)
        } else {
            VStack(spacing: 10) {
                ForEach(model.tickets) { ticket in
                    NavigationLink {
                        SupportThreadView(ticket: ticket)
                    } label: {
                        TicketRow(ticket: ticket)
                    }
                    .buttonStyle(PressableStyle())
                }
            }
        }
    }
}

// MARK: - Talep satırı

private struct TicketRow: View {
    let ticket: SupportTicketDTO

    private var dateLabel: String {
        let iso = ticket.lastMessageAt ?? ticket.createdAt
        return Format.shortDate(String(iso.prefix(10)))
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 7) {
                    if ticket.unread {
                        Circle()
                            .fill(Theme.primary)
                            .frame(width: 8, height: 8)
                    }
                    Text("#\(ticket.shortId)")
                        .font(.display(13, .bold))
                        .foregroundStyle(Theme.muted)
                    Text(ticket.subject)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)
                }
                HStack(spacing: 6) {
                    Text(dateLabel)
                    if let cat = SupportCategory.label(for: ticket.category) {
                        Text("·")
                        Text(cat)
                    }
                    if ticket.lastMessageAuthor == "AGENT" {
                        Text("·")
                        Text("Destek yanıtladı")
                    }
                }
                .font(.caption)
                .foregroundStyle(Theme.muted)
                .lineLimit(1)
            }
            Spacer(minLength: 8)
            PillBadge(
                text: SupportStatus.label(ticket.status),
                color: SupportStatus.color(ticket.status)
            )
        }
        .card(padding: 14, radius: 16, elevated: false)
    }
}
