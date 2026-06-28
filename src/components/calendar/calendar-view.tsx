"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarClock,
  Check,
  Trash2,
  Bell,
  Receipt,
  CalendarDays,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { CategoryIcon } from "@/components/ui/icon";
import { PageHeader } from "@/components/ui/page-header";
import { EventForm } from "@/components/calendar/event-form";
import { deleteEvent, toggleEventPaid } from "@/lib/actions/events";
import { formatTL, toDateKey, TR_MONTHS, TR_WEEKDAYS } from "@/lib/format";
import { cn } from "@/lib/utils";

type DayData = {
  income: number;
  expense: number;
  txCount: number;
  events: {
    id: string;
    title: string;
    type: string;
    amount: number | null;
    isPaid: boolean;
  }[];
};

type MonthTx = {
  id: string;
  kind: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  date: string;
  description: string;
  category: { name: string; icon: string; color: string } | null;
};

const EVENT_LABEL: Record<string, string> = {
  REMINDER: "Hatırlatma",
  BILL: "Fatura",
  EVENT: "Etkinlik",
};

// Olay türüne göre vurgu rengi (fintech paleti — mor/sarı yok)
const EVENT_COLOR: Record<string, string> = {
  REMINDER: "var(--app-primary)",
  BILL: "var(--app-destructive)",
  EVENT: "var(--app-accent)",
};

// Olay türüne göre lucide ikon (pill/satır için)
const EVENT_ICON: Record<
  string,
  React.ComponentType<{ size?: number | string; className?: string }>
> = {
  REMINDER: Bell,
  BILL: Receipt,
  EVENT: CalendarDays,
};

const VIEW_PILLS = ["AY", "HAFTA", "GÜN"] as const;

