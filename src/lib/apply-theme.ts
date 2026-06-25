"use client";

import { computeVars, resolvedIsDark, type ThemeSettings } from "@/lib/theme";

// Tema ayarlarını bir DOM elemanına (varsayılan: belge kökü) canlı uygular.
export function applyTheme(theme: ThemeSettings, el?: HTMLElement) {
  const target = el ?? document.documentElement;
  const systemDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = resolvedIsDark(theme.mode, systemDark);
  const vars = computeVars(theme, isDark);
  for (const [key, value] of Object.entries(vars)) {
    target.style.setProperty(key, value);
  }
}
