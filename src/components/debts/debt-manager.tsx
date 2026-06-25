"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  createDebt,
  deleteDebt,
  type DebtActionState,
} from "@/lib/actions/debts";
import { formatTL } from "@/lib/format";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

const MONO = { fontFamily: "ui-monospace,Menlo,monospace" } as const;

type DebtRow = {
  id: string;
  name: string;
  kind: "CREDIT_CARD" | "LOAN";
  balance: number;
  apr: number;
  dueDay: number | null;
  paidTotal: number;
  scoreImpact: number;
};

type Filter = "all" | "card" | "loan";

export function DebtManager({ debts }: { debts: DebtRow[] }) {
  const [state, formAction] = useActionState<DebtActionState, FormData>(
    createDebt,
    {},
  );
  const [showForm, setShowForm] = useState(debts.length === 0);
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.ok) setShowForm(false);
  }, [state]);

  const visible = debts.filter((d) =>
    filter === "all"
      ? true
      : filter === "card"
        ? d.kind === "CREDIT_CARD"
        : d.kind === "LOAN",
  );

  return (
    <div className="space-y-4">
      {debts.length > 0 && (
        <div className="card p-5 sm:p-6">
          {/* başlık satırı */}
          <div className="mb-5 flex items-baseline justify-between gap-3">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted"
              style={MONO}
            >
              01 · Aktif borçlar
            </p>
            <div className="flex gap-1.5">
              {(
                [
                  ["all", "Tümü"],
                  ["card", "Kart"],
                  ["loan", "Kredi"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  style={MONO}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                    filter === key
                      ? "bg-ink text-canvas"
                      : "bg-surface-2 text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* borç satırları */}
          {visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Bu filtrede borç yok.
            </p>
          ) : (
            <div className="divide-y divide-[var(--app-border)]">
              {visible.map((d) => (
                <DebtItem
                  key={d.id}
                  debt={d}
                  pending={pending}
                  onDelete={startTransition}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showForm ? (
        <form action={formAction} className="card space-y-3 p-5">
          <p className="font-heading text-sm font-bold text-ink">
            Yeni borç ekle
          </p>
          <Field
            name="name"
            label="Ad"
            placeholder="Örn. Bonus kart veya İhtiyaç kredisi"
            required
            error={state.fieldErrors?.name}
          />
          <Select name="kind" label="Tür" defaultValue="CREDIT_CARD">
            <option value="CREDIT_CARD">Kredi Kartı</option>
            <option value="LOAN">Kredi</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Field
              name="balance"
              label="Bakiye"
              placeholder="0,00"
              inputMode="decimal"
              required
              error={state.fieldErrors?.balance}
            />
            <Field
              name="apr"
              label="Faiz oranı"
              placeholder="3,5"
              inputMode="decimal"
              required
              hint="Aylık faiz oranı %"
              error={state.fieldErrors?.apr}
            />
          </div>
          <Field
            name="dueDay"
            label="Ödeme günü (isteğe bağlı)"
            placeholder="15"
            inputMode="numeric"
            hint="Ödeme günü 1-31"
            error={state.fieldErrors?.dueDay}
          />

          {state.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <SubmitButton size="sm" className="flex-1">
              Borç ekle
            </SubmitButton>
            {debts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 text-sm font-medium text-muted"
              >
                Vazgeç
              </button>
            )}
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--app-radius)] border border-dashed border-line py-3 text-sm font-medium text-primary"
        >
          <Plus size={16} /> Borç ekle
        </button>
      )}
    </div>
  );
}

function DebtItem({
  debt: d,
  pending,
  onDelete,
}: {
  debt: DebtRow;
  pending: boolean;
  onDelete: (cb: () => void) => void;
}) {
  const card = d.kind === "CREDIT_CARD";
  const hue = card ? "var(--app-violet)" : "var(--app-primary)";
  const urgent = d.scoreImpact <= -35;

  const original = d.balance + d.paidTotal;
  const paidPct =
    original > 0
      ? Math.min(100, Math.round((d.paidTotal / original) * 100))
      : 0;

  return (
    <div className="grid grid-cols-[42px_1fr_auto] items-center gap-3 py-4 sm:grid-cols-[42px_2.4fr_1fr_1fr_1fr_auto] sm:gap-4">
      {/* ikon */}
      <span
        className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-[19px]"
        style={{
          background: `color-mix(in srgb, ${hue} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${hue} 22%, transparent)`,
        }}
      >
        {card ? "💳" : "🏦"}
      </span>

      {/* ad + pill'ler + progress */}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{d.name}</p>
          <span
            style={MONO}
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
              card ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"
            }`}
          >
            {card ? "Kart" : "Kredi"}
          </span>
          {urgent && (
            <span
              style={MONO}
              className="shrink-0 rounded-full bg-destructive-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-destructive"
            >
              ⚠ Acil
            </span>
          )}
        </div>
        {/* progress bar */}
        <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${paidPct}%`, background: hue }}
          />
        </div>
        <p
          style={MONO}
          className="mt-1 text-[10.5px] uppercase tracking-[0.04em] text-muted"
        >
          %{paidPct} ödendi
        </p>
      </div>

      {/* KALAN */}
      <div className="col-start-2 sm:col-auto">
        <p
          style={MONO}
          className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted"
        >
          Kalan
        </p>
        <p
          style={MONO}
          className="text-[17px] font-semibold tracking-tight text-ink"
        >
          {formatTL(d.balance)}
        </p>
      </div>

      {/* FAİZ + APR */}
      <div className="hidden sm:block">
        <p
          style={MONO}
          className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted"
        >
          Aylık faiz
        </p>
        <p style={MONO} className="text-[14px] font-semibold text-ink">
          %{d.apr}
        </p>
        <p
          style={MONO}
          className="mt-0.5 text-[10.5px] text-muted"
        >
          {card ? "Kredi kartı" : "Kredi"}
        </p>
      </div>

      {/* ÖDEME GÜNÜ */}
      <div className="hidden sm:block">
        <p
          style={MONO}
          className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted"
        >
          Ödeme günü
        </p>
        <p style={MONO} className="text-[14px] font-semibold text-ink">
          {d.dueDay ? `Ayın ${d.dueDay}` : "—"}
        </p>
      </div>

      {/* aksiyonlar */}
      <div className="col-start-3 row-start-1 flex items-center gap-1.5 self-start sm:col-auto sm:row-auto sm:self-center">
        <Link
          href={`/borclar/${d.id}`}
          className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-primary-soft hover:text-primary"
        >
          Detay →
        </Link>
        <button
          type="button"
          onClick={() =>
            onDelete(async () => {
              await deleteDebt(d.id);
            })
          }
          disabled={pending}
          aria-label="Borcu sil"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-destructive-soft hover:text-destructive"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
