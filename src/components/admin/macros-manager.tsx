"use client";

// Hazır yanıt makroları yöneticisi — listele + ekle/düzenle/sil.
// Server action'lar (admin-macros) her çağrıda kendi içinde requireAdminId yapar.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  createMacroAction,
  updateMacroAction,
  deleteMacroAction,
} from "@/lib/actions/admin-macros";
import type { MacroPlain } from "@/lib/support/macros";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { inputClass } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

// Bilet kategorileriyle aynı; boş = genel (eşleştirme yok).
const CATEGORIES: [string, string][] = [
  ["", "Genel (kategori yok)"],
  ["ACCOUNT", "Hesap"],
  ["TRANSACTIONS", "İşlemler"],
  ["IMPORT", "Banka Dökümü"],
  ["FINDEKS", "Findeks"],
  ["DEBTS", "Borçlar"],
  ["SECURITY", "Güvenlik"],
  ["BUG", "Hata"],
  ["OTHER", "Diğer"],
];

const CATEGORY_TR: Record<string, string> = Object.fromEntries(
  CATEGORIES.filter(([v]) => v).map(([v, l]) => [v, l]),
);

const textareaClass =
  "w-full resize-y rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface p-3.5 text-base text-ink outline-none transition-[border-color,box-shadow] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]";

type Draft = { title: string; body: string; category: string };
const EMPTY: Draft = { title: "", body: "", category: "" };

export function MacrosManager({ macros }: { macros: MacroPlain[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, after: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        after();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Yeni makro */}
      {creating ? (
        <MacroForm
          initial={EMPTY}
          busy={isPending}
          submitLabel="Ekle"
          onCancel={() => {
            setCreating(false);
            setError(null);
          }}
          onSubmit={(draft) =>
            run(
              () =>
                createMacroAction({
                  title: draft.title,
                  body: draft.body,
                  category: draft.category || null,
                }),
              () => setCreating(false),
            )
          }
        />
      ) : (
        <Button
          size="sm"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
          disabled={isPending}
        >
          <Plus size={15} />
          Yeni makro
        </Button>
      )}

      {/* Liste */}
      {macros.length === 0 && !creating ? (
        <EmptyState
          icon={<Plus size={26} />}
          title="Henüz makro yok"
          description="Sık kullandığın hazır yanıtları ekleyerek talepleri tek tıkla yanıtla."
        />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {macros.map((m) =>
            editingId === m.id ? (
              <div key={m.id} className="p-4">
                <MacroForm
                  initial={{
                    title: m.title,
                    body: m.body,
                    category: m.category ?? "",
                  }}
                  busy={isPending}
                  submitLabel="Kaydet"
                  onCancel={() => {
                    setEditingId(null);
                    setError(null);
                  }}
                  onSubmit={(draft) =>
                    run(
                      () =>
                        updateMacroAction(m.id, {
                          title: draft.title,
                          body: draft.body,
                          category: draft.category || null,
                        }),
                      () => setEditingId(null),
                    )
                  }
                />
              </div>
            ) : (
              <div
                key={m.id}
                className="flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{m.title}</p>
                    {m.category && (
                      <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
                        {CATEGORY_TR[m.category] ?? m.category}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted">
                    {m.body}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(m.id);
                      setCreating(false);
                      setError(null);
                    }}
                    disabled={isPending}
                    aria-label="Düzenle"
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (
                        typeof window !== "undefined" &&
                        !window.confirm(`“${m.title}” makrosu silinsin mi?`)
                      )
                        return;
                      run(() => deleteMacroAction(m.id), () => {});
                    }}
                    disabled={isPending}
                    className="text-destructive hover:bg-destructive/10"
                    aria-label="Sil"
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function MacroForm({
  initial,
  busy,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: Draft;
  busy: boolean;
  submitLabel: string;
  onSubmit: (draft: Draft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const valid = draft.title.trim() && draft.body.trim();

  return (
    <div className="card space-y-3 p-4">
      <input
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="Başlık — örn. Ekstre parola hatası"
        className={inputClass}
        disabled={busy}
        maxLength={120}
      />
      <Select
        value={draft.category}
        onChange={(e) => setDraft({ ...draft, category: e.target.value })}
        disabled={busy}
        aria-label="Kategori"
      >
        {CATEGORIES.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </Select>
      <textarea
        value={draft.body}
        onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        rows={5}
        placeholder="Hazır yanıt metni… (finansal veri içermez)"
        className={textareaClass}
        disabled={busy}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => onSubmit(draft)}
          disabled={busy || !valid}
        >
          {busy ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Check size={15} />
          )}
          {submitLabel}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={busy}
        >
          <X size={15} />
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
