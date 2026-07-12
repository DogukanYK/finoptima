// Müşteri listesi — arama (GET form) + son üyeler.

import Link from "next/link";
import { Search, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth-helpers";
import { listCustomers } from "@/lib/support/admin-queries";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const ROLE_TR: Record<string, string> = {
  ADMIN: "Yönetici",
  USER: "Üye",
};

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  const customers = await listCustomers(user.id, q || undefined);

  return (
    <div>
      <PageHeader
        kicker="Admin"
        title="Müşteriler"
        description="Üyeleri ara ve maskeli 360° profillerini görüntüle."
      />

      <form method="GET" className="mb-5 flex max-w-md gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Ad veya e-posta ara…"
            className={cn(inputClass, "pl-10")}
          />
        </div>
        <Button type="submit" variant="outline">
          Ara
        </Button>
      </form>

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users size={26} />}
          title="Müşteri bulunamadı"
          description={
            q
              ? `“${q}” aramasına uyan üye yok.`
              : "Henüz kayıtlı üye bulunmuyor."
          }
        />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/admin/musteriler/${c.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4 transition-colors hover:bg-surface-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {c.name}
                </p>
                <p className="truncate text-xs text-muted">{c.email}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  c.role === "ADMIN"
                    ? "bg-primary-soft text-primary"
                    : "bg-surface-2 text-muted",
                )}
              >
                {ROLE_TR[c.role] ?? c.role}
              </span>
              <span className="text-xs tabular-nums text-muted">
                Üyelik: {formatDateShort(c.createdAt)}
              </span>
              <span className="text-xs font-medium tabular-nums text-ink">
                {c.ticketCount} talep
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
