import { CategoryIcon } from "@/components/ui/icon";
import { formatTL } from "@/lib/format";

type Item = { name: string; color: string; icon: string; total: number };

export function CategoryBars({
  items,
  limit = 6,
}: {
  items: Item[];
  limit?: number;
}) {
  const shown = items.slice(0, limit);
  const max = Math.max(...shown.map((i) => i.total), 1);
  const grandTotal = items.reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-3.5">
      {shown.map((item) => {
        const pct = Math.round((item.total / max) * 100);
        const share = grandTotal ? Math.round((item.total / grandTotal) * 100) : 0;
        return (
          <div key={item.name}>
            <div className="mb-1 flex items-center gap-2">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: item.color + "22", color: item.color }}
              >
                <CategoryIcon name={item.icon} size={14} />
              </span>
              <span className="flex-1 truncate text-sm font-medium text-ink">
                {item.name}
              </span>
              <span className="text-xs text-muted tabular-nums">%{share}</span>
              <span className="w-24 text-right text-sm font-semibold tabular-nums text-ink">
                {formatTL(item.total)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: item.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