export function CalendarView({
  year,
  month0,
  days,
  transactions,
}: {
  year: number;
  month0: number;
  days: Record<string, DayData>;
  transactions: MonthTx[];
}) {
  const todayKey = toDateKey(new Date());
  const firstSelectable =
    new Date().getFullYear() === year && new Date().getMonth() === month0
      ? todayKey
      : toDateKey(new Date(year, month0, 1));
  const [selected, setSelected] = useState<string>(firstSelectable);
  const [adding, setAdding] = useState(false);

  // ızgara
  const firstOfMonth = new Date(year, month0, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7;
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(year, month0, 1 - startWeekday + i));
  }

  const prev = new Date(year, month0 - 1, 1);
  const next = new Date(year, month0 + 1, 1);

  const selectedTx = transactions.filter(
    (t) => toDateKey(new Date(t.date)) === selected,
  );
  const selectedEvents = days[selected]?.events ?? [];

  // Ay özeti — gerçek veriden
  const allEvents = Object.values(days).flatMap((d) => d.events);
  const monthIncome = Object.values(days).reduce((s, d) => s + d.income, 0);
  const billEvents = allEvents.filter((e) => e.type === "BILL");
  const reminderEvents = allEvents.filter((e) => e.type === "REMINDER");
  const otherEvents = allEvents.filter((e) => e.type === "EVENT");
  const billsTotal = billEvents.reduce((s, e) => s + (e.amount ?? 0), 0);
  const otherTotal = otherEvents.reduce((s, e) => s + (e.amount ?? 0), 0);

  const summaryRows = [
    {
      label: "Faturalar",
      value: formatTL(billsTotal),
      color: "var(--app-destructive)",
      count: billEvents.length,
    },
    {
      label: "Gelir",
      value: formatTL(monthIncome),
      color: "var(--app-accent)",
      count: null,
    },
    {
      label: "Hatırlatma",
      value: String(reminderEvents.length),
      color: "var(--app-primary)",
      count: null,
    },
    {
      label: "Etkinlik",
      value: formatTL(otherTotal),
      color: "var(--app-accent)",
      count: otherEvents.length,
    },
  ];

  // Yaklaşan — seçili günden sonraki olaylar (tarih sırası)
  const upcoming = Object.entries(days)
    .flatMap(([key, d]) =>
      d.events.map((e) => ({ key, date: new Date(key), event: e })),
    )
    .filter((r) => r.key > selected)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  const selectedDate = new Date(selected);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        kicker="Takvim"
        title="Ajandan"
        description="Harcamaların ve etkinliklerin tek takvimde."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex items-center gap-1">
              {VIEW_PILLS.map((p) => (
                <span
                  key={p}
                  className={cn(
                    "rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide",
                    p === "AY"
                      ? "bg-primary text-white"
                      : "bg-[rgba(15,23,42,0.05)] text-muted",
                  )}
                >
                  {p}
                </span>
              ))}
            </div>
            <Link
              href={`/calendar?y=${prev.getFullYear()}&m=${prev.getMonth() + 1}`}
              aria-label="Önceki ay"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-surface-2"
            >
              <ChevronLeft size={16} />
            </Link>
            <Link
              href={`/calendar?y=${next.getFullYear()}&m=${next.getMonth() + 1}`}
              aria-label="Sonraki ay"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-surface-2"
            >
              <ChevronRight size={16} />
            </Link>
            <button
              onClick={() => {
                setAdding(true);
                if (
                  new Date().getFullYear() === year &&
                  new Date().getMonth() === month0
                ) {
                  setSelected(todayKey);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Plus size={15} /> Etkinlik
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[7fr_3fr]">
        {/* Ay ızgarası */}
        <div className="card p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-heading text-lg font-bold tracking-tight text-ink">
              {TR_MONTHS[month0]} {year}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
              <CalendarDays size={13} />
              {allEvents.length} olay
            </span>
          </div>

          {/* gün başlıkları */}
          <div className="mb-2.5 grid grid-cols-7 gap-1 border-b border-line pb-2.5">
            {TR_WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-bold uppercase tracking-[0.08em] text-muted"
              >
                {d}
              </div>
            ))}
          </div>

          {/* hücreler */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((date) => {
              const key = toDateKey(date);
              const inMonth = date.getMonth() === month0;
              const data = days[key];
              const isToday = key === todayKey;
              const isSelected = key === selected;
              const evs = data?.events ?? [];
              const hasData = !!data && (data.txCount > 0 || evs.length > 0);

              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelected(key);
                    setAdding(false);
                  }}
                  className={cn(
                    "card flex min-h-[88px] flex-col gap-1 p-2 text-left transition-[box-shadow,transform,background-color] hover:-translate-y-0.5 sm:min-h-[96px]",
                    !inMonth && "opacity-35",
                    isToday
                      ? "border-primary bg-primary-soft"
                      : isSelected
                        ? "border-primary"
                        : hasData
                          ? "bg-surface-2"
                          : "",
                  )}
                  style={
                    isSelected && !isToday
                      ? { boxShadow: "0 0 0 1px var(--app-primary)" }
                      : undefined
                  }
                >
                  <div className="flex items-baseline justify-between">
                    <span
                      className={cn(
                        "font-heading text-[13px] font-bold tabular-nums",
                        isToday ? "text-primary" : "text-ink",
                      )}
                    >
                      {date.getDate()}
                    </span>
                    {isToday && (
                      <span className="inline-flex items-center rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-white">
                        Bugün
                      </span>
                    )}
                  </div>

                  {evs.slice(0, 3).map((e) => {
                    const color = EVENT_COLOR[e.type] ?? "var(--app-primary)";
                    return (
                      <div
                        key={e.id}
                        style={{
                          borderLeft: `2px solid ${color}`,
                          background: `color-mix(in srgb, ${color} 12%, transparent)`,
                        }}
                        className="truncate rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-semibold text-ink"
                      >
                        {e.title}
                        {e.amount != null && (
                          <span className="float-right ml-1 tabular-nums text-muted">
                            {compact(e.amount)}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {evs.length === 0 && data && data.txCount > 0 && (
                    <span
                      className={cn(
                        "mt-auto text-[9.5px] font-semibold tabular-nums",
                        data.income - data.expense >= 0
                          ? "text-accent"
                          : "text-destructive",
                      )}
                    >
                      {data.income - data.expense >= 0 ? "+" : "−"}
                      {compact(Math.abs(data.income - data.expense))} ·{" "}
                      {data.txCount} işlem
                    </span>
                  )}
                  {evs.length > 0 && data && data.txCount > 0 && (
                    <span className="text-[9px] font-semibold tabular-nums text-muted">
                      {data.txCount} işlem
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sağ panel */}
        <div className="flex flex-col gap-4">
          {/* Bugün / seçili gün detayı */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                {selected === todayKey ? "Bugün" : "Seçili gün"} ·{" "}
                {selectedDate.getDate()} {TR_MONTHS[selectedDate.getMonth()]}
              </p>
              <span className="text-[11px] font-semibold tabular-nums text-muted">
                {selectedEvents.length} olay
              </span>
            </div>

            {adding && (
              <div className="mb-3">
                <EventForm date={selected} onDone={() => setAdding(false)} />
              </div>
            )}

            {!adding &&
              selectedEvents.length === 0 &&
              selectedTx.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">
                  Bu gün için kayıt yok.
                </p>
              )}

            {selectedEvents.length > 0 && (
              <div className="space-y-2">
                {selectedEvents.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            )}

            {selectedTx.length > 0 && (
              <div
                className={cn(
                  "divide-y divide-[var(--app-border)]",
                  selectedEvents.length > 0 &&
                    "mt-2 border-t border-line pt-1",
                )}
              >
                {selectedTx.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: (t.category?.color ?? "#94A3B8") + "22",
                        color: t.category?.color ?? "#94A3B8",
                      }}
                    >
                      <CategoryIcon
                        name={t.category?.icon ?? "tag"}
                        size={15}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {t.description}
                      </p>
                      <p className="text-[10.5px] text-muted">
                        {t.category?.name ?? "Kategorisiz"}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        t.kind === "INCOME"
                          ? "text-accent"
                          : t.kind === "TRANSFER"
                            ? "text-muted"
                            : "text-ink",
                      )}
                    >
                      {t.kind === "INCOME"
                        ? "+"
                        : t.kind === "TRANSFER"
                          ? "↔ "
                          : "−"}
                      {formatTL(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bu ayın özeti — koyu hero kartı */}
          <div className="card-dark relative overflow-hidden p-5">
            <div
              className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(37,99,235,0.55) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/60">
                  Bu ayın özeti
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                  <TrendingUp size={12} />
                  Gelir
                </span>
              </div>
              <div className="mt-3 font-heading text-3xl font-extrabold tabular-nums tracking-tight text-white">
                {formatTL(monthIncome)}
              </div>

              <div className="mt-4 border-t border-white/10 pt-1">
                {summaryRows.map((r, i, a) => (
                  <div
                    key={r.label}
                    className={cn(
                      "grid grid-cols-[12px_1fr_auto] items-center gap-2.5 py-2.5",
                      i < a.length - 1 && "border-b border-white/10",
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-[3px]"
                      style={{ background: r.color }}
                    />
                    <div>
                      <div className="text-[13px] font-medium text-white/90">
                        {r.label}
                      </div>
                      {r.count != null && (
                        <div className="text-[10px] tabular-nums text-white/50">
                          {r.count} olay
                        </div>
                      )}
                    </div>
                    <div className="text-[13px] font-semibold tabular-nums text-white">
                      {r.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Yaklaşan */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
                <Sparkles size={13} className="text-primary" />
                Yaklaşan
              </p>
              <span className="text-[11px] font-semibold tabular-nums text-muted">
                {upcoming.length} olay
              </span>
            </div>
            {upcoming.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">
                Yaklaşan olay yok.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {upcoming.map(({ key, date, event }) => {
                  const color = EVENT_COLOR[event.type] ?? "var(--app-primary)";
                  const Icon = EVENT_ICON[event.type] ?? CalendarDays;
                  return (
                    <div
                      key={key + event.id}
                      className="grid grid-cols-[48px_1fr_auto] items-center gap-2.5 rounded-xl bg-surface-2 px-2.5 py-2"
                      style={{ borderLeft: `3px solid ${color}` }}
                    >
                      <div className="text-center">
                        <div className="font-heading text-sm font-bold leading-none tabular-nums text-ink">
                          {date.getDate()}
                        </div>
                        <div className="mt-0.5 text-[8.5px] uppercase tracking-[0.06em] text-muted">
                          {TR_MONTHS[date.getMonth()].slice(0, 3)}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-ink">
                          {event.title}
                        </div>
                        <div
                          className="mt-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
                          style={{
                            background: `color-mix(in srgb, ${color} 12%, transparent)`,
                            color,
                          }}
                        >
                          <Icon size={11} />
                          {EVENT_LABEL[event.type] ?? "Etkinlik"}
                        </div>
                      </div>
                      {event.amount != null && (
                        <div className="text-[12px] font-semibold tabular-nums text-ink">
                          {formatTL(event.amount)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Izgara hücresi için kısa tutar gösterimi
function compact(n: number): string {
  return Math.abs(n) >= 1000
    ? `${Math.round(n / 1000)}b`
    : String(Math.round(n));
}

function EventRow({
  event,
}: {
  event: {
    id: string;
    title: string;
    type: string;
    amount: number | null;
    isPaid: boolean;
  };
}) {
  const [pending, startTransition] = useTransition();
  const color = EVENT_COLOR[event.type] ?? "var(--app-primary)";
  const Icon = EVENT_ICON[event.type] ?? CalendarDays;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
      <button
        onClick={() =>
          startTransition(async () => {
            await toggleEventPaid(event.id);
          })
        }
        disabled={pending}
        aria-label={event.isPaid ? "Yapılmadı işaretle" : "Yapıldı işaretle"}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
          event.isPaid
            ? "border-accent bg-accent text-white"
            : "border-line text-muted hover:border-primary",
        )}
      >
        {event.isPaid ? <Check size={15} /> : <CalendarClock size={15} />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold text-ink",
            event.isPaid && "line-through opacity-60",
          )}
        >
          {event.title}
        </p>
        <span
          className="mt-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
          style={{
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            color,
          }}
        >
          <Icon size={11} />
          {EVENT_LABEL[event.type] ?? "Etkinlik"}
        </span>
      </div>
      {event.amount != null && (
        <p className="text-sm font-semibold tabular-nums text-ink">
          {formatTL(event.amount)}
        </p>
      )}
      <button
        onClick={() =>
          startTransition(async () => {
            await deleteEvent(event.id);
          })
        }
        disabled={pending}
        aria-label="Etkinliği sil"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-destructive-soft hover:text-destructive"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
