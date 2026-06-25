"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2, ChevronDown, MoreHorizontal } from "lucide-react";
import { CategoryIcon } from "@/components/ui/icon";
import {
  deleteTransaction,
  loadMoreTransactions,
} from "@/lib/actions/transactions";
import { formatTL, formatDate, toDateKey } from "@/lib/format";
import type { PlainTransaction, TransactionFilters } from "@/lib/queries";
import { cn } from "@/lib/utils";

function dayLabel(dateKey: string): string {
  const today = toDateKey(new Date());
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dateKey === today) return "Bugün";
  if (dateKey === toDateKey(y)) return "Dün";
  return formatDate(dateKey);
}

const MONO = { fontFamily: "ui-monospace,Menlo,monospace" } as const;

function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Kaynak → pill etiketi + renk eşlemesi
function sourcePill(source: string): { label: string; cls: string } {
  switch (source) {
    case "STATEMENT":
      return { label: "BANKA", cls: "bg-primary-soft text-primary" };
    case "RECEIPT":
      return { label: "OCR", cls: "bg-accent-soft text-accent" };
    default:
      return { label: "MANUEL", cls: "bg-surface-2 text-muted" };
  }
}

export function TransactionList({
  initialItems,
  initialCursor,
  filters,
}: {
  initialItems: PlainTransaction[];
  initialCursor: string | null;
  filters: TransactionFilters;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [pending, startTransition] = useTransition();

  function loadMore() {
    if (!cursor) return;
    startTransition(async () => {
      const next = await loadMoreTransactions(filters, cursor);
      setItems((prev) => [...prev, ...next.items]);
      setCursor(next.nextCursor);
    });
  }

  const groups = new Map<string, PlainTransaction[]>();
  for (const t of items) {
    const key = toDateKey(new Date(t.date));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  return (
    <div className="space-y-3.5">
      {[...groups.entries()].map(([dateKey, txs]) => {
        const dayTotal = txs.reduce(
          (s, t) =>
            s +
            (t.kind === "INCOME"
              ? t.amount
              : t.kind === "EXPENSE"
                ? -t.amount
                : 0),
          0,
        );
        return (
          <div
            key={dateKey}
            className="card overflow-hidden p-0"
            style={{ borderRadius: "var(--app-radius)" }}
          >
            {/* gün başlığı */}
            <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/60 px-5 py-3.5">
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-lg font-extrabold tracking-tight text-ink">
                  {dayLabel(dateKey)}
                </span>
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted"
                  style={MONO}
                >
                  {txs.length} işlem
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  dayTotal >= 0 ? "text-accent" : "text-ink",
                )}
                style={MONO}
              >
                {dayTotal >= 0 ? "+" : "−"}
                {formatTL(Math.abs(dayTotal))}
              </span>
            </div>

            {/* işlem satırları */}
            <div className="divide-y divide-[var(--app-border)]">
              {txs.map((t) => (
                <TransactionRow key={t.id} tx={t} />
              ))}
            </div>
          </div>
        );
      })}

      {cursor && (
        <button
          onClick={loadMore}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--app-radius)] border border-line py-3 text-sm font-medium text-primary transition-colors hover:bg-surface-2 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ChevronDown size={16} />
          )}
          {pending ? "Yükleniyor…" : "Daha fazla yükle"}
        </button>
      )}
    </div>
  );
}

function TransactionRow({ tx }: { tx: PlainTransaction }) {
  const [confirming, setConfirming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const pill = sourcePill(tx.source);
  const accent = tx.category?.color ?? "#94A3B8";

  return (
    <div className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-2/50">
      {/* ikon kutusu */}
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border border-line"
        style={{ background: accent + "1c", color: accent }}
      >
        <CategoryIcon name={tx.category?.icon ?? "tag"} size={18} />
      </span>

      {/* açıklama + kaynak/not */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          {tx.description}
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em]",
              pill.cls,
            )}
            style={MONO}
          >
            {pill.label}
          </span>
          {tx.note && (
            <span
              className="truncate text-[10.5px] tracking-[0.01em] text-muted"
              style={MONO}
            >
              // {tx.note}
            </span>
          )}
        </div>
      </div>

      {/* kategori chip */}
      <span
        className="hidden shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-ink sm:inline"
        style={MONO}
      >
        {tx.category?.name ?? "Kategorisiz"}
      </span>

      {/* hesap */}
      <span
        className="hidden w-24 shrink-0 truncate text-right text-[11.5px] tracking-[0.02em] text-muted md:inline"
        style={MONO}
      >
        {tx.account?.label ?? "—"}
      </span>

      {/* saat */}
      <span
        className="hidden w-14 shrink-0 text-right text-[11px] text-muted sm:inline"
        style={MONO}
      >
        {formatTime(tx.date)}
      </span>

      {/* tutar */}
      <p
        className={cn(
          "w-28 shrink-0 text-right text-[15px] font-semibold tracking-tight tabular-nums",
          tx.kind === "INCOME"
            ? "text-accent"
            : tx.kind === "TRANSFER"
              ? "text-muted"
              : "text-ink",
        )}
        style={MONO}
      >
        {tx.kind === "INCOME" ? "+" : tx.kind === "TRANSFER" ? "↔ " : "−"}
        {formatTL(tx.amount)}
      </p>

      {/* satır sonu menüsü */}
      {confirming ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() =>
              startTransition(async () => {
                await deleteTransaction(tx.id);
              })
            }
            disabled={pending}
            className="rounded-[calc(var(--app-radius)*0.5)] bg-destructive px-2 py-1 text-xs font-medium text-white"
          >
            {pending ? <Loader2 size={13} className="animate-spin" /> : "Sil"}
          </button>
          <button
            onClick={() => {
              setConfirming(false);
              setMenuOpen(false);
            }}
            className="rounded-[calc(var(--app-radius)*0.5)] px-2 py-1 text-xs text-muted"
          >
            Vazgeç
          </button>
        </div>
      ) : menuOpen ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setConfirming(true)}
            aria-label="İşlemi sil"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-destructive-soft hover:text-destructive"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setMenuOpen(false)}
            className="rounded-[calc(var(--app-radius)*0.5)] px-2 py-1 text-xs text-muted"
          >
            Kapat
          </button>
        </div>
      ) : (
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="İşlem menüsü"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <MoreHorizontal size={16} />
        </button>
      )}
    </div>
  );
}
