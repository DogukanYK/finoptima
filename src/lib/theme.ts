// Tema token sistemi — kullanıcının ThemeSettings kaydını CSS değişkenlerine çevirir.

export type ThemeMode = "LIGHT" | "DARK" | "SYSTEM";

export type ThemeSettings = {
  mode: ThemeMode;
  presetName: string;
  primaryColor: string;
  accentColor: string;
  destructiveColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  darkBackgroundColor: string;
  darkSurfaceColor: string;
  darkTextColor: string;
  darkMutedTextColor: string;
  darkBorderColor: string;
  statusColors: { success: string; warning: string; danger: string };
  chartColors: string[];
  headingFont: string;
  bodyFont: string;
  fontWeightBody: number;
  fontWeightHeading: number;
  baseFontSize: number;
  lineHeight: number;
  letterSpacing: number;
  borderRadius: number;
  shadowIntensity: string;
  borderWidth: number;
  density: string;
  animationLevel: string;
};

// Modern, sleek, fresh fintech — serin slate nötrleri, güven mavisi (#2563EB) +
// zümrüt kâr yeşili (#059669), net kırmızı tehlike. Space Grotesk başlık (modern,
// distinctive) + IBM Plex Sans gövde (bankacılık/güven). Mor/pembe gradyan YOK.
export const DEFAULT_THEME: ThemeSettings = {
  mode: "LIGHT",
  presetName: "Mavi",
  primaryColor: "#2563EB",
  accentColor: "#059669",
  destructiveColor: "#DC2626",
  backgroundColor: "#F8FAFC",
  surfaceColor: "#FFFFFF",
  textColor: "#0F172A",
  mutedTextColor: "#64748B",
  borderColor: "#E2E8F0",
  darkBackgroundColor: "#0B1120",
  darkSurfaceColor: "#111827",
  darkTextColor: "#F1F5F9",
  darkMutedTextColor: "#94A3B8",
  darkBorderColor: "#1E293B",
  statusColors: { success: "#059669", warning: "#D97706", danger: "#DC2626" },
  chartColors: ["#2563EB", "#059669", "#F59E0B", "#0EA5E9", "#6366F1", "#EF4444"],
  headingFont: "Space Grotesk",
  bodyFont: "IBM Plex Sans",
  fontWeightBody: 400,
  fontWeightHeading: 700,
  baseFontSize: 16,
  lineHeight: 1.55,
  letterSpacing: 0,
  borderRadius: 16,
  shadowIntensity: "soft",
  borderWidth: 1,
  density: "comfortable",
  animationLevel: "full",
};

export type ThemePreset = {
  name: string;
  description: string;
  values: Partial<ThemeSettings>;
};

