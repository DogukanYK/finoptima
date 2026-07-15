"use client";

// Admin alt nav — settings sekmeleriyle aynı dil (border-b-2 aktif vurgu),
// ama tab yerine gerçek route'lar: pathname'e göre aktiflik.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, Users, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/admin/talepler", label: "Talepler", icon: Inbox },
  { href: "/admin/musteriler", label: "Müşteriler", icon: Users },
  { href: "/admin/makrolar", label: "Makrolar", icon: MessageSquareText },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {LINKS.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-ink",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-lg transition-colors",
                active ? "bg-primary-soft text-primary" : "text-muted",
              )}
            >
              <l.icon size={15} />
            </span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
