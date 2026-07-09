"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Copy, Check, Ticket, CircleDot } from "lucide-react";
import { createInviteCode, deleteInviteCode } from "@/lib/actions/settings";
import { formatDateShort } from "@/lib/format";

type Invite = {
  id: string;
  code: string;
  used: boolean;
  usedByName: string | null;
  expiresAt: string | null;
};

export function InvitesManager({ invites }: { invites: Invite[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  function generate() {
    setError("");
    startTransition(async () => {
      const res = await createInviteCode();
      if (!res.ok) setError(res.error ?? "Kod üretilemedi.");
    });
  }

  function copy(code: string) {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 1800);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Davet kodu oluştur ve paylaş. Her kod yalnızca bir kez kullanılabilir ve
        14 gün geçerlidir.
      </p>

      <button
        onClick={generate}
        disabled={pending}
        style={{ background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))" }}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--app-radius)] py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        <Plus size={16} /> Yeni davet kodu üret
      </button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="card divide-y divide-[var(--app-border)]">
        {invites.length === 0 ? (
          <p className="p-5 text-center text-sm text-muted">
            Henüz davet kodu yok.
          </p>
        ) : (
          invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 p-4">
              {inv.used ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(15,23,42,0.05)] text-muted">
                  <Ticket size={18} />
                </span>
              ) : (
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))" }}
                >
                  <Ticket size={18} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold tracking-wider text-ink">
                  {inv.code}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  {inv.used ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(15,23,42,0.05)] px-2 py-0.5 text-xs font-semibold text-muted">
                      <Check size={11} />
                      Kullanıldı
                      {inv.usedByName ? ` · ${inv.usedByName}` : ""}
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                        <CircleDot size={11} />
                        Aktif
                      </span>
                      {inv.expiresAt && (
                        <span className="text-xs text-muted">
                          Son geçerlilik {formatDateShort(inv.expiresAt)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!inv.used && (
                <>
                  <button
                    onClick={() => copy(inv.code)}
                    aria-label="Kodu kopyala"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                  >
                    {copied === inv.code ? (
                      <Check size={15} className="text-accent" />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      startTransition(async () => {
                        await deleteInviteCode(inv.id);
                      })
                    }
                    disabled={pending}
                    aria-label="Kodu sil"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-destructive-soft hover:text-destructive"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
