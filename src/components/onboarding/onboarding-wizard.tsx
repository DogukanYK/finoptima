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
  Rocket,
} from "lucide-react";
import { DEFAULT_THEME, THEME_PRESETS, type ThemeSettings } from "@/lib/theme";
import { HEADING_FONTS, BODY_FONTS } from "@/lib/fonts";
import { completeOnboarding } from "@/lib/actions/theme";
import { ThemePreview } from "@/components/theme/theme-preview";
import { ColorInput } from "@/components/ui/color-input";
import { Button } from "@/components/ui/button";
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
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Sparkles size={13} />
            FinOptima kurulumu
          </span>
          <span className="text-xs font-semibold tabular-nums text-muted">
            {step + 1} / {STEPS.length}
          </span>
        </div>
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

        <div className="card flex-1 p-5 sm:p-6">
          {step === 0 && (
            <Section
              eyebrow="Başlayalım"
              title={`Merhaba ${userName}, FinOptima'ya hoş geldin`}
              desc="FinOptima tamamen senin. Renkler, yazı tipleri ve biçim — her ayrıntıyı kendine göre ayarlayabilirsin. Birkaç adımda görünümünü kuralım; istediğin an Ayarlar'dan değiştirebilirsin."
            >
              <ul className="mt-2 space-y-2.5 text-sm text-ink">
                {[
                  "Hazır temalardan başla, sonra ince ayar yap",
                  "Açık / koyu / sistem modu",
                  "Yazı tipi, köşe yumuşaklığı, yoğunluk ve fazlası",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <Check size={15} />
                    </span>
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
                        "card-hover rounded-[var(--app-radius)] border p-3 text-left transition-colors",
                        active
                          ? "border-primary bg-primary-soft"
                          : "border-line bg-surface hover:bg-surface-2",
                      )}
                    >
                      <div className="mb-2 flex gap-1">
                        <span
                          className="h-6 w-6 rounded-full ring-2 ring-white"
                          style={{ background: swatch }}
                        />
                        <span
                          className="-ml-2 h-6 w-6 rounded-full ring-2 ring-white"
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
              <div className="card-dark relative overflow-hidden p-5">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(37,99,235,0.45) 0%, rgba(37,99,235,0) 70%)",
                  }}
                />
                <div className="relative flex items-start gap-3.5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{
                      background: "linear-gradient(120deg,#2563EB,#0EA5E9)",
                    }}
                  >
                    <Rocket size={20} />
                  </span>
                  <div>
                    <p className="font-heading text-sm font-bold tracking-tight text-white">
                      Sıradaki adımlar
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-300">
                      Sıradaki: ilk harcamanı ekle, hesaplarını tanımla ve
                      panelinde özetini gör.
                    </p>
                  </div>
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Gezinme */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            size="md"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || pending}
            className="text-muted disabled:opacity-0"
          >
            <ArrowLeft size={16} />
            Geri
          </Button>

          {step < last ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setStep((s) => Math.min(last, s + 1))}
            >
              {step === 0 ? "Kişiselleştir" : "Devam"}
              <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              variant="accent"
              size="md"
              onClick={finish}
              disabled={pending}
            >
              {pending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Check size={16} />
              )}
              FinOptima'yı aç
            </Button>
          )}
        </div>
      </div>

      {/* Sağ: canlı önizleme */}
      <aside className="lg:sticky lg:top-12 lg:self-start">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
          <Sparkles size={13} />
          Canlı önizleme
        </span>
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
