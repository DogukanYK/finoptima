"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import {
  THEME_PRESETS,
  DEFAULT_THEME,
  type ThemeMode,
  type ThemeSettings,
} from "@/lib/theme";
import { applyTheme } from "@/lib/apply-theme";
import { cn } from "@/lib/utils";

const MODES: { value: ThemeMode; label: string }[] = [
  { value: "LIGHT", label: "Açık" },
  { value: "DARK", label: "Koyu" },
  { value: "SYSTEM", label: "Sistem" },
];

function resolvePreset(name: string): ThemeSettings {
  const p = THEME_PRESETS.find((x) => x.name === name);
  return p ? { ...DEFAULT_THEME, ...p.values } : DEFAULT_THEME;
}

// Mod (açık/koyu/sistem) + renk paleti seçici. Onboarding + Ayarlar>Görünüm ortak.
// Seçim değişince tüm uygulamayı canlı yeniden renklendirir (belge kökü).
export function PresetPicker({
  mode,
  presetName,
  onChange,
  livePreview = true,
}: {
  mode: ThemeMode;
  presetName: string;
  onChange: (next: { mode: ThemeMode; presetName: string }) => void;
  livePreview?: boolean;
}) {
  useEffect(() => {
    if (!livePreview) return;
    applyTheme({ ...resolvePreset(presetName), mode });
  }, [mode, presetName, livePreview]);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-ink">Görünüm modu</p>
        <div className="flex gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange({ mode: m.value, presetName })}
              className={cn(
                "flex-1 rounded-[calc(var(--app-radius)*0.7)] border px-3 py-2.5 text-sm font-medium transition-colors",
                mode === m.value
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Renk paleti</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {THEME_PRESETS.map((p) => {
            const active = p.name === presetName;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => onChange({ mode, presetName: p.name })}
                className={cn(
                  "relative rounded-[var(--app-radius)] border p-3 text-left transition-colors",
                  active
                    ? "border-primary ring-2 ring-[var(--app-primary)]/25"
                    : "border-line hover:border-primary/40",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Swatch color={p.values.primaryColor} />
                  <Swatch color={p.values.accentColor} />
                  <Swatch color={p.values.destructiveColor} />
                  {active && (
                    <Check size={14} className="ml-auto text-primary" />
                  )}
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">{p.name}</p>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Swatch({ color }: { color?: string }) {
  return (
    <span
      className="h-5 w-5 rounded-full border border-black/10"
      style={{ background: color ?? "#ccc" }}
    />
  );
}
