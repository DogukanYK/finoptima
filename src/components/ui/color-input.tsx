"use client";

import { cn } from "@/lib/utils";

export function ColorInput({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && (
          <p className="text-xs text-muted">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          aria-label={`${label} — onaltılık renk kodu`}
          spellCheck={false}
          className="h-9 w-24 rounded-[calc(var(--app-radius)*0.5)] border border-line bg-surface px-2 text-xs uppercase tabular-nums text-ink outline-none transition-[border-color,box-shadow] focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)] focus-visible:border-[var(--app-primary)] focus-visible:ring-2 focus-visible:ring-[var(--app-primary)]"
        />
        <label
          className={cn(
            "relative h-9 w-9 cursor-pointer overflow-hidden rounded-[calc(var(--app-radius)*0.5)] border border-line",
          )}
        >
          <span
            className="block h-full w-full"
            style={{ background: value }}
          />
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
      </div>
    </div>
  );
}
