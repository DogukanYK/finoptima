"use client";

import { useActionState, useState, useTransition } from "react";
import { Download, LogOut, Loader2, CheckCircle2 } from "lucide-react";
import {
  logoutEverywhere,
  deleteMyAccount,
  type AccountActionState,
} from "@/lib/actions/account";
import { Field } from "@/components/ui/field";
import { Button, buttonClass } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export function DataPrivacy() {
  const [pending, startTransition] = useTransition();
  const [loggedOut, setLoggedOut] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [delState, delAction] = useActionState<AccountActionState, FormData>(
    deleteMyAccount,
    {},
  );

  return (
    <div className="max-w-xl space-y-4">
      {/* Veri indirme */}
      <div className="card p-5">
        <h2 className="font-heading font-bold text-ink">Verilerini indir</h2>
        <p className="mt-1 text-sm text-muted">
          Tüm verilerini makine tarafından okunabilir JSON dosyası olarak indir
          (KVKK — veri taşınabilirliği hakkı).
        </p>
        <a
          href="/api/export"
          className={buttonClass("outline", "sm", "mt-3")}
        >
          <Download size={15} />
          Verilerimi indir
        </a>
      </div>

      {/* Oturum güvenliği */}
      <div className="card p-5">
        <h2 className="font-heading font-bold text-ink">Oturum güvenliği</h2>
        <p className="mt-1 text-sm text-muted">
          Tüm cihazlardaki oturumları kapat. Şifreni paylaştığını düşünüyorsan
          ya da kayıp bir cihaz varsa kullan.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          disabled={pending || loggedOut}
          onClick={() =>
            startTransition(async () => {
              await logoutEverywhere();
              setLoggedOut(true);
            })
          }
        >
          {pending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <LogOut size={15} />
          )}
          Tüm cihazlardan çık
        </Button>
        {loggedOut && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-accent">
            <CheckCircle2 size={15} />
            Diğer oturumlar birkaç dakika içinde kapanacak.
          </p>
        )}
      </div>

      {/* Tehlikeli bölge */}
      <div className="card p-5">
        <h2 className="font-heading font-bold text-destructive">
          Hesabı sil
        </h2>
        <p className="mt-1 text-sm text-muted">
          Hesabın ve tüm verilerin (işlemler, borçlar, profil, fişler…) kalıcı
          olarak silinir. Bu işlem geri alınamaz.
        </p>
        {!showDelete ? (
          <Button
            variant="destructive"
            size="sm"
            className="mt-3"
            onClick={() => setShowDelete(true)}
          >
            Hesabımı sil
          </Button>
        ) : (
          <form action={delAction} className="mt-3 space-y-3">
            <Field
              name="password"
              type="password"
              label="Onaylamak için parolanı gir"
              autoComplete="current-password"
              required
              error={delState.error}
            />
            <div className="flex gap-2">
              <SubmitButton
                variant="destructive"
                size="sm"
                pendingText="Siliniyor…"
              >
                Kalıcı olarak sil
              </SubmitButton>
              <button
                type="button"
                onClick={() => setShowDelete(false)}
                className="px-3 text-sm font-medium text-muted"
              >
                Vazgeç
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
