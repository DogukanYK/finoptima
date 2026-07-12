import SwiftUI

/// Destek AI sohbet ekranı — AssistantView'ın sadeleştirilmiş destek sürümü.
/// AI çözemezse (escalate) veya kullanıcı isterse transkript taşınarak
/// insan desteğe talep açılır.
struct SupportAIChatView: View {
    /// Talep başarıyla oluşturulduğunda çağrılır (listeyi yenilemek için).
    var onTicketCreated: (() -> Void)? = nil

    @State private var model = SupportAIChatViewModel()
    @State private var showCreatedAlert = false
    @FocusState private var inputFocused: Bool
    @Environment(\.dismiss) private var dismiss

    private let suggestions = [
        "Ekstremi nasıl yüklerim?",
        "Kredi notum neden düşük?",
        "2FA nasıl açılır?",
    ]

    var body: some View {
        VStack(spacing: 0) {
            messages
            footer
            inputBar
        }
        .background(Theme.bg.ignoresSafeArea())
        .navigationTitle("AI Destek")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Talebin oluşturuldu", isPresented: $showCreatedAlert) {
            Button("Tamam") {
                onTicketCreated?()
                dismiss()
            }
        } message: {
            Text("Sohbet geçmişin talebe eklendi. Destek ekibimiz en kısa sürede dönüş yapacak; talebini Destek sayfasından takip edebilirsin.")
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
                            aiAvatar
                            HStack(spacing: 8) {
                                ProgressView().controlSize(.small)
                                Text("Yazıyor…")
                                    .font(.caption)
                                    .foregroundStyle(Theme.muted)
                            }
                            .padding(.horizontal, 14).padding(.vertical, 11)
                            .background(
                                Theme.surface,
                                in: UnevenRoundedRectangle(
                                    topLeadingRadius: 6, bottomLeadingRadius: 18,
                                    bottomTrailingRadius: 18, topTrailingRadius: 18, style: .continuous
                                )
                            )
                            Spacer(minLength: 0)
                        }
                        .id("typing")
                    }
                    if model.escalateSuggested && !model.pending {
                        escalateCard
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
            .onChange(of: model.pending) {
                if model.pending {
                    withAnimation { proxy.scrollTo("typing", anchor: .bottom) }
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 18) {
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Theme.brandGradient)
                .frame(width: 64, height: 64)
                .overlay(
                    Image(systemName: "lifepreserver.fill")
                        .font(.system(size: 28, weight: .semibold))
                        .foregroundStyle(.white)
                )
                .shadow(color: Theme.primary.opacity(0.35), radius: 14, x: 0, y: 8)
                .padding(.top, 24)

            VStack(spacing: 6) {
                Text("Destek Asistanı")
                    .font(.display(22, .bold))
                    .foregroundStyle(Theme.ink)
                Text("Sorununu anlat, hemen çözmeye çalışayım.\nÇözemezsem insan desteğe aktarırım.")
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
                            Image(systemName: "questionmark.bubble")
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
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, 8)
    }

    @ViewBuilder
    private func messageRow(_ msg: SupportAIChatViewModel.ChatMessage) -> some View {
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
                aiAvatar
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
                Spacer(minLength: 32)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var aiAvatar: some View {
        RoundedRectangle(cornerRadius: 9, style: .continuous)
            .fill(Theme.brandGradient)
            .frame(width: 28, height: 28)
            .overlay(
                Image(systemName: "sparkles")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.white)
            )
    }

    // MARK: - Eskalasyon kartı (AI önerdiğinde)

    private var escalateCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                Image(systemName: "person.fill.questionmark")
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(Theme.primary)
                    .frame(width: 34, height: 34)
                    .background(Theme.primarySoft, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                Text("Bu konuyu insan desteğe aktarmamı ister misin? Sohbet geçmişin talebe eklenir.")
                    .font(.footnote)
                    .foregroundStyle(Theme.ink)
            }
            Button {
                Haptics.light()
                Task { await escalate() }
            } label: {
                HStack(spacing: 6) {
                    if model.creatingTicket {
                        ProgressView().controlSize(.small).tint(.white)
                    } else {
                        Image(systemName: "arrow.uturn.right")
                    }
                    Text("İnsan desteğe aktar")
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity).padding(.vertical, 10)
                .background(Theme.primary, in: Capsule())
            }
            .buttonStyle(PressableStyle())
            .disabled(model.creatingTicket)
        }
        .card(padding: 12, radius: 16, elevated: false)
    }

    // MARK: - Alt bölüm (her zaman görünür talep linki + hata)

    private var footer: some View {
        VStack(spacing: 4) {
            Button {
                Haptics.light()
                Task { await escalate() }
            } label: {
                Text("Çözülmedi mi? Talep oluştur")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Theme.primary)
            }
            .disabled(model.creatingTicket)

            if let error = model.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(Theme.destructive)
            }
        }
        .padding(.top, 8)
        .padding(.bottom, 2)
    }

    private func escalate() async {
        if await model.createTicket() {
            Haptics.success()
            showCreatedAlert = true
        }
    }

    // MARK: - Giriş çubuğu

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: 10) {
            TextField("Sorununu yaz…", text: $model.input, axis: .vertical)
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
