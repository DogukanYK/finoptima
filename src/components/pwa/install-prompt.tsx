"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { BrandMark } from "@/components/brand";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "akca-install-dismissed";

// Android/masaüstü Chrome'da "ana ekrana ekle" çağrısı gösterir.
// iOS'ta beforeinstallprompt yoktur; orada kullanıcı Paylaş menüsünden ekler.
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    // Zaten yüklüyse gösterme.
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* yoksay */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 px-4 lg:bottom-4">
      <div className="card mx-auto flex max-w-md items-center gap-3 p-3.5 shadow-[var(--app-shadow-lg)]">
        <BrandMark size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            FinOptima'yı ana ekranına ekle
          </p>
          <p className="text-xs text-muted">
            Uygulama gibi tam ekran, tek dokunuşla açılır.
          </p>
        </div>
        <button
          onClick={install}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[calc(var(--app-radius)*0.6)] bg-primary px-3 text-sm font-medium text-white"
        >
          <Download size={15} />
          Ekle
        </button>
        <button
          onClick={dismiss}
          aria-label="Kapat"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
