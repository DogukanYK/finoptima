"use client";

// Küçük açılır menü — hazır yanıt makrolarını listeler; seçilince onSelect(body) çağırır.
// admin-reply-box içinde yanıt textarea'sının üstünde kullanılır.

import { useEffect, useRef, useState } from "react";
import { MessageSquareText, ChevronDown } from "lucide-react";
import type { MacroPlain } from "@/lib/support/macros";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MacroPicker({
  macros,
  onSelect,
  disabled,
}: {
  macros: MacroPlain[];
  onSelect: (body: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (macros.length === 0) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MessageSquareText size={15} />
        Hazır yanıt ekle
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-20 mt-1.5 max-h-80 w-72 overflow-y-auto rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface p-1 shadow-[var(--app-shadow)]"
        >
          {macros.map((m) => (
            <button
              key={m.id}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelect(m.body);
                setOpen(false);
              }}
              className="flex w-full flex-col items-start gap-0.5 rounded-[calc(var(--app-radius)*0.55)] px-3 py-2 text-left transition-colors hover:bg-surface-2"
            >
              <span className="text-sm font-medium text-ink">{m.title}</span>
              <span className="line-clamp-1 text-xs text-muted">{m.body}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
