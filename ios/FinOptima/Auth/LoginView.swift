import SwiftUI

/// FinOptima giriş ekranı.
///
/// E-posta + şifre ile giriş yapar. Sunucu iki adımlı doğrulama isterse
/// (`totp_required`) TOTP alanı belirir. Hatalı kimlik bilgisi ve hız sınırı
/// (`rate_limited`) durumları Türkçe mesajlarla gösterilir.
struct LoginView: View {
    @Environment(AppState.self) private var appState
    @State private var vm = AuthViewModel()
    @FocusState private var focus: Field?

    private enum Field: Hashable { case email, password, totp }

    var body: some View {
        @Bindable var vm = vm

        ScrollView {
            VStack(spacing: 24) {
                header

                VStack(spacing: 16) {
                    field(
                        title: "E-posta",
                        icon: "envelope",
                        focused: focus == .email
                    ) {
                        TextField("ornek@finoptima.com", text: $vm.email)
                            .textContentType(.username)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .submitLabel(.next)
                            .focused($focus, equals: .email)
                            .onChange(of: vm.email) { _, _ in
                                // E-posta değişince bekleyen 2FA akışını sıfırla.
                                if vm.showsTOTPField { vm.resetTOTP() }
                            }
                            .onSubmit { focus = .password }
                    }

                    field(
                        title: "Şifre",
                        icon: "lock",
                        focused: focus == .password
                    ) {
                        SecureField("Şifreniz", text: $vm.password)
                            .textContentType(.password)
                            .submitLabel(vm.showsTOTPField ? .next : .go)
                            .focused($focus, equals: .password)
                            .onSubmit(handlePasswordSubmit)
                    }

                    if vm.showsTOTPField {
                        field(
                            title: "Doğrulama Kodu",
                            icon: "checkmark.shield",
                            focused: focus == .totp
                        ) {
                            TextField("6 haneli kod", text: $vm.totp)
                                .textContentType(.oneTimeCode)
                                .keyboardType(.numberPad)
                                .submitLabel(.go)
                                .focused($focus, equals: .totp)
                        }
                        .transition(.move(edge: .top).combined(with: .opacity))
                    }

                    if let notice = vm.noticeMessage {
                        banner(text: notice, tint: Theme.primary, icon: "info.circle.fill")
                    }

                    if let error = vm.errorMessage {
                        banner(text: error, tint: Theme.destructive, icon: "exclamationmark.triangle.fill")
                    }

                    submitButton
                }
                .padding(20)
                .background(
                    Theme.surface,
                    in: RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.cardRadius, style: .continuous)
                        .strokeBorder(Theme.line, lineWidth: 1)
                )

                footer
            }
            .padding(24)
            .frame(maxWidth: 480)
            .frame(maxWidth: .infinity)
        }
        .background(Theme.bg.ignoresSafeArea())
        .scrollDismissesKeyboard(.interactively)
        .animation(.easeInOut(duration: 0.25), value: vm.showsTOTPField)
        .animation(.easeInOut(duration: 0.2), value: vm.errorMessage)
        .onAppear { focus = .email }
    }

    // MARK: - Bölümler

    private var header: some View {
        VStack(spacing: 16) {
            Image(systemName: "chart.line.uptrend.xyaxis")
                .font(.system(size: 34, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 76, height: 76)
                .background(Theme.brandGradient, in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                .shadow(color: Theme.primary.opacity(0.35), radius: 18, y: 10)

            VStack(spacing: 6) {
                Text("FinOptima")
                    .font(.display(34, .bold))
                    .foregroundStyle(Theme.ink)
                Text("Finansal sağlığınızı tek yerden yönetin")
                    .font(.subheadline)
                    .foregroundStyle(Theme.muted)
                    .multilineTextAlignment(.center)
            }
        }
        .padding(.top, 24)
    }

    private var submitButton: some View {
        Button(action: submit) {
            HStack(spacing: 8) {
                if vm.isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                }
                Text(vm.showsTOTPField ? "Doğrula ve Giriş Yap" : "Giriş Yap")
                    .font(.body.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .tint(Theme.primary)
        .controlSize(.large)
        .disabled(!vm.canSubmit)
        .padding(.top, 4)
    }

    private var footer: some View {
        Text("Giriş yaparak Kullanım Koşulları'nı kabul etmiş olursunuz.")
            .font(.caption)
            .foregroundStyle(Theme.muted)
            .multilineTextAlignment(.center)
            .padding(.top, 4)
    }

    // MARK: - Alan yapıcı

    /// Başlık + ikon + kenarlıklı giriş alanı sarmalayıcısı.
    @ViewBuilder
    private func field(
        title: String,
        icon: String,
        focused: Bool,
        @ViewBuilder _ content: () -> some View
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(Theme.muted)

            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.body)
                    .foregroundStyle(focused ? Theme.primary : Theme.muted)
                    .frame(width: 22)
                content()
                    .font(.body)
                    .foregroundStyle(Theme.ink)
                    .tint(Theme.primary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 13)
            .background(
                Theme.bg,
                in: RoundedRectangle(cornerRadius: Theme.controlRadius, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Theme.controlRadius, style: .continuous)
                    .strokeBorder(focused ? Theme.primary : Theme.line, lineWidth: focused ? 1.5 : 1)
            )
        }
        .animation(.easeInOut(duration: 0.15), value: focused)
    }

    /// Bilgi / hata şeridi.
    private func banner(text: String, tint: Color, icon: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: icon)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(tint)
            Text(text)
                .font(.footnote)
                .foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(tint.opacity(0.10), in: RoundedRectangle(cornerRadius: Theme.controlRadius, style: .continuous))
    }

    // MARK: - Eylemler

    private func handlePasswordSubmit() {
        if vm.showsTOTPField {
            focus = .totp
        } else {
            submit()
        }
    }

    private func submit() {
        guard vm.canSubmit else { return }
        focus = nil
        Task {
            let success = await vm.login()
            if success {
                appState.didLogin()
            } else if vm.showsTOTPField {
                // 2FA yeni açıldıysa veya kod hatalıysa imleci koda taşı.
                focus = .totp
            }
        }
    }
}

#Preview("Giriş") {
    LoginView()
        .environment(AppState.shared)
}
