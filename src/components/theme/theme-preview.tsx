"use client";

import { useEffect, useRef } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { applyTheme } from "@/lib/apply-theme";
import type { ThemeSettings } from "@/lib/theme";

// Taslak temayı yalnızca bu kapsayıcıya uygulayan canlı önizleme.
export function ThemePreview({ theme }: { theme: ThemeSettings }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) applyTheme(theme, ref.current);
  }, [theme]);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-[var(--app-radius)] border border-line bg-canvas p-4"
      style={{ fontFamily: "var(--app-font-body)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">Toplam bakiye</p>
          <p
            className="text-2xl font-extrabold tabular-nums text-ink"
            style={{ fontFamily: "var(--app-font-heading)" }}
          >
            ₺ 24.850,00
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
          <Plus size={20} />
        </span>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="card p-3">
          <div className="flex items-center gap-1.5 text-xs text-accent">
            <ArrowDownLeft size={14} /> Gelir
          </div>
          <p className="mt-1 text-sm font-bold tabular-nums text-ink">
            ₺ 32.000
          </p>
        </div>
        <div className="card p-3">
          <div className="flex items-center gap-1.5 text-xs text-destructive">
            <ArrowUpRight size={14} /> Gider
          </div>
          <p className="mt-1 text-sm font-bold tabular-nums text-ink">
            ₺ 7.150
          </p>
        </div>
      </div>

      <div className="card divide-y divide-[var(--app-border)]">
        {[
          { n: "Migros", c: "Market", a: "-₺ 420,90" },
          { n: "Maaş", c: "Gelir", a: "+₺ 32.000" },
        ].map((row) => (
          <div key={row.n} className="flex items-center gap-3 p-3">
            <span className="h-8 w-8 shrink-0 rounded-full bg-primary-soft" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{row.n}</p>
              <p className="truncate text-xs text-muted">{row.c}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums text-ink">
              {row.a}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button className="h-9 flex-1 rounded-[calc(var(--app-radius)*0.7)] bg-primary text-sm font-medium text-white">
          Birincil
        </button>
        <button className="h-9 flex-1 rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface text-sm font-medium text-ink">
          İkincil
        </button>
      </div>
    </div>
  );
}
