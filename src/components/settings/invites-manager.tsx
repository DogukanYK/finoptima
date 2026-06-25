"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Copy, Check, Ticket } from "lucide-react";
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
        className="flex w-full items-center justify-center gap-2 rounded-[var(--app-radius)] bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60"
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
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Ticket size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold tracking-wider text-ink">
                  {inv.code}
                </p>
                <p className="text-xs text-muted">
                  {inv.used
                    ? `Kullanıldı${inv.usedByName ? ` · ${inv.usedByName}` : ""}`
                    : inv.expiresAt
                      ? `Son geçerlilik ${formatDateShort(inv.expiresAt)}`
                      : "Aktif"}
                </p>
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
              {inv.used && (
                <span className="rounded-full bg-surface-2 px-2 py-1 text-xs text-muted">
                  Dolu
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
