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
                    Button(role: .destructive) { model.clear() } label: {
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
                LazyVStack(alignment: .leading, spacing: 14) {
                    if model.isEmpty && !model.pending {
                        emptyState
                    }
                    ForEach(model.messages) { msg in
                        messageRow(msg).id(msg.id)
                    }
                    if model.pending {
                        HStack {
                            TypingIndicator()
                            Spacer(minLength: 0)
                        }
                        .id("typing")
                    }
                }
                .padding(16)
            }
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
        VStack(spacing: 16) {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(LinearGradient(colors: [Theme.primary, Color(hex: "0EA5E9")], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 64, height: 64)
                .overlay(Image(systemName: "sparkles").font(.system(size: 26, weight: .semibold)).foregroundStyle(.white))
                .padding(.top, 24)

            Text("Harcamanı anlat, senin için ekleyeyim.\nYa da finansına dair bir şey sor.")
                .font(.subheadline)
                .foregroundStyle(Theme.muted)
                .multilineTextAlignment(.center)

            VStack(spacing: 8) {
                ForEach(suggestions, id: \.self) { s in
                    Button {
                        Task { await model.send(s) }
                    } label: {
                        Text(s)
                            .font(.subheadline)
                            .foregroundStyle(Theme.ink)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 14).padding(.vertical, 11)
                            .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, 8)
    }

    @ViewBuilder
    private func messageRow(_ msg: AssistantViewModel.ChatMessage) -> some View {
        VStack(alignment: msg.role == "user" ? .trailing : .leading, spacing: 8) {
            HStack {
                if msg.role == "user" { Spacer(minLength: 40) }
                Text(msg.content)
                    .font(.subheadline)
                    .foregroundStyle(msg.role == "user" ? .white : Theme.ink)
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(
                        msg.role == "user" ? AnyShapeStyle(Theme.primary) : AnyShapeStyle(Theme.surface),
                        in: RoundedRectangle(cornerRadius: 18, style: .continuous)
                    )
                    .overlay(
                        msg.role == "user" ? nil :
                            RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(Theme.line, lineWidth: 1)
                    )
                if msg.role != "user" { Spacer(minLength: 40) }
            }

            if msg.role != "user" {
                ForEach(msg.actions) { action in
                    AssistantActionCard(action: action) { await model.commit(action) }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: msg.role == "user" ? .trailing : .leading)
    }

    // MARK: - Giriş çubuğu

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField("Bir şey yaz…", text: $model.input, axis: .vertical)
                .lineLimit(1...4)
                .font(.subheadline)
                .focused($inputFocused)
                .padding(.horizontal, 14).padding(.vertical, 10)
                .background(Theme.surface, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))

            Button {
                inputFocused = false
                Task { await model.send() }
            } label: {
                Image(systemName: model.pending ? "ellipsis" : "arrow.up")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(Theme.primary, in: Circle())
            }
            .disabled(model.pending || model.input.trimmingCharacters(in: .whitespaces).isEmpty)
            .opacity(model.pending || model.input.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)
        }
        .padding(.horizontal, 12).padding(.vertical, 10)
        .background(.bar)
    }
}

// MARK: - Öneri kartı

private struct AssistantActionCard: View {
    let action: AssistantProposedAction
    let onCommit: () async -> AssistantCommitCreated?

    @State private var state: CardState = .idle
    private enum CardState { case idle, saving, done, dismissed }

    private var isIncome: Bool { action.kind == "INCOME" }

    var body: some View {
        switch state {
        case .dismissed:
            EmptyView()
        case .done:
            HStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.primary)
                Text("Eklendi · \(Format.money(action.amount)) · \(action.description)")
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(Theme.ink)
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Theme.primary.opacity(0.1), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        default:
            card
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Image(systemName: isIncome ? "arrow.down.left" : "arrow.up.right")
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(isIncome ? Theme.income : Theme.expense)
                    .frame(width: 34, height: 34)
                    .background((isIncome ? Theme.income : Theme.expense).opacity(0.12), in: Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text(action.description).font(.subheadline.weight(.semibold)).foregroundStyle(Theme.ink).lineLimit(1)
                    Text("\(isIncome ? "Gelir" : "Gider")\(action.category.map { " · \($0)" } ?? "") · \(Format.shortDate(action.date))")
                        .font(.caption).foregroundStyle(Theme.muted)
                }
                Spacer(minLength: 8)
                Text("\(isIncome ? "+" : "")\(Format.money(action.amount))")
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(isIncome ? Theme.income : Theme.ink)
            }
            HStack(spacing: 8) {
                Button {
                    Task {
                        state = .saving
                        let created = await onCommit()
                        state = created != nil ? .done : .idle
                    }
                } label: {
                    HStack(spacing: 6) {
                        if state == .saving { ProgressView().controlSize(.small).tint(.white) }
                        else { Image(systemName: "plus") }
                        Text("Ekle")
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity).padding(.vertical, 9)
                    .background(Theme.primary, in: Capsule())
                }
                .disabled(state == .saving)

                Button {
                    state = .dismissed
                } label: {
                    Text("Vazgeç")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Theme.muted)
                        .padding(.horizontal, 16).padding(.vertical, 9)
                        .overlay(Capsule().strokeBorder(Theme.line, lineWidth: 1))
                }
                .disabled(state == .saving)
            }
        }
        .padding(12)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
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
        .padding(.horizontal, 16).padding(.vertical, 12)
        .background(Theme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(Theme.line, lineWidth: 1))
        .onAppear {
            withAnimation(.easeInOut(duration: 0.9).repeatForever(autoreverses: false)) { phase = .pi * 2 }
        }
    }
}
