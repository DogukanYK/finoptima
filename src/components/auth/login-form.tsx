"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { loginAction, type ActionState } from "@/lib/actions/auth";
import { Field } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    loginAction,
    {},
  );
  // E-posta ve şifre KONTROLLÜ — React 19 server action sonrası formu
  // sıfırlar; controlled değerler state'te kaldığı için 2. (2FA) adıma taşınır.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const totpStep = Boolean(state.needTotp);

  return (
    <div>
      <h2 className="font-heading text-2xl font-extrabold text-ink">
        {totpStep ? "Doğrulama kodu" : "Tekrar hoş geldin"}
      </h2>
      <p className="mt-1.5 text-sm text-muted">
        {totpStep
          ? "Authenticator uygulamandaki 6 haneli kodu gir."
          : "Hesabına giriş yap ve kaldığın yerden devam et."}
      </p>

      {state.error && !totpStep && (
        <div
          role="alert"
          className="mt-5 flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
        >
          <AlertCircle size={18} className="shrink-0" />
          {state.error}
        </div>
      )}

      {totpStep && !state.error && (
        <div className="mt-5 flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-primary-soft px-3.5 py-3 text-sm text-primary">
          <ShieldCheck size={18} className="shrink-0" />
          İki adımlı doğrulama açık.
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        {totpStep ? (
          <>
            {/* 1. adımdan gelen kimlik — gizli alanlarla taşınır */}
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="password" value={password} />
            <Field
              name="totp"
              label="Doğrulama kodu"
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              required
              error={state.error}
            />
          </>
        ) : (
          <>
            <Field
              name="email"
              type="email"
              label="E-posta"
              placeholder="ornek@eposta.com"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={state.fieldErrors?.email}
            />
            <PasswordField
              name="password"
              label="Şifre"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={state.fieldErrors?.password}
            />
          </>
        )}

        <SubmitButton className="w-full" size="lg" pendingText="Giriş yapılıyor…">
          {totpStep ? "Doğrula ve gir" : "Giriş yap"}
        </SubmitButton>
      </form>

      {totpStep ? (
        <p className="mt-6 text-center text-sm text-muted">
          <a href="/login" className="font-medium text-primary hover:underline">
            ← Farklı hesapla gir
          </a>
        </p>
      ) : (
        <p className="mt-6 text-center text-sm text-muted">
          Hesabın yok mu?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Davet kodunla kayıt ol
          </Link>
        </p>
      )}
    </div>
  );
}
