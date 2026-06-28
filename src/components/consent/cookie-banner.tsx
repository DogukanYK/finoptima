"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="card card-lg mx-auto flex max-w-2xl flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <Cookie size={20} />
        </span>
        <div className="flex-1 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
            <ShieldCheck size={13} />
            KVKK uyumlu
          </span>
          <p className="text-sm leading-relaxed text-muted">
            FinOptima yalnızca oturumunu açık tutmak için{" "}
            <strong className="font-semibold text-ink">zorunlu çerezler</strong>{" "}
            kullanır — reklam ya da üçüncü taraf takip çerezi yoktur.{" "}
            <Link
              href="/gizlilik"
              className="font-medium text-primary hover:underline"
            >
              Gizlilik metni
            </Link>
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={accept}
          className="shrink-0"
        >
          Kabul et
        </Button>
      </div>
    </div>
  );
}
