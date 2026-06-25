"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { monthLabel, toMonthKey } from "@/lib/format";
import { cn } from "@/lib/utils";

function lastMonths(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    out.push(toMonthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return out;
}

export function TransactionFilters({
  accountCount = 0,
  categories = [],
}: {
  accountCount?: number;
  categories?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const kind = params.get("kind") ?? "";
  const month = params.get("month") ?? "";
  const category = params.get("category") ?? "";
  const [search, setSearch] = useState(params.get("search") ?? "");

  function update(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    router.replace(`/transactions?${sp.toString()}`);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== (params.get("search") ?? "")) update({ search });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const months = lastMonths(12);

  const chips: { v: string; l: string }[] = [
    { v: "", l: "Tümü" },
    { v: "INCOME", l: "Gelir" },
    { v: "EXPENSE", l: "Gider" },
  ];

  return (
    <div
      className="card mb-4 p-4 sm:p-5"
      style={{ borderRadius: "var(--app-radius)" }}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted"
          style={{ fontFamily: "ui-monospace,Menlo,monospace" }}
        >
          Filtre ·
        </span>

        {chips.map((c) => {
          const active = kind === c.v;
          return (
            <button
              key={c.v || "all"}
              onClick={() => update({ kind: c.v })}
              className={cn(
                "rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-colors",
                active
                  ? "bg-ink text-canvas"
                  : "bg-surface-2 text-muted hover:text-ink",
              )}
              style={{ fontFamily: "ui-monospace,Menlo,monospace" }}
            >
              {c.l}
            </button>
          );
        })}

        <span className="hidden h-4 w-px bg-line sm:block" />

        <select
          value={category}
          onChange={(e) => update({ category: e.target.value })}
          aria-label="Kategoriye göre filtrele"
          className={cn(
            "h-8 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.04em] outline-none transition-colors focus-visible:border-[var(--app-primary)] focus-visible:ring-2 focus-visible:ring-[var(--app-primary-soft)]",
            category
              ? "border-[var(--app-primary)] bg-primary-soft text-primary"
              : "border-line bg-surface-2 text-muted",
          )}
          style={{ fontFamily: "ui-monospace,Menlo,monospace" }}
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <span className="ml-auto" />

        <select
          value={month}
          onChange={(e) => update({ month: e.target.value })}
          aria-label="Aya göre filtrele"
          className={cn(
            "h-8 rounded-full border px-3 text-[11px] font-semibold uppercase tracking-[0.04em] outline-none transition-colors focus-visible:border-[var(--app-primary)] focus-visible:ring-2 focus-visible:ring-[var(--app-primary-soft)]",
            month
              ? "border-[var(--app-accent)] bg-accent-soft text-accent"
              : "border-line bg-surface-2 text-muted",
          )}
          style={{ fontFamily: "ui-monospace,Menlo,monospace" }}
        >
          <option value="">Tüm zamanlar</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>

        <span
          className="rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted"
          style={{ fontFamily: "ui-monospace,Menlo,monospace" }}
        >
          {accountCount} Hesap
        </span>
      </div>

      <div className="relative mt-3">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İşlemlerde ara…"
          aria-label="İşlemlerde ara"
          spellCheck={false}
          className="h-10 w-full rounded-full border border-line bg-surface-2 pl-10 pr-3 text-sm text-ink outline-none transition-colors focus-visible:border-[var(--app-primary)] focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-[var(--app-primary-soft)]"
        />
      </div>
    </div>
  );
}
