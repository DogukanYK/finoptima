"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ShieldCheck, ShieldAlert, Loader2, AlertCircle } from "lucide-react";
import { start2FA, confirm2FA, disable2FA } from "@/lib/actions/twofactor";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function TwoFactorManager({ enabled }: { enabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function begin() {
    setError("");
    startTransition(async () => {
      const r = await start2FA();
      if (r.qr) setQr(r.qr);
      else setError(r.error ?? "Başlatılamadı.");
    });
  }

  function confirm() {
    setError("");
    startTransition(async () => {
      const r = await confirm2FA(code);
      if (r.ok) {
        setQr(null);
        setCode("");
      } else {
        setError(r.error ?? "Doğrulanamadı.");
      }
    });
  }

  function disable() {
    setError("");
    startTransition(async () => {
      const r = await disable2FA(code);
      if (r.ok) setCode("");
      else setError(r.error ?? "Devre dışı bırakılamadı.");
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <div className={enabled ? "card-dark relative overflow-hidden p-5" : "card p-5"}>
        {enabled && (
          <div
            className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(5,150,105,0.45), transparent 70%)",
            }}
          />
        )}
        <div className="relative flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              enabled
                ? "bg-white/15 text-white"
                : "bg-primary-soft text-primary"
            }`}
          >
            {enabled ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className={`font-heading font-bold tracking-tight ${
                  enabled ? "text-white" : "text-ink"
                }`}
              >
                İki Adımlı Doğrulama (2FA)
              </h2>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  enabled
                    ? "bg-white/15 text-white"
                    : "bg-[rgba(15,23,42,0.05)] text-muted"
                }`}
              >
                {enabled ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                {enabled ? "Etkin" : "Kapalı"}
              </span>
            </div>
            <p
              className={`mt-0.5 text-sm ${
                enabled ? "text-white/75" : "text-muted"
              }`}
            >
              {enabled
                ? "Hesabın authenticator kodu ile korunuyor."
                : "Girişte şifrenin yanında authenticator kodu da istenir — hesabını çok daha güvenli yapar."}
            </p>
          </div>
        </div>

        {error && (
          <div className="relative mt-4 flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Etkin değil, kurulum başlamadı */}
        {!enabled && !qr && (
          <Button onClick={begin} disabled={pending} size="sm" className="mt-4">
            {pending && <Loader2 size={15} className="animate-spin" />}
            İki adımlı doğrulamayı etkinleştir
          </Button>
        )}

        {/* Kurulum: QR + kod doğrulama */}
        {!enabled && qr && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-ink">
              1. Google Authenticator, Microsoft Authenticator veya benzeri bir
              uygulamayla aşağıdaki QR kodu tara.
            </p>
            <div className="flex justify-center rounded-[var(--app-radius)] border border-line bg-white p-3">
              <Image
                src={qr}
                alt="2FA QR kodu"
                width={180}
                height={180}
                unoptimized
              />
            </div>
            <p className="text-sm text-ink">
              2. Uygulamadaki 6 haneli kodu gir:
            </p>
            <Field
              name="code"
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button onClick={confirm} disabled={pending} size="sm">
              {pending && <Loader2 size={15} className="animate-spin" />}
              Doğrula ve etkinleştir
            </Button>
          </div>
        )}

        {/* Etkin: devre dışı bırakma */}
        {enabled && (
          <div className="relative mt-4 space-y-3">
            <p className="text-sm text-white/75">
              Devre dışı bırakmak için authenticator kodunu gir.
            </p>
            <Field
              name="code"
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button
              onClick={disable}
              disabled={pending}
              size="sm"
              variant="destructive"
            >
              {pending && <Loader2 size={15} className="animate-spin" />}
              2FA'yı devre dışı bırak
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
