import SwiftUI

/// AI Asistan sohbet ekranı. Kullanıcı harcamasını anlatır → asistan yapısal işlem
/// önerir → tek dokunuşla kaydedilir. Ayrıca finans sorularını yanıtlar.
struct AssistantView: View {
    @State private var model = AssistantViewModel()
    @FocusState private var inputFocused: Bool

    private let suggestions = [
        "Bu ay ne kadar harcadım?",
        "Dün markete 350 lira verdim",
        "Kedimi veterinere götürdüm, 600 tl",
        "Kredi notumu nasıl yükseltirim?",
    ]

    var body: some View {
        VStack(spacing: 0) {
            messages
            inputBar
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("Asistan")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if !model.isEmpty {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(role: .destructive) {
                        Haptics.light()
                        model.clear()
                    } label: {
                        Image(systemName: "trash")
                    }
                    .tint(Theme.destructive)
                }
            }
        }
    }

    // MARK: - Mesaj listesi

    private var messages: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 16) {
                    if model.isEmpty && !model.pending {
                        emptyState
                    }
                    ForEach(model.messages) { msg in
                        messageRow(msg).id(msg.id)
                    }
                    if model.pending {
                        HStack(alignment: .bottom, spacing: 8) {
                            AssistantAvatar()
                            TypingIndicator()
                            Spacer(minLength: 0)
                        }
                        .id("typing")
                    }
                }
                .padding(16)
            }
            .scrollDismissesKeyboard(.interactively)
            .onChange(of: model.messages.count) {
                withAnimation {
                    if let last = model.messages.last { proxy.scrollTo(last.id, anchor: .bottom) }
                }
            }
            .onChange(of: model.pending) {
                if model.pending { withAnimation { proxy.scrollTo("typing", anchor: .bottom) } }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 20) {
            ZStack {
                Circle()
                    .fill(Theme.primary.opacity(0.16))
                    .frame(width: 104, height: 104)
                    .blur(radius: 6)
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(Theme.brandGradient)
                    .frame(width: 72, height: 72)
                    .overlay(
                        Image(systemName: "sparkles")
                            .font(.system(size: 30, weight: .semibold))
                            .foregroundStyle(.white)
                    )
                    .shadow(color: Theme.primary.opacity(0.4), radius: 18, x: 0, y: 10)
            }
            .padding(.top, 28)

            VStack(spacing: 7) {
                Text("Finans Asistanın")
                    .font(.display(23, .bold))
                    .foregroundStyle(Theme.ink)
                Text("Harcamanı anlat, senin için ekleyeyim.\nYa da finansına dair bir şey sor.")
                    .font(.subheadline)
                    .foregroundStyle(Theme.muted)
                    .multilineTextAlignment(.center)
            }

            VStack(spacing: 10) {
                ForEach(suggestions, id: \.self) { s in
                    Button {
                        Haptics.light()
                        Task { await model.send(s) }
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: suggestionIcon(s))
                                .font(.footnote.weight(.bold))
                                .foregroundStyle(Theme.primary)
                                .frame(width: 32, height: 32)
                                .background(Theme.primarySoft, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                            Text(s)
                                .font(.subheadline)
                                .foregroundStyle(Theme.ink)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            Image(systemName: "arrow.up.forward")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(Theme.muted)
                        }
                        .card(padding: 12, radius: 16, elevated: false)
                    }
                    .buttonStyle(PressableStyle())
                }
            }
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, 8)
    }

    private func suggestionIcon(_ text: String) -> String {
        text.hasSuffix("?") ? "questionmark.bubble" : "plus.circle"
    }

    @ViewBuilder
    private func messageRow(_ msg: AssistantViewModel.ChatMessage) -> some View {
        if msg.role == "user" {
            HStack(spacing: 0) {
                Spacer(minLength: 48)
                Text(msg.content)
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
                    .shadow(color: Theme.primary.opacity(0.28), radius: 10, x: 0, y: 5)
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
        } else {
            HStack(alignment: .top, spacing: 8) {
                AssistantAvatar()
                VStack(alignment: .leading, spacing: 10) {
                    Text(msg.content)
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

                    ForEach(msg.actions) { action in
                        AssistantActionCard(action: action) { await model.commit(action) }
                    }
                }
                Spacer(minLength: 32)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Giriş çubuğu

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField("Bir şey yaz…", text: $model.input, axis: .vertical)
                .lineLimit(1...4)
                .font(.subheadline)
                .focused($inputFocused)
                .padding(.horizontal, 15).padding(.vertical, 11)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .strokeBorder(inputFocused ? Theme.primary.opacity(0.5) : Theme.line, lineWidth: 1)
                )

            let canSend = !model.pending && !model.input.trimmingCharacters(in: .whitespaces).isEmpty
            Button {
                Haptics.light()
                inputFocused = false
                Task { await model.send() }
            } label: {
                Image(systemName: model.pending ? "ellipsis" : "arrow.up")
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

// MARK: - Asistan avatarı

private struct AssistantAvatar: View {
    var body: some View {
        RoundedRectangle(cornerRadius: 10, style: .continuous)
            .fill(Theme.brandGradient)
            .frame(width: 30, height: 30)
            .overlay(
                Image(systemName: "sparkles")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
            )
            .shadow(color: Theme.primary.opacity(0.25), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Öneri kartı

private struct AssistantActionCard: View {
    let action: AssistantProposedAction
    let onCommit: () async -> AssistantCommitCreated?

    @State private var state: CardState = .idle
    private enum CardState { case idle, saving, done, dismissed }

    private var isIncome: Bool { action.kind == "INCOME" }
    private var tint: Color { isIncome ? Theme.income : Theme.expense }

    var body: some View {
        switch state {
        case .dismissed:
            EmptyView()
        case .done:
            HStack(spacing: 10) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(Theme.income)
                VStack(alignment: .leading, spacing: 1) {
                    Text("İşlem eklendi")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                    Text("\(Format.money(action.amount)) · \(action.description)")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                        .lineLimit(1)
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 12).padding(.vertical, 11)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.accentSoft, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(Theme.income.opacity(0.25), lineWidth: 1)
            )
            .transition(.opacity)
        default:
            card
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                Image(systemName: isIncome ? "arrow.down.left" : "arrow.up.right")
                    .font(.callout.weight(.bold))
                    .foregroundStyle(tint)
                    .frame(width: 38, height: 38)
                    .background(tint.opacity(0.14), in: Circle())
                VStack(alignment: .leading, spacing: 3) {
                    Text(action.description)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Theme.ink)
                        .lineLimit(1)
                    Text("\(isIncome ? "Gelir" : "Gider")\(action.category.map { " · \($0)" } ?? "") · \(Format.shortDate(action.date))")
                        .font(.caption)
                        .foregroundStyle(Theme.muted)
                }
                Spacer(minLength: 8)
                AmountText(
                    value: action.amount,
                    signed: isIncome,
                    color: isIncome ? Theme.income : Theme.ink,
                    size: 17,
                    weight: .bold
                )
            }

            HStack(spacing: 10) {
                Button {
                    Task {
                        state = .saving
                        let created = await onCommit()
                        if created != nil {
                            Haptics.success()
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) { state = .done }
                        } else {
                            state = .idle
                        }
                    }
                } label: {
                    HStack(spacing: 6) {
                        if state == .saving { ProgressView().controlSize(.small).tint(.white) }
                        else { Image(systemName: "plus") }
                        Text("Ekle")
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity).padding(.vertical, 10)
                    .background(Theme.primary, in: Capsule())
                }
                .buttonStyle(PressableStyle())
                .disabled(state == .saving)

                Button {
                    Haptics.light()
                    withAnimation(.easeInOut(duration: 0.2)) { state = .dismissed }
                } label: {
                    Text("Vazgeç")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Theme.muted)
                        .padding(.horizontal, 18).padding(.vertical, 10)
                        .overlay(Capsule().strokeBorder(Theme.line, lineWidth: 1))
                }
                .buttonStyle(PressableStyle())
                .disabled(state == .saving)
            }
        }
        .card(padding: 12, radius: 16, elevated: false)
    }
}

// MARK: - Yazıyor göstergesi

private struct TypingIndicator: View {
    @State private var phase = 0.0
    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(Theme.muted)
                    .frame(width: 7, height: 7)
                    .opacity(0.4 + 0.6 * abs(sin(phase + Double(i) * 0.6)))
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 13)
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
        .onAppear {
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: false)) { phase = .pi * 2 }
        }
    }
}
