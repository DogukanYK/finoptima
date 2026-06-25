"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  Palette,
  Type,
  SquareDashed,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { DEFAULT_THEME, THEME_PRESETS, type ThemeSettings } from "@/lib/theme";
import { HEADING_FONTS, BODY_FONTS } from "@/lib/fonts";
import { completeOnboarding } from "@/lib/actions/theme";
import { ThemePreview } from "@/components/theme/theme-preview";
import { ColorInput } from "@/components/ui/color-input";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Hoş geldin", icon: Sparkles },
  { title: "Tema", icon: Palette },
  { title: "Renkler", icon: Palette },
  { title: "Yazı tipi", icon: Type },
  { title: "Biçim", icon: SquareDashed },
  { title: "Hazır", icon: Check },
];

export function OnboardingWizard({ userName }: { userName: string }) {
  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [pending, startTransition] = useTransition();

  const set = (patch: Partial<ThemeSettings>) =>
    setTheme((t) => ({ ...t, ...patch }));

  const isDark = theme.mode === "DARK";
  const last = STEPS.length - 1;

  function finish() {
    startTransition(async () => {
      await completeOnboarding(theme);
    });
  }

  return (
    <div className="mx-auto grid min-h-dvh max-w-5xl gap-8 px-5 py-8 lg:grid-cols-[1fr_360px] lg:py-12">
      {/* Sol: adımlar */}
      <div className="flex flex-col">
        {/* İlerleme */}
        <div className="mb-8 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-line",
              )}
            />
          ))}
        </div>

        <div className="flex-1">
          {step === 0 && (
            <Section
              eyebrow="Başlayalım"
              title={`Merhaba ${userName}, FinOptima'ya hoş geldin`}
              desc="FinOptima tamamen senin. Renkler, yazı tipleri ve biçim — her ayrıntıyı kendine göre ayarlayabilirsin. Birkaç adımda görünümünü kuralım; istediğin an Ayarlar'dan değiştirebilirsin."
            >
              <ul className="mt-2 space-y-2.5 text-sm text-muted">
                {[
                  "Hazır temalardan başla, sonra ince ayar yap",
                  "Açık / koyu / sistem modu",
                  "Yazı tipi, köşe yumuşaklığı, yoğunluk ve fazlası",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <Check size={16} className="text-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {step === 1 && (
            <Section
              eyebrow="Adım 1"
              title="Mod ve hazır tema"
              desc="Bir başlangıç noktası seç — sonraki adımlarda dilediğin gibi değiştireceksin."
            >
              <div className="mb-5">
                <p className="mb-2 text-sm font-medium text-ink">Görünüm modu</p>
                <ChipGroup
                  value={theme.mode}
                  options={[
                    { value: "LIGHT", label: "Açık" },
                    { value: "DARK", label: "Koyu" },
                    { value: "SYSTEM", label: "Sistem" },
                  ]}
                  onChange={(v) => set({ mode: v as ThemeSettings["mode"] })}
                />
              </div>
              <p className="mb-2 text-sm font-medium text-ink">Hazır tema</p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {THEME_PRESETS.map((preset) => {
                  const active = theme.presetName === preset.name;
                  const swatch = preset.values.primaryColor ?? "#1E40AF";
                  return (
                    <button
                      key={preset.name}
                      onClick={() =>
                        set({ ...preset.values, presetName: preset.name })
                      }
                      className={cn(
                        "rounded-[var(--app-radius)] border p-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary-soft"
                          : "border-line bg-surface hover:bg-surface-2",
                      )}
                    >
                      <div className="mb-2 flex gap-1">
                        <span
                          className="h-6 w-6 rounded-full"
                          style={{ background: swatch }}
                        />
                        <span
                          className="h-6 w-6 rounded-full"
                          style={{
                            background:
                              preset.values.accentColor ?? "#059669",
                          }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-ink">
                        {preset.name}
                      </p>
                      <p className="text-xs text-muted">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          {step === 2 && (
            <Section
              eyebrow="Adım 2"
              title="Renkler"
              desc="Ana renkleri kendine göre ayarla. Her renk anında önizlemeye yansır."
            >
              <div className="space-y-3.5">
                <ColorInput
                  label="Birincil renk"
                  description="Butonlar, vurgular, aktif öğeler"
                  value={theme.primaryColor}
                  onChange={(v) => set({ primaryColor: v })}
                />
                <ColorInput
                  label="Vurgu rengi"
                  description="Gelir ve olumlu değerler"
                  value={theme.accentColor}
                  onChange={(v) => set({ accentColor: v })}
                />
                <ColorInput
                  label="Gider rengi"
                  description="Harcamalar ve uyarılar"
                  value={theme.destructiveColor}
                  onChange={(v) => set({ destructiveColor: v })}
                />
                {isDark ? (
                  <>
                    <ColorInput
                      label="Arka plan (koyu)"
                      value={theme.darkBackgroundColor}
                      onChange={(v) => set({ darkBackgroundColor: v })}
                    />
                    <ColorInput
                      label="Yüzey / kart (koyu)"
                      value={theme.darkSurfaceColor}
                      onChange={(v) => set({ darkSurfaceColor: v })}
                    />
                  </>
                ) : (
                  <>
                    <ColorInput
                      label="Arka plan"
                      value={theme.backgroundColor}
                      onChange={(v) => set({ backgroundColor: v })}
                    />
                    <ColorInput
                      label="Yüzey / kart"
                      value={theme.surfaceColor}
                      onChange={(v) => set({ surfaceColor: v })}
                    />
                  </>
                )}
              </div>
            </Section>
          )}

          {step === 3 && (
            <Section
              eyebrow="Adım 3"
              title="Yazı tipi"
              desc="Başlık ve metin için yazı tipini ve boyutunu seç."
            >
              <div className="space-y-4">
                <FontSelect
                  label="Başlık yazı tipi"
                  value={theme.headingFont}
                  options={[...HEADING_FONTS]}
                  onChange={(v) => set({ headingFont: v })}
                />
                <FontSelect
                  label="Metin yazı tipi"
                  value={theme.bodyFont}
                  options={[...BODY_FONTS]}
                  onChange={(v) => set({ bodyFont: v })}
                />
                <SliderRow
                  label="Temel yazı boyutu"
                  value={theme.baseFontSize}
                  min={14}
                  max={19}
                  step={1}
                  suffix="px"
                  onChange={(v) => set({ baseFontSize: v })}
                />
                <div>
                  <p className="mb-2 text-sm font-medium text-ink">
                    Başlık kalınlığı
                  </p>
                  <ChipGroup
                    value={String(theme.fontWeightHeading)}
                    options={[
                      { value: "500", label: "Orta" },
                      { value: "600", label: "Yarı kalın" },
                      { value: "700", label: "Kalın" },
                      { value: "800", label: "Çok kalın" },
                    ]}
                    onChange={(v) => set({ fontWeightHeading: Number(v) })}
                  />
                </div>
              </div>
            </Section>
          )}

          {step === 4 && (
            <Section
              eyebrow="Adım 4"
              title="Biçim ve his"
              desc="Köşe yumuşaklığı, gölge ve arayüz yoğunluğu."
            >
              <div className="space-y-4">
                <SliderRow
                  label="Köşe yuvarlaklığı"
                  value={theme.borderRadius}
                  min={0}
                  max={24}
                  step={2}
                  suffix="px"
                  onChange={(v) => set({ borderRadius: v })}
                />
                <div>
                  <p className="mb-2 text-sm font-medium text-ink">
                    Gölge yoğunluğu
                  </p>
                  <ChipGroup
                    value={theme.shadowIntensity}
                    options={[
                      { value: "none", label: "Yok" },
                      { value: "soft", label: "Hafif" },
                      { value: "medium", label: "Orta" },
                      { value: "strong", label: "Belirgin" },
                    ]}
                    onChange={(v) => set({ shadowIntensity: v })}
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-ink">
                    Arayüz yoğunluğu
                  </p>
                  <ChipGroup
                    value={theme.density}
                    options={[
                      { value: "compact", label: "Kompakt" },
                      { value: "comfortable", label: "Rahat" },
                      { value: "spacious", label: "Ferah" },
                    ]}
                    onChange={(v) => set({ density: v })}
                  />
                </div>
              </div>
            </Section>
          )}

          {step === 5 && (
            <Section
              eyebrow="Tamamlandı"
              title="Harika görünüyor!"
              desc="Görünümün hazır. İstediğin an Ayarlar bölümünden en küçük ayrıntısına kadar değiştirebilirsin. Şimdi FinOptima'yı kullanmaya başlayabilirsin."
            >
              <div className="rounded-[var(--app-radius)] border border-line bg-surface-2 p-4 text-sm text-muted">
                Sıradaki: ilk harcamanı ekle, hesaplarını tanımla ve panelinde
                özetini gör.
              </div>
            </Section>
          )}
        </div>

        {/* Gezinme */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || pending}
            className="inline-flex items-center gap-1.5 rounded-[calc(var(--app-radius)*0.7)] px-3 py-2 text-sm font-medium text-muted disabled:opacity-0"
          >
            <ArrowLeft size={16} />
            Geri
          </button>

          {step < last ? (
            <button
              onClick={() => setStep((s) => Math.min(last, s + 1))}
              className="inline-flex items-center gap-2 rounded-[calc(var(--app-radius)*0.75)] bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
            >
              {step === 0 ? "Kişiselleştir" : "Devam"}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-[calc(var(--app-radius)*0.75)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95 disabled:opacity-60"
            >
              {pending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              FinOptima'yı aç
            </button>
          )}
        </div>
      </div>

      {/* Sağ: canlı önizleme */}
      <aside className="lg:sticky lg:top-12 lg:self-start">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Canlı önizleme
        </p>
        <ThemePreview theme={theme} />
      </aside>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  desc,
  children,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {eyebrow}
      </p>
      <h1 className="mt-1.5 font-heading text-2xl font-extrabold text-ink sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function ChipGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
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

function FontSelect({
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

function SliderRow({
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
