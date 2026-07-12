import SwiftUI

/// Talep mesajlaşma ekranı — balonlar + alt giriş çubuğu + 6 sn poll.
struct SupportThreadView: View {
    @State private var model: SupportThreadViewModel
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
