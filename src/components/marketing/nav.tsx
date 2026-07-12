"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand, CTAButton } from "@/components/marketing/kit";
import { SUBTLE, INK, LINE } from "@/components/marketing/theme";

const LINKS = [
  { href: "/nasil-calisir", label: "Nasıl çalışır" },
  { href: "/kredi-notu", label: "Kredi notu" },
  { href: "/ozellikler", label: "Özellikler" },
  { href: "/fiyatlandirma", label: "Fiyatlandırma" },
];

const MORE = [
  { href: "/guvenlik", label: "Güvenlik" },
  { href: "/sss", label: "SSS" },
  { href: "/hakkinda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8"
        style={{
          background: "rgba(248,250,252,0.8)",
          backdropFilter: "saturate(180%) blur(14px)",
          WebkitBackdropFilter: "saturate(180%) blur(14px)",
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <Link href="/" aria-label="FinOptima ana sayfa">
          <Brand />
        </Link>

        <nav className="hidden gap-7 text-sm font-medium lg:flex" style={{ color: SUBTLE }}>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="transition-colors hover:text-[#2563EB]">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="text-sm font-medium transition-colors hover:text-[#2563EB]" style={{ color: SUBTLE }}>
            Giriş yap
          </Link>
          <CTAButton href="/register" size="sm">
            Kayıt ol
          </CTAButton>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          className="flex h-10 w-10 items-center justify-center rounded-xl lg:hidden"
          style={{ color: INK, background: "rgba(15,23,42,0.05)" }}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobil menü */}
      {open && (
        <div
          className="lg:hidden"
          style={{ background: "rgba(248,250,252,0.98)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${LINE}` }}
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4 sm:px-8">
            {[...LINKS, ...MORE].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors hover:bg-[rgba(15,23,42,0.04)]"
                style={{ color: INK }}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-3 border-t pt-4" style={{ borderColor: LINE }}>
              <CTAButton href="/login" variant="outline" size="sm" className="flex-1">
                Giriş yap
              </CTAButton>
              <CTAButton href="/register" size="sm" className="flex-1">
                Kayıt ol
              </CTAButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
