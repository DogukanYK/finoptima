import SwiftUI

/// Talep mesajlaşma ekranı — balonlar + alt giriş çubuğu + 6 sn poll.
struct SupportThreadView: View {
    @State private var model: SupportThreadViewModel
    @State private var showConsentSheet = false
    @State private var showRevokeAlert = false
    @FocusState private var inputFocused: Bool

    private let shortId: Int
    private let subject: String

    init(ticket: SupportTicketDTO) {
        _model = State(initialValue: SupportThreadViewModel(ticketId: ticket.id))
        shortId = ticket.shortId
        subject = ticket.subject
    }

    var body: some View {
        VStack(spacing: 0) {
            messageList
            if let error = model.errorMessage, !model.messages.isEmpty {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(Theme.destructive)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 16).padding(.top, 6)
            }
            inputBar
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) {
                VStack(spacing: 1) {
                    Text("#\(shortId)")
                        .font(.display(15, .bold))
                        .foregroundStyle(Theme.ink)
                    Text(subject)
                        .font(.caption2)
                        .foregroundStyle(Theme.muted)
                        .lineLimit(1)
                }
            }
        }
        .sheet(isPresented: $showConsentSheet) {
            ConsentSheet { hours, scopes in
                try await model.grantConsent(hours: hours, scopes: scopes)
            }
        }
        .alert("İzni geri al", isPresented: $showRevokeAlert) {
            Button("Vazgeç", role: .cancel) {}
            Button("Geri Al", role: .destructive) {
                Haptics.light()
                Task { await model.revokeConsent() }
            }
        } message: {
            Text("Destek ekibinin verilerine erişimi hemen kapanacak. İstediğin zaman yeniden izin verebilirsin.")
        }
        // `.task` görünüm kapanınca otomatik iptal edilir → poll da durur
        // (onDisappear ile timer iptalinin structured-concurrency eşdeğeri).
        .task {
            await model.load()
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 6_000_000_000)
                if Task.isCancelled { break }
                await model.poll()
            }
        }
    }

    // MARK: - Mesaj listesi

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    ConsentCard(
                        consent: model.consent,
                        busy: model.consentBusy,
                        onGrant: {
                            Haptics.light()
                            showConsentSheet = true
                        },
                        onRevoke: { showRevokeAlert = true }
                    )
                    .padding(.bottom, 4)

                    if let status = model.status {
                        PillBadge(
                            text: SupportStatus.label(status),
                            color: SupportStatus.color(status)
                        )
                        .frame(maxWidth: .infinity)
                        .padding(.bottom, 2)
                    }
                    if model.isLoading && model.messages.isEmpty {
                        ProgressView("Yükleniyor…").padding(.vertical, 30)
                    } else if let error = model.errorMessage, model.messages.isEmpty {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(Theme.destructive)
                            .padding(.vertical, 30)
                    }
                    ForEach(model.messages) { msg in
                        MessageBubble(message: msg).id(msg.id)
                    }
                }
                .padding(16)
            }
            .scrollDismissesKeyboard(.interactively)
            .onChange(of: model.messages.count) {
                withAnimation {
                    if let last = model.messages.last {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
        }
    }

    // MARK: - Giriş çubuğu

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField("Mesajını yaz…", text: $model.input, axis: .vertical)
                .lineLimit(1...4)
                .font(.subheadline)
                .focused($inputFocused)
                .padding(.horizontal, 15).padding(.vertical, 11)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .strokeBorder(inputFocused ? Theme.primary.opacity(0.5) : Theme.line, lineWidth: 1)
                )

            let canSend = !model.sending && !model.input.trimmingCharacters(in: .whitespaces).isEmpty
            Button {
                Haptics.light()
                Task { await model.send() }
            } label: {
                Image(systemName: "arrow.up")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Theme.brandGradient, in: Circle())
                    .shadow(color: Theme.primary.opacity(canSend ? 0.35 : 0), radius: 8, x: 0, y: 4)
            }
            .buttonStyle(PressableStyle())
            .disabled(!canSend)
            .opacity(canSend ? 1 : 0.45)
            .animation(.easeInOut(duration: 0.15), value: canSend)
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(.bar)
    }
}

// MARK: - Veri erişim izni kartı

/// Talebin başındaki izin durumu: kapalıysa "İzin ver", açıksa kapsamlar +
/// bitiş tarihi + "İzni geri al".
private struct ConsentCard: View {
    let consent: SupportConsentDTO?
    let busy: Bool
    let onGrant: () -> Void
    let onRevoke: () -> Void

    var body: some View {
        if let consent {
            activeCard(consent)
        } else {
            closedCard
        }
    }