// Küratörlü tam paletler — her biri light + dark renk setini birlikte taşır ki
// mode bağımsız çalışsın ve kontrast her modda tutarlı olsun. Tipografi/köşe/
// yoğunluk preset'e dahil DEĞİL (daima DEFAULT_THEME).
export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Mavi",
    description: "Güven mavisi + zümrüt — dengeli, varsayılan.",
    values: {
      primaryColor: "#2563EB",
      accentColor: "#059669",
      destructiveColor: "#DC2626",
      backgroundColor: "#F8FAFC",
      surfaceColor: "#FFFFFF",
      textColor: "#0F172A",
      mutedTextColor: "#64748B",
      borderColor: "#E2E8F0",
      darkBackgroundColor: "#0B1120",
      darkSurfaceColor: "#111827",
      darkTextColor: "#F1F5F9",
      darkMutedTextColor: "#94A3B8",
      darkBorderColor: "#1E293B",
      chartColors: ["#2563EB", "#059669", "#F59E0B", "#0EA5E9", "#6366F1", "#EF4444"],
    },
  },
  {
    name: "Zümrüt",
    description: "Zümrüt yeşili — sakin, doğal, para odaklı.",
    values: {
      primaryColor: "#047857",
      accentColor: "#0D9488",
      destructiveColor: "#DC2626",
      backgroundColor: "#F5FAF7",
      surfaceColor: "#FFFFFF",
      textColor: "#0C1512",
      mutedTextColor: "#5C6F66",
      borderColor: "#DCE7E1",
      darkBackgroundColor: "#09110E",
      darkSurfaceColor: "#101B16",
      darkTextColor: "#ECFDF5",
      darkMutedTextColor: "#8DA69A",
      darkBorderColor: "#1E2C26",
      chartColors: ["#047857", "#0D9488", "#2563EB", "#D97706", "#6366F1", "#DC2626"],
    },
  },
  {
    name: "Gece Mavisi",
    description: "İndigo — modern, teknolojik, koyuya yatkın.",
    values: {
      primaryColor: "#4F46E5",
      accentColor: "#0EA5E9",
      destructiveColor: "#DC2626",
      backgroundColor: "#F7F8FD",
      surfaceColor: "#FFFFFF",
      textColor: "#111327",
      mutedTextColor: "#666A85",
      borderColor: "#E2E4F0",
      darkBackgroundColor: "#0A0D1E",
      darkSurfaceColor: "#121531",
      darkTextColor: "#EEF0FB",
      darkMutedTextColor: "#9297B8",
      darkBorderColor: "#20244A",
      chartColors: ["#4F46E5", "#0EA5E9", "#059669", "#F59E0B", "#EC4899", "#EF4444"],
    },
  },
  {
    name: "Bordo",
    description: "Bordo + amber — sıcak, klasik, güçlü.",
    values: {
      primaryColor: "#9F1239",
      accentColor: "#B45309",
      destructiveColor: "#DC2626",
      backgroundColor: "#FBF7F7",
      surfaceColor: "#FFFFFF",
      textColor: "#1C0D12",
      mutedTextColor: "#7A6068",
      borderColor: "#EFDFE3",
      darkBackgroundColor: "#150A0E",
      darkSurfaceColor: "#1F1216",
      darkTextColor: "#FBF1F3",
      darkMutedTextColor: "#B08E97",
      darkBorderColor: "#332026",
      chartColors: ["#9F1239", "#B45309", "#0F766E", "#2563EB", "#7C3AED", "#DC2626"],
    },
  },
  {
    name: "Mono",
    description: "Tek renk disiplini — nötr, minimal.",
    values: {
      primaryColor: "#27272A",
      accentColor: "#52525B",
      destructiveColor: "#DC2626",
      backgroundColor: "#F4F4F5",
      surfaceColor: "#FFFFFF",
      textColor: "#111113",
      mutedTextColor: "#71717A",
      borderColor: "#E4E4E7",
      darkBackgroundColor: "#09090B",
      darkSurfaceColor: "#151518",
      darkTextColor: "#F4F4F5",
      darkMutedTextColor: "#A1A1AA",
      darkBorderColor: "#26262B",
      chartColors: ["#27272A", "#52525B", "#2563EB", "#059669", "#D97706", "#DC2626"],
    },
  },
];

// Kullanıcının kaydından SADECE mode + presetName okunur; renkler koddan çözülür.
// Bilinmeyen preset (eski satırlar) → DEFAULT_THEME. Tipografi/köşe/yoğunluk DAİMA
// DEFAULT_THEME → yazı/kontrast tutarlı, DB'deki eski font/renk sızmaz.
export function appliedThemeFromUser(
  row: { mode?: string | null; presetName?: string | null } | null | undefined,
): ThemeSettings {
  const mode = normalizeMode(row?.mode);
  const preset = THEME_PRESETS.find((p) => p.name === row?.presetName);
  const base = preset ? { ...DEFAULT_THEME, ...preset.values } : DEFAULT_THEME;
  return { ...base, mode };
}

function normalizeMode(m: unknown): ThemeMode {
  return m === "LIGHT" || m === "DARK" || m === "SYSTEM" ? m : DEFAULT_THEME.mode;
}

const SHADOW_MAP: Record<string, { card: string; cardLg: string }> = {
  none: { card: "none", cardLg: "none" },
  soft: {
    card: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
    cardLg: "0 8px 24px rgba(15,23,42,0.08)",
  },
  medium: {
    card: "0 2px 8px rgba(15,23,42,0.1)",
    cardLg: "0 12px 32px rgba(15,23,42,0.14)",
  },
  strong: {
    card: "0 4px 14px rgba(15,23,42,0.16)",
    cardLg: "0 20px 48px rgba(15,23,42,0.22)",
  },
};

const DENSITY_MAP: Record<string, { gap: string; pad: string; row: string }> = {
  compact: { gap: "0.625rem", pad: "0.875rem", row: "2.5rem" },
  comfortable: { gap: "1rem", pad: "1.25rem", row: "3rem" },
  spacious: { gap: "1.5rem", pad: "1.75rem", row: "3.5rem" },
};

