"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Download,
  LogOut,
  Loader2,
  CheckCircle2,
  DatabaseBackup,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
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
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <DatabaseBackup size={20} />
          </span>
          <div>
            <h2 className="font-heading font-bold tracking-tight text-ink">
              Verilerini indir
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tüm verilerini makine tarafından okunabilir JSON dosyası olarak
              indir (KVKK — veri taşınabilirliği hakkı).
            </p>
          </div>
        </div>
        <a
          href="/api/export"
          className={buttonClass("outline", "sm", "mt-4")}
        >
          <Download size={15} />
          Verilerimi indir
        </a>
      </div>

      {/* Oturum güvenliği */}
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <ShieldCheck size={20} />
          </span>
          <div>
            <h2 className="font-heading font-bold tracking-tight text-ink">
              Oturum güvenliği
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tüm cihazlardaki oturumları kapat. Şifreni paylaştığını
              düşünüyorsan ya da kayıp bir cihaz varsa kullan.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
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
      <div className="card border-destructive/30 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
            <AlertTriangle size={20} />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading font-bold tracking-tight text-destructive">
                Hesabı sil
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive-soft px-2 py-0.5 text-xs font-semibold text-destructive">
                Geri alınamaz
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Hesabın ve tüm verilerin (işlemler, borçlar, profil, fişler…)
              kalıcı olarak silinir. Bu işlem geri alınamaz.
            </p>
          </div>
        </div>
        {!showDelete ? (
          <Button
            variant="destructive"
            size="sm"
            className="mt-4"
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
