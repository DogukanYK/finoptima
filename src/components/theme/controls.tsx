"use client";

import { cn } from "@/lib/utils";

export function ChipGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-[calc(var(--app-radius)*0.7)] border px-3.5 py-2 text-sm font-medium transition-colors",
            value === opt.value
              ? "border-primary bg-primary-soft text-primary"
              : "border-line bg-surface text-muted hover:text-ink",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{label}</p>
        <span className="text-sm tabular-nums text-muted">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--app-primary)]"
      />
    </div>
  );
}

export function FontSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {options.map((font) => (
          <button
            key={font}
            type="button"
            onClick={() => onChange(font)}
            style={{ fontFamily: `"${font}"` }}
            className={cn(
              "truncate rounded-[calc(var(--app-radius)*0.7)] border px-3 py-2.5 text-sm transition-colors",
              value === font
                ? "border-primary bg-primary-soft text-primary"
                : "border-line bg-surface text-ink hover:bg-surface-2",
            )}
          >
            {font}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <h3 className="font-heading text-base font-bold text-ink">{title}</h3>
      {description && (
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}
