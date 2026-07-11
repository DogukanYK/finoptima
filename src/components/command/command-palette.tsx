"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Sparkles,
  LayoutDashboard,
  ArrowLeftRight,
  Gauge,
  CreditCard,
  CalendarDays,
  ReceiptText,
  UserRound,
  Plus,
  Upload,
  Palette,
  Tag,
  Landmark,
  ShieldCheck,
  DatabaseBackup,
  CornerDownLeft,
  type LucideIcon,
} from "lucide-react";
import { COMMAND_ROUTES, scoreRoute } from "@/lib/command-index";
import { formatTL } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  transactions: ArrowLeftRight,
  gauge: Gauge,
  "credit-card": CreditCard,
  calendar: CalendarDays,
  receipt: ReceiptText,
  user: UserRound,
  plus: Plus,
  upload: Upload,
  palette: Palette,
  tag: Tag,
  bank: Landmark,
  shield: ShieldCheck,
  database: DatabaseBackup,
};

type DynResults = {
  categories: { id: string; label: string; kind: string; color: string; href: string }[];
  accounts: { id: string; label: string; sub: string; href: string }[];
  transactions: { id: string; label: string; amount: number; kind: string; href: string }[];
};

type FlatItem = {
  key: string;
  group: string;
  label: string;
  sub?: string;
  icon: LucideIcon;
  color?: string;
  onSelect: () => void;
};

const EMPTY_DYN: DynResults = { categories: [], accounts: [], transactions: [] };

export function CommandPalette({
  open,
  onClose,
  onAskAI,
}: {
  open: boolean;
  onClose: () => void;
  onAskAI: (query: string) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dyn, setDyn] = useState<DynResults>(EMPTY_DYN);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Açılışta sıfırla + odakla
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDyn(EMPTY_DYN);
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, [open]);

  // Canlı arama (debounce)
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setDyn(EMPTY_DYN);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/command?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        if (res.ok) setDyn(await res.json());
      } catch {
        /* iptal / ağ hatası — sessiz geç */
      }
    }, 160);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, open]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const items = useMemo<FlatItem[]>(() => {
    const q = query.trim();
    const list: FlatItem[] = [];

    if (q) {
      list.push({
        key: "ai",
        group: "AI Asistan",
        label: `"${q}" hakkında asistana sor`,
        icon: Sparkles,
        onSelect: () => {
          onClose();
          onAskAI(q);
        },
      });
    }

    const routes = q
      ? COMMAND_ROUTES.map((r) => ({ r, s: scoreRoute(q, r) }))
          .filter((x) => x.s >= 0)
          .sort((a, b) => b.s - a.s)
          .map((x) => x.r)
      : COMMAND_ROUTES;
    for (const r of routes) {
      list.push({
        key: `r:${r.href}`,
        group: r.group,
        label: r.label,
        icon: ICONS[r.icon] ?? Search,
        onSelect: () => go(r.href),
      });
    }

    for (const c of dyn.categories) {
      list.push({
        key: `c:${c.id}`,
        group: "Kategoriler",
        label: c.label,
        sub: c.kind === "INCOME" ? "Gelir kategorisi" : "Gider kategorisi",
        icon: Tag,
        color: c.color,
        onSelect: () => go(c.href),
      });
    }
    for (const a of dyn.accounts) {
      list.push({
        key: `a:${a.id}`,
        group: "Hesaplar",
        label: a.label,
        sub: a.sub,
        icon: Landmark,
        onSelect: () => go(a.href),
      });
    }
    for (const t of dyn.transactions) {
      list.push({
        key: `t:${t.id}`,
        group: "İşlemler",
        label: t.label,
        sub: `${t.kind === "INCOME" ? "+" : "−"}${formatTL(t.amount)}`,
        icon: ArrowLeftRight,
        onSelect: () => go(t.href),
      });
    }

    return list;
  }, [query, dyn, go, onAskAI, onClose]);

  useEffect(() => {
    setActive(0);
  }, [items.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[active]?.onSelect();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Aktif öğeyi görünür tut
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  if (!open) return null;

  let lastGroup = "";
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Komut paleti"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-[calc(var(--app-radius)*1.2)] border border-line bg-surface shadow-[var(--app-shadow-lg)]">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ara ya da asistana sor… (sayfa, kategori, işlem)"
            className="h-14 w-full bg-transparent text-ink outline-none placeholder:text-muted"
          />
          <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-muted sm:inline">
            esc
          </kbd>
        </div>
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">
              Sonuç yok. Asistana sormak için yazıp Enter&apos;a bas.
            </p>
          ) : (
            items.map((it, idx) => {
              const header = it.group !== lastGroup ? it.group : null;
              lastGroup = it.group;
              return (
                <div key={it.key}>
                  {header && (
                    <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {header}
                    </p>
                  )}
                  <button
                    data-idx={idx}
                    onMouseEnter={() => setActive(idx)}
                    onClick={it.onSelect}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[calc(var(--app-radius)*0.7)] px-2.5 py-2 text-left",
                      idx === active ? "bg-primary-soft" : "hover:bg-surface-2",
                    )}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[calc(var(--app-radius)*0.6)] bg-surface-2"
                      style={it.color ? { color: it.color } : undefined}
                    >
                      <it.icon
                        size={16}
                        className={cn(
                          !it.color &&
                            (idx === active ? "text-primary" : "text-muted"),
                        )}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {it.label}
                      </span>
                      {it.sub && (
                        <span className="block truncate text-xs text-muted">
                          {it.sub}
                        </span>
                      )}
                    </span>
                    {idx === active && (
                      <CornerDownLeft size={14} className="shrink-0 text-muted" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
