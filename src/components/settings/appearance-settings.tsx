"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import type { ThemeMode } from "@/lib/theme";
import { updateThemeAction } from "@/lib/actions/theme";
import { PresetPicker } from "@/components/theme/preset-picker";
import { Button } from "@/components/ui/button";

export function AppearanceSettings({
  initialMode,
  initialPreset,
}: {
  initialMode: ThemeMode;
  initialPreset: string;
}) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [presetName, setPresetName] = useState(initialPreset);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(false);
    startTransition(async () => {
      const r = await updateThemeAction({ mode, presetName });
      if (r.ok) setSaved(true);
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="card p-5 sm:p-6">
        <h3 className="font-heading text-base font-bold text-ink">Görünüm</h3>
        <p className="mt-0.5 text-sm text-muted">
          Mod ve renk paletini seç — tüm uygulamaya uygulanır. Yazı tipleri ve
          düzen tutarlılık için sabittir.
        </p>
        <div className="mt-5">
          <PresetPicker
            mode={mode}
            presetName={presetName}
            onChange={(n) => {
              setMode(n.mode);
              setPresetName(n.presetName);
              setSaved(false);
            }}
          />
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button onClick={save} disabled={pending} size="md">
            {pending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Kaydediliyor…
              </>
            ) : (
              "Kaydet"
            )}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
              <Check size={15} />
              Kaydedildi
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
