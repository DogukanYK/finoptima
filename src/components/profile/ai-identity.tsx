"use client";

import { useState, useTransition } from "react";
import { Sparkles, Pencil, CheckCircle2, Loader2 } from "lucide-react";
import { updateAiIdentity } from "@/lib/actions/profile";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/ui/button";

const textareaClass =
  "w-full rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface p-3.5 text-ink outline-none transition-colors focus-visible:border-[var(--app-primary)] focus-visible:ring-2 focus-visible:ring-[var(--app-primary-soft)]";

export function AiIdentity({ initialText }: { initialText: string | null }) {
  const [text, setText] = useState(initialText ?? "");
  const [draft, setDraft] = useState(initialText ?? "");
  const [editing, setEditing] = useState(!initialText);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function save() {
    setError(undefined);
    setSaved(false);
    startTransition(async () => {
      const res = await updateAiIdentity(draft);
      if (res.ok) {
        setText(draft);
        setEditing(false);
        setSaved(true);
      } else {
        setError(res.error ?? "Kaydedilemedi.");
      }
    });
  }

  return (
    <SectionCard
      title="AI Profil Tanımı"
      subtitle="AI önerilerini kişiselleştirmek için kendinden veya işinden bahset."
    >
      {!editing && text ? (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-[calc(var(--app-radius)*0.7)] bg-primary-soft p-3.5 text-sm text-ink">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))" }}
            >
              <Sparkles size={17} />
            </span>
            <p className="whitespace-pre-wrap pt-1">{text}</p>
          </div>
          {saved && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
              <CheckCircle2 size={14} /> AI profil tanımın kaydedildi.
            </span>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft(text);
              setEditing(true);
              setSaved(false);
            }}
          >
            <Pencil size={15} /> Düzenle
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            rows={4}
            className={textareaClass}
            placeholder="AI'a kendinden veya şirketinden bahset…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={save} disabled={pending}>
              {pending && <Loader2 size={15} className="animate-spin" />}
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
            {text && (
              <button
                type="button"
                onClick={() => {
                  setDraft(text);
                  setEditing(false);
                  setError(undefined);
                }}
                className="px-3 text-sm font-medium text-muted hover:text-ink"
              >
                Vazgeç
              </button>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