    // İzin yok — kilitli.
    private var closedCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                icon("lock.fill", tint: Theme.muted)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Veri erişimi kapalı")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                    Text("Destek ekibi verilerini göremiyor.")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                }
                Spacer(minLength: 0)
            }
            Button(action: onGrant) {
                Text("İzin ver")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Theme.primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 9)
                    .background(Theme.primarySoft, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .buttonStyle(PressableStyle())
            .disabled(busy)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card(padding: 14, elevated: false)
    }

    // İzin aktif — kapsamlar + bitiş.
    private func activeCard(_ consent: SupportConsentDTO) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 10) {
                icon("checkmark.shield.fill", tint: Theme.accent)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Erişim izni aktif")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                    Text("\(ConsentFormat.dateTime(consent.expiresAt)) tarihine kadar")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                }
                Spacer(minLength: 0)
            }

            if !consent.scopes.isEmpty {
                // Kapsam rozetleri — dar ekranda alt satıra sarar.
                FlowRow(spacing: 6) {
                    ForEach(consent.scopes, id: \.self) { scope in
                        PillBadge(text: SupportConsentScope.label(for: scope), color: Theme.accent)
                    }
                }
            }

            Button(action: onRevoke) {
                HStack(spacing: 6) {
                    if busy {
                        ProgressView().controlSize(.mini).tint(Theme.destructive)
                    }
                    Text("İzni geri al")
                        .font(.footnote.weight(.semibold))
                }
                .foregroundStyle(Theme.destructive)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(Theme.destructive.opacity(0.1), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .buttonStyle(PressableStyle())
            .disabled(busy)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card(padding: 14, elevated: false)
    }

    private func icon(_ name: String, tint: Color) -> some View {
        Image(systemName: name)
            .font(.footnote.weight(.bold))
            .foregroundStyle(tint)
            .frame(width: 32, height: 32)
            .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}

/// Sığmayan öğeleri alt satıra taşıyan basit akış düzeni (rozetler için).
private struct FlowRow: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, lineHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > 0, x + size.width > maxWidth {
                x = 0
                y += lineHeight + spacing
                lineHeight = 0
            }
            x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
        }
        return CGSize(width: maxWidth == .infinity ? x : maxWidth, height: y + lineHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX, y = bounds.minY, lineHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x > bounds.minX, x + size.width > bounds.maxX {
                x = bounds.minX
                y += lineHeight + spacing
                lineHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            lineHeight = max(lineHeight, size.height)
        }
    }
}

// MARK: - Mesaj balonu

private struct MessageBubble: View {
    let message: SupportMessageDTO

    var body: some View {
        switch message.author {
        case "USER": userBubble
        case "SYSTEM": systemLine
        default: agentBubble // AGENT | AI
        }
    }

    private var isAI: Bool { message.author == "AI" }

    // Kullanıcı — sağda, marka mavisi, beyaz metin.
    private var userBubble: some View {
        HStack {
            Spacer(minLength: 48)
            VStack(alignment: .trailing, spacing: 3) {
                Text(message.body)
                    .font(.subheadline)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 14).padding(.vertical, 11)
                    .background(
                        Theme.primary,
                        in: UnevenRoundedRectangle(
                            topLeadingRadius: 18, bottomLeadingRadius: 18,
                            bottomTrailingRadius: 6, topTrailingRadius: 18, style: .continuous
                        )
                    )
                Text(Self.timeLabel(message.createdAt))
                    .font(.caption2)
                    .foregroundStyle(Theme.muted)
            }
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
    }

    // Destek (AGENT) / AI — solda, yüzey renkli kart balon + başlık.
    private var agentBubble: some View {
        HStack(alignment: .top, spacing: 8) {
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .fill(isAI ? AnyShapeStyle(Theme.brandGradient) : AnyShapeStyle(Theme.surface2))
                .frame(width: 28, height: 28)
                .overlay(
                    Image(systemName: isAI ? "sparkles" : "person.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(isAI ? AnyShapeStyle(.white) : AnyShapeStyle(Theme.muted))
                )
            VStack(alignment: .leading, spacing: 3) {
                Text(isAI ? "AI Asistan" : "Destek")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(Theme.muted)
                Text(message.body)
                    .font(.subheadline)
                    .foregroundStyle(Theme.ink)
                    .padding(.horizontal, 14).padding(.vertical, 11)
                    .background(
                        Theme.surface,
                        in: UnevenRoundedRectangle(
                            topLeadingRadius: 6, bottomLeadingRadius: 18,
                            bottomTrailingRadius: 18, topTrailingRadius: 18, style: .continuous
                        )
                    )
                    .overlay(
                        UnevenRoundedRectangle(
                            topLeadingRadius: 6, bottomLeadingRadius: 18,
                            bottomTrailingRadius: 18, topTrailingRadius: 18, style: .continuous
                        )
                        .strokeBorder(Theme.line.opacity(0.7), lineWidth: 1)
                    )
                Text(Self.timeLabel(message.createdAt))
                    .font(.caption2)
                    .foregroundStyle(Theme.muted)
            }
            Spacer(minLength: 32)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // Sistem — ortada, gri, italik, küçük.
    private var systemLine: some View {
        Text(message.body)
            .font(.caption.italic())
            .foregroundStyle(Theme.muted)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 2)
    }

    // MARK: - Zaman etiketi

    private static let isoFractional: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let isoPlain = ISO8601DateFormatter()

    private static let display: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "tr_TR")
        f.dateFormat = "d MMM HH:mm"
        return f
    }()

    /// ISO zaman damgası → "12 Tem 14:05". Ayrıştırılamazsa boş döner.
    private static func timeLabel(_ iso: String) -> String {
        guard let date = isoFractional.date(from: iso) ?? isoPlain.date(from: iso) else { return "" }
        return display.string(from: date)
    }
}
