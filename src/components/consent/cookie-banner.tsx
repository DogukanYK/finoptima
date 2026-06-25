"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "akca-cookie-consent";

// KVKK bilgilendirmesi — FinOptima yalnız oturum için zorunlu çerez kullanır.
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      /* localStorage erişilemezse banner'ı gösterme */
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    } catch {
      /* yoksay */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="card mx-auto flex max-w-2xl flex-col gap-3 p-4 shadow-[var(--app-shadow-lg)] sm:flex-row sm:items-center">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Cookie size={18} />
        </span>
        <p className="flex-1 text-sm text-muted">
          FinOptima yalnızca oturumunu açık tutmak için{" "}
          <strong className="text-ink">zorunlu çerezler</strong> kullanır —
          reklam ya da üçüncü taraf takip çerezi yoktur.{" "}
          <Link href="/gizlilik" className="font-medium text-primary hover:underline">
            Gizlilik metni
          </Link>
        </p>
        <button
          onClick={accept}
          className="h-10 shrink-0 rounded-[calc(var(--app-radius)*0.7)] bg-primary px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Kabul et
        </button>
      </div>
    </div>
  );
}
