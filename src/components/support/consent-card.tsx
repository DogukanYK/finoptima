"use client";

// KVKK kademeli erişim — kullanıcının destek ekibine GEÇİCİ veri izni verdiği kart.
// Varsayılan: hiçbir kapsam seçili değil (kullanıcı bilinçli seçsin).
// İzin aktifken kapsamlar + bitiş tarihi + kalan süre gösterilir, tek tıkla geri alınır.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff, Lock, Loader2 } from "lucide-react";
import { grantSupportConsent, revokeSupportConsent } from "@/lib/actions/support";
import {
  CONSENT_HOURS,
  type ActiveConsent,
  type ConsentScope,
} from "@/lib/support/consent";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Görünüm sırası (tipi ConsentScope olduğu için CONSENT_SCOPES ile senkron kalır).
const SCOPE_ORDER: ConsentScope[] = [
  "dashboard",
  "transactions",
  "debts",
  "findeks",
];

const SCOPE_LABELS: Record<ConsentScope, string> = {
  dashboard: "Panel özeti",
  transactions: "Son işlemler",
  debts: "Borçlar",
  findeks: "Findeks notu",
};

function remainingText(expiresAt: string): string | null {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `~${hours} saat kaldı`;
  return `~${Math.max(1, Math.round(ms / 60_000))} dakika kaldı`;
}

const KVKK_NOTE =
  "Kimlik ve adres bilgilerin hiçbir durumda destek ekibine açılmaz.";

export function ConsentCard({
  ticketId,
  consent,
}: {
  ticketId: string;
  consent: ActiveConsent | null;
}) {
  const router = useRouter();
  const [scopes, setScopes] = useState<ConsentScope[]>([]);
  const [hours, setHours] = useState<number>(CONSENT_HOURS[0]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  // Kalan süre yalnız mount sonrası hesaplanır (SSR/CSR saat farkı → hydration).
  const expiresAt = consent?.expiresAt ?? null;
  const [remaining, setRemaining] = useState<string | null>(null);
  useEffect(() => {
    if (!expiresAt) {
      setRemaining(null);
      return;
    }
    const tick = () => setRemaining(remainingText(expiresAt));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const toggleScope = (scope: ConsentScope) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const grant = () => {
    if (scopes.length === 0 || pending) return;
    setError("");
    startTransition(async () => {
      try {
        const res = await grantSupportConsent(ticketId, { hours, scopes });
        if (res.ok) {
          setScopes([]);
          router.refresh();
        } else {
          setError(res.error);
        }
      } catch {
        setError("İzin verilemedi, tekrar dener misin?");
      }
    });
  };

  const revoke = () => {
    if (pending) return;
    if (
      !window.confirm(
        "Erişim iznini geri almak istediğine emin misin? Destek ekibi finansal detaylarını artık göremeyecek.",
      )
    )
      return;
    setError("");
    startTransition(async () => {
      try {
        const res = await revokeSupportConsent(ticketId);
        if (res.ok) router.refresh();
        else setError(res.error);
      } catch {
        setError("İzin geri alınamadı, tekrar dener misin?");
      }
    });
  };

  /* ---------- İzin AKTİF ---------- */
  if (consent) {
    const granted = SCOPE_ORDER.filter((s) => consent.scopes.includes(s));
    return (
      <div className="border-b border-line bg-emerald-500/10 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <ShieldCheck size={15} className="shrink-0" />
              Erişim izni aktif
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {granted.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400"
                >
                  {SCOPE_LABELS[s]}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              <b className="text-ink">{formatDate(consent.expiresAt)}</b> tarihine
              kadar
              {remaining ? ` · ${remaining}` : ""}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={revoke}
            disabled={pending}
            className="shrink-0 text-destructive hover:bg-destructive/10"
          >
            {pending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ShieldOff size={14} />
            )}
            İzni geri al
          </Button>
        </div>

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
          <Lock size={11} className="shrink-0" />
          {KVKK_NOTE}
        </p>
      </div>
    );
  }

  /* ---------- İzin YOK ---------- */
  return (
    <div className="border-b border-line bg-surface-2/60 px-4 py-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <ShieldCheck size={15} className="shrink-0 text-primary" />
        Verilerine erişim izni
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        Destek ekibi varsayılan olarak yalnızca hesap özetini görür — tutarlarını,
        işlemlerini ve borçlarını <b className="text-ink">göremez</b>. Sorununu daha
        hızlı çözebilmemiz için istersen seçtiğin kapsamlarda, seçtiğin süre boyunca
        geçici erişim verebilirsin. İzni dilediğin an geri alabilirsin.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {SCOPE_ORDER.map((s) => {
          const checked = scopes.includes(s);
          return (
            <label
              key={s}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-[calc(var(--app-radius)*0.75)] border px-3 py-2 text-sm transition-colors",
                checked
                  ? "border-primary/50 bg-primary-soft text-ink"
                  : "border-line bg-surface text-muted hover:bg-surface-2",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleScope(s)}
                disabled={pending}
                className="h-4 w-4 shrink-0 accent-[var(--app-primary)]"
              />
              {SCOPE_LABELS[s]}
            </label>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-muted">Süre:</span>
        <div className="inline-flex rounded-full border border-line bg-surface p-0.5">
          {CONSENT_HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHours(h)}
              disabled={pending}
              aria-pressed={hours === h}
              className={cn(
                "cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
                hours === h
                  ? "bg-primary text-white"
                  : "text-muted hover:text-ink",
              )}
            >
              {h} saat
            </button>
          ))}
        </div>

        <Button
          size="sm"
          onClick={grant}
          disabled={pending || scopes.length === 0}
          className="ml-auto"
        >
          {pending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ShieldCheck size={14} />
          )}
          İzin ver
        </Button>
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
        <Lock size={11} className="shrink-0" />
        {KVKK_NOTE}
      </p>
    </div>
  );
}
