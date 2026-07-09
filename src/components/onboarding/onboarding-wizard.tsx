"use client";

import { useState, useTransition } from "react";
import { Sparkles, Rocket, Loader2 } from "lucide-react";
import { DEFAULT_THEME, type ThemeMode } from "@/lib/theme";
import { completeOnboarding } from "@/lib/actions/theme";
import { PresetPicker } from "@/components/theme/preset-picker";
import { Button } from "@/components/ui/button";

// Tek ekran: karşılama + görünüm (mod + palet). Diğer tüm özelleştirme kaldırıldı
// (yazı tipi/köşe/gölge/serbest renk); tutarlılık için sistem varsayılanı sabit.
export function OnboardingWizard({ userName }: { userName: string }) {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_THEME.mode);
  const [presetName, setPresetName] = useState<string>(DEFAULT_THEME.presetName);
  const [pending, startTransition] = useTransition();

  function finish() {
    startTransition(async () => {
      await completeOnboarding({ mode, presetName });
    });
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-10">
      <div className="mb-5 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles size={13} />
          FinOptima
        </span>
        <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
          Hoş geldin, {userName}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Görünümünü seç — istediğin zaman Ayarlar&apos;dan değiştirebilirsin.
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <PresetPicker
          mode={mode}
          presetName={presetName}
          onChange={(n) => {
            setMode(n.mode);
            setPresetName(n.presetName);
          }}
        />
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={finish}
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Hazırlanıyor…
            </>
          ) : (
            <>
              <Rocket size={18} />
              Başla
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
