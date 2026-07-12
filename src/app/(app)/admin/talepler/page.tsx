// Talep kuyruğu — durum filtreli (linkli çipler) liste.

import Link from "next/link";
import { Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth-helpers";
import { listTicketsAdmin } from "@/lib/support/admin-queries";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const CATEGORY_TR: Record<string, string> = {
  ACCOUNT: "Hesap",
  TRANSACTIONS: "İşlemler",
  IMPORT: "Banka Dökümü",
  FINDEKS: "Findeks",
  DEBTS: "Borçlar",
  SECURITY: "Güvenlik",
  BUG: "Hata",
  OTHER: "Diğer",
};

const STATUS_TR: Record<string, string> = {
  OPEN: "Açık",
  IN_PROGRESS: "İlgileniliyor",
  WAITING_USER: "Yanıt bekleniyor",
  RESOLVED: "Çözüldü",
  CLOSED: "Kapalı",
};

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-primary-soft text-primary",
  IN_PROGRESS: "bg-[var(--app-violet-soft)] text-[var(--app-violet)]",
  WAITING_USER: "bg-warning/10 text-warning",
  RESOLVED: "bg-accent-soft text-accent",
  CLOSED: "bg-surface-2 text-muted",
};

// undefined → aktifler (varsayılan; admin-queries böyle davranır)
const FILTERS: { value?: string; label: string }[] = [
  { label: "Aktifler" },
  { value: "OPEN", label: "Açık" },
  { value: "WAITING_USER", label: "Yanıt bekleniyor" },
  { value: "RESOLVED", label: "Çözüldü" },
  { value: "CLOSED", label: "Kapalı" },
  { value: "ALL", label: "Tümü" },
];

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = FILTERS.some((f) => f.value === sp.status)
    ? sp.status
    : undefined;

  const tickets = await listTicketsAdmin({ status });

  return (
    <div>
      <PageHeader
        kicker="Admin"
        title="Talepler"
        description="Destek taleplerini durumlarına göre filtrele ve yanıtla."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = status === f.value;
          return (
            <Link
              key={f.label}
              href={f.value ? `/admin/talepler?status=${f.value}` : "/admin/talepler"}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "border border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<Inbox size={26} />}
          title="Talep bulunamadı"
          description="Bu filtreye uyan destek talebi yok."
        />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/admin/talepler/${t.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-4 transition-colors hover:bg-surface-2"
            >
              <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-muted">
                #{t.shortId}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {t.subject}
                </p>
                <p className="truncate text-xs text-muted">
                  {t.customerName} · {t.customerEmail}
                </p>
              </div>
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-muted">
                {CATEGORY_TR[t.category] ?? t.category}
              </span>
              {t.lastMessageAuthor === "USER" && (
                <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning">
                  müşteri bekliyor
                </span>
              )}
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  STATUS_STYLE[t.status] ?? "bg-surface-2 text-muted",
                )}
              >
                {STATUS_TR[t.status] ?? t.status}
              </span>
              <span className="text-xs tabular-nums text-muted">
                {formatDateShort(t.lastMessageAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