function lightVars(t: ThemeSettings): Record<string, string> {
  const shadow = SHADOW_MAP[t.shadowIntensity] ?? SHADOW_MAP.soft;
  const density = DENSITY_MAP[t.density] ?? DENSITY_MAP.comfortable;
  return {
    "--app-bg": t.backgroundColor,
    "--app-surface": t.surfaceColor,
    "--app-surface-2": mix(t.surfaceColor, t.backgroundColor, 0.5),
    "--app-text": t.textColor,
    "--app-muted": t.mutedTextColor,
    "--app-border": t.borderColor,
    "--app-primary": t.primaryColor,
    "--app-primary-soft": withAlpha(t.primaryColor, 0.12),
    "--app-accent": t.accentColor,
    "--app-accent-soft": withAlpha(t.accentColor, 0.12),
    "--app-destructive": t.destructiveColor,
    "--app-destructive-soft": withAlpha(t.destructiveColor, 0.12),
    "--app-success": t.statusColors.success,
    "--app-warning": t.statusColors.warning,
    "--app-danger": t.statusColors.danger,
    "--app-shadow": shadow.card,
    "--app-shadow-lg": shadow.cardLg,
    "--app-radius": `${t.borderRadius}px`,
    "--app-border-width": `${t.borderWidth}px`,
    "--app-font-body": `"${t.bodyFont}", system-ui, sans-serif`,
    "--app-font-heading": `"${t.headingFont}", system-ui, sans-serif`,
    "--app-fw-body": `${t.fontWeightBody}`,
    "--app-fw-heading": `${t.fontWeightHeading}`,
    "--app-base-size": `${t.baseFontSize}px`,
    "--app-line-height": `${t.lineHeight}`,
    "--app-letter-spacing": `${t.letterSpacing}em`,
    "--app-density-gap": density.gap,
    "--app-density-pad": density.pad,
    "--app-density-row": density.row,
    "--app-chart-1": t.chartColors[0] ?? "#1E40AF",
    "--app-chart-2": t.chartColors[1] ?? "#059669",
    "--app-chart-3": t.chartColors[2] ?? "#F59E0B",
    "--app-chart-4": t.chartColors[3] ?? "#8B5CF6",
    "--app-chart-5": t.chartColors[4] ?? "#EC4899",
    "--app-chart-6": t.chartColors[5] ?? "#06B6D4",
  };
}

function darkColorVars(t: ThemeSettings): Record<string, string> {
  return {
    "--app-bg": t.darkBackgroundColor,
    "--app-surface": t.darkSurfaceColor,
    "--app-surface-2": mix(t.darkSurfaceColor, t.darkBackgroundColor, 0.5),
    "--app-text": t.darkTextColor,
    "--app-muted": t.darkMutedTextColor,
    "--app-border": t.darkBorderColor,
    "--app-primary-soft": withAlpha(t.primaryColor, 0.2),
    "--app-accent-soft": withAlpha(t.accentColor, 0.2),
    "--app-destructive-soft": withAlpha(t.destructiveColor, 0.2),
  };
}

function toCssBlock(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
}

// Belirli bir moda göre tüm CSS değişkenlerini hesaplar (canlı önizleme için).
export function computeVars(
  t: ThemeSettings,
  isDark: boolean,
): Record<string, string> {
  const light = lightVars(t);
  return isDark ? { ...light, ...darkColorVars(t) } : light;
}

// Tema ayarlarından <style> içeriği üretir — sunucu tarafında, FOUC olmadan.
export function themeStyleContent(t: ThemeSettings): string {
  const light = lightVars(t);
  const dark = darkColorVars(t);

  if (t.mode === "LIGHT") {
    return `:root{color-scheme:light;${toCssBlock(light)}}`;
  }
  if (t.mode === "DARK") {
    return `:root{color-scheme:dark;${toCssBlock({ ...light, ...dark })}}`;
  }
  // SYSTEM
  return `:root{color-scheme:light dark;${toCssBlock(light)}}@media (prefers-color-scheme:dark){:root{${toCssBlock(dark)}}}`;
}

export function resolvedIsDark(mode: ThemeMode, systemDark: boolean): boolean {
  if (mode === "DARK") return true;
  if (mode === "LIGHT") return false;
  return systemDark;
}

// --- renk yardımcıları ---

function clampHex(h: string): string {
  return h.startsWith("#") ? h : `#${h}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = clampHex(hex).replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function mix(a: string, b: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 * ratio + r2 * (1 - ratio));
  const g = Math.round(g1 * ratio + g2 * (1 - ratio));
  const bl = Math.round(b1 * ratio + b2 * (1 - ratio));
  return `rgb(${r},${g},${bl})`;
}

// WCAG kontrast oranı — kişiselleştirme uyarıları için
export function contrastRatio(fg: string, bg: string): number {
  const lum = (hex: string) => {
    const [r, g, b] = hexToRgb(hex).map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(fg);
  const l2 = lum(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
