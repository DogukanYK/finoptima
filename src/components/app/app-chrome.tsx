"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Search, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/command/command-palette";
import { AssistantPanel } from "@/components/assistant/assistant-panel";

type ChromeCtx = {
  openPalette: () => void;
  openChat: (seed?: string) => void;
};

const Ctx = createContext<ChromeCtx | null>(null);

export function useAppChrome(): ChromeCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAppChrome, AppChromeProvider içinde kullanılmalı");
  return c;
}

// Uygulama kabuğunu saran istemci sağlayıcı: ⌘K komut paletini ve AI asistan
// panelini bir kez mount eder, global ⌘K kısayolunu dinler ve tetikleyici
// butonlara (SearchTrigger / AiTrigger) açma fonksiyonlarını verir.
export function AppChromeProvider({ children }: { children: React.ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [seed, setSeed] = useState<string | undefined>();

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openChat = useCallback((s?: string) => {
    setSeed(s);
    setChatOpen(true);
    setPaletteOpen(false);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <Ctx.Provider value={{ openPalette, openChat }}>
      {children}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAskAI={(q) => openChat(q)}
      />
      <AssistantPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        seed={seed}
        onSeedConsumed={() => setSeed(undefined)}
      />
    </Ctx.Provider>
  );
}

// Arama çubuğu görünümlü tetikleyici — komut paletini açar.
export function SearchTrigger({ className }: { className?: string }) {
  const { openPalette } = useAppChrome();
  return (
    <button
      type="button"
      onClick={openPalette}
      className={cn(
        "group flex h-9 items-center gap-2 rounded-full border border-line bg-surface-2 px-3.5 text-sm text-muted transition-colors hover:border-primary/40 hover:text-ink",
        className,
      )}
    >
      <Search size={16} className="shrink-0" />
      <span className="truncate">Ara ya da asistana sor…</span>
      <kbd className="ml-auto hidden shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}

// AI asistan panelini açan gradyan buton.
export function AiTrigger({
  className,
  iconOnly,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const { openChat } = useAppChrome();
  return (
    <button
      type="button"
      onClick={() => openChat()}
      aria-label="AI Asistan"
      className={cn(
        "flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white transition-[filter] hover:brightness-105",
        className,
      )}
      style={{
        background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))",
      }}
    >
      <Sparkles size={16} className="shrink-0" />
      {!iconOnly && <span className="hidden sm:inline">Asistan</span>}
    </button>
  );
}
