"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AlertCircle, ShieldCheck, UserPlus, ArrowRight } from "lucide-react";
import { registerAction, type ActionState } from "@/lib/actions/auth";
import { Field, FieldError } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function RegisterForm({ isFirstUser }: { isFirstUser: boolean }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    registerAction,
    {},
  );

  return (
    <div className="card p-5 sm:p-7">
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-white"
        style={{ background: "linear-gradient(120deg,#2563EB,#0EA5E9)" }}
      >
        <UserPlus size={20} />
      </span>
      <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-ink">
        Hesap{" "}
        <span
          style={{
            background: "linear-gradient(120deg,#2563EB,#059669)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          oluştur
        </span>
      </h2>
      <p className="mt-1.5 text-sm text-muted">
        {isFirstUser
          ? "İlk hesap — yönetici olarak oluşturulacak."
          : "Kayıt için bir davet koduna ihtiyacın var."}
      </p>

      {isFirstUser && (
        <div className="mt-5 flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-accent-soft px-3.5 py-3 text-sm text-accent">
          <ShieldCheck size={18} className="shrink-0" />
          Bu sistemdeki ilk kullanıcısın, yönetici yetkisiyle açılacaksın.
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="mt-5 flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-destructive-soft px-3.5 py-3 text-sm text-destructive"
        >
          <AlertCircle size={18} className="shrink-0" />
          {state.error}
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4">
        <Field
          name="name"
          label="Ad Soyad"
          placeholder="Adın"
          autoComplete="name"
          required
          error={state.fieldErrors?.name}
        />
        <Field
          name="email"
          type="email"
          label="E-posta"
          placeholder="ornek@eposta.com"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          required
          error={state.fieldErrors?.email}
        />
        <PasswordField
          name="password"
          label="Şifre"
          placeholder="En az 10 karakter, harf ve rakam"
          autoComplete="new-password"
          required
          error={state.fieldErrors?.password}
        />
        {!isFirstUser && (
          <Field
            name="inviteCode"
            label="Davet kodu"
            placeholder="ABCD-1234"
            required
            error={state.fieldErrors?.inviteCode}
          />
        )}
        <div>
          <label className="flex items-start gap-2.5 text-sm text-muted">
            <input
              type="checkbox"
              name="consent"
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--app-primary)]"
            />
            <span>
              <Link
                href="/gizlilik"
                target="_blank"
                className="font-medium text-primary hover:underline"
              >
                Aydınlatma metnini
              </Link>{" "}
              okudum; kişisel verilerimin işlenmesini kabul ediyorum.
            </span>
          </label>
          <FieldError message={state.fieldErrors?.consent} />
        </div>
        <SubmitButton
          className="w-full"
          size="lg"
          pendingText="Hesap oluşturuluyor…"
        >
          Hesap oluştur
          <ArrowRight size={18} />
        </SubmitButton>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Zaten hesabın var mı?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
