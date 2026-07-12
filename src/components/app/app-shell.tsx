"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  ArrowLeftRight,
  Plus,
  FileBarChart2,
  Gauge,
  Upload,
  ReceiptText,
  Settings,
  CreditCard,
  Target,
  UserRound,
  LogOut,
  MoreHorizontal,
  X,
  LifeBuoy,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  ADMIN_NAV,
  MOBILE_NAV,
  MOBILE_MORE,
  type NavItem,
} from "@/lib/nav";
import { Brand } from "@/components/brand";
import { logoutAction } from "@/lib/actions/auth";
import {
  AppChromeProvider,
  SearchTrigger,
  AiTrigger,
} from "@/components/app/app-chrome";

const NAV_ICONS: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "calendar-days": CalendarDays,
  "arrow-left-right": ArrowLeftRight,
  plus: Plus,
  "file-bar-chart-2": FileBarChart2,
  gauge: Gauge,
  upload: Upload,
  "receipt-text": ReceiptText,
  settings: Settings,
  "credit-card": CreditCard,
  target: Target,
  "user-round": UserRound,
  "life-buoy": LifeBuoy,
  shield: Shield,
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({
  user,
  isAdmin = false,
  children,
}: {
  user: { name: string; email: string };
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <AppChromeProvider>
    <div className="min-h-dvh bg-canvas">
      <a href="#main" className="sr-only skip-link">
        İçeriğe geç
      </a>

      {/* ===== Masaüstü kenar çubuğu ===== */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/75 backdrop-blur-2xl lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/dashboard" aria-label="Panel'e git">
            <Brand size={34} />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {PRIMARY_NAV.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
          <div className="my-3 border-t border-line" />
          {SECONDARY_NAV.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
          {isAdmin && (
            <>
              <div className="my-3 border-t border-line" />
              {ADMIN_NAV.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                />
              ))}
            </>
          )}
        </nav>
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-[calc(var(--app-radius)*0.7)] px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="mt-1 flex w-full items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-destructive"
            >
              <LogOut size={16} />
              Çıkış yap
            </button>
          </form>
        </div>
      </aside>

      {/* ===== İçerik ===== */}
      <div className="lg:pl-64">
        {/* Masaüstü üst bar — ortada arama çubuğu, sağda asistan */}
        <header className="sticky top-0 z-20 hidden h-16 items-center gap-3 border-b border-line bg-surface/70 px-6 backdrop-blur-xl lg:flex">
          <div className="flex-1" />
          <SearchTrigger className="w-full max-w-md" />
          <div className="flex flex-1 justify-end">
            <AiTrigger />
          </div>
        </header>

        {/* Mobil üst bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-surface/75 px-3 backdrop-blur-xl lg:hidden">
          <Link href="/dashboard" aria-label="Panel'e git" className="shrink-0">
            <Brand size={30} />
          </Link>
          <SearchTrigger className="min-w-0 flex-1" />
          <AiTrigger iconOnly className="shrink-0 !px-2.5" />
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="Menü"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[calc(var(--app-radius)*0.6)] text-ink hover:bg-surface-2"
          >
            <MoreHorizontal size={22} />
          </button>
        </header>

        <main
          id="main"
          className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10"
        >
          {children}
        </main>
      </div>

      {/* ===== Mobil alt gezinme ===== */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/75 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-center px-2 pb-[env(safe-area-inset-bottom)]">
          <BottomLink
            item={MOBILE_NAV[0]}
            active={isActive(pathname, MOBILE_NAV[0].href)}
          />
          <BottomLink
            item={MOBILE_NAV[1]}
            active={isActive(pathname, MOBILE_NAV[1].href)}
          />
          <div className="flex justify-center">
            <Link
              href="/add"
              aria-label="Harcama ekle"
              style={{
                background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))",
              }}
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[var(--app-shadow-lg)] transition-transform hover:brightness-105 active:scale-95"
            >
              <Plus size={26} />
            </Link>
          </div>
          <BottomLink
            item={MOBILE_NAV[2]}
            active={isActive(pathname, MOBILE_NAV[2].href)}
          />
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-[11px]",
              moreOpen ? "text-primary" : "text-muted",
            )}
          >
            <MoreHorizontal size={22} />
            Daha
          </button>
        </div>
      </nav>

      {/* ===== "Daha" alt sayfası ===== */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-[calc(var(--app-radius)*1.5)] border-t border-line bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-heading font-bold text-ink">Menü</p>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Kapat"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface-2"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[...MOBILE_MORE, ...(isAdmin ? ADMIN_NAV : [])].map((item) => {
                const Icon = NAV_ICONS[item.icon] ?? Settings;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-[var(--app-radius)] border border-line p-3 text-center text-xs font-medium",
                      isActive(pathname, item.href)
                        ? "bg-primary-soft text-primary"
                        : "bg-surface-2 text-ink",
                    )}
                  >
                    <Icon size={22} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <form action={logoutAction} className="mt-3">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-[var(--app-radius)] border border-line py-3 text-sm font-medium text-destructive"
              >
                <LogOut size={16} />
                Çıkış yap
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </AppChromeProvider>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = NAV_ICONS[item.icon] ?? Settings;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-[calc(var(--app-radius)*0.7)] px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary-soft text-primary"
          : "text-muted hover:bg-surface-2 hover:text-ink",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full"
          style={{ background: "linear-gradient(180deg, var(--app-primary), var(--app-accent))" }}
        />
      )}
      <Icon
        size={19}
        className={cn(
          "shrink-0 transition-colors",
          active ? "text-primary" : "text-muted group-hover:text-ink",
        )}
      />
      {item.label}
    </Link>
  );
}

function BottomLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = NAV_ICONS[item.icon] ?? Settings;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-12 items-center justify-center rounded-full transition-colors",
          active ? "bg-primary-soft" : "bg-transparent",
        )}
      >
        <Icon size={21} />
      </span>
      {item.label}
    </Link>
  );
}
