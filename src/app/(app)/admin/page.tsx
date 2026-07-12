// Admin destek panosu — KPI kartları + son aktif talepler.

import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  getAdminKpis,
  listTicketsAdmin,
} from "@/lib/support/admin-queries";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

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

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [kpis, tickets] = await Promise.all([
    getAdminKpis(),
    listTicketsAdmin(),
  ]);
  const recent = tickets.slice(0, 10);

  return (
    <div>
      <PageHeader
        kicker="Admin"
        title="Destek Panosu"
        description="Talep kuyruğunun genel görünümü ve son hareketler."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          kicker="Açık Talepler"
          value={String(kpis.open)}
          hue="primary"
          sub="Açık · İlgileniliyor · Bekliyor"
        />
        <StatCard
          kicker="İlk Yanıt Bekleyen"
          value={String(kpis.waitingFirstReply)}
          hue="destructive"
          sub="Henüz temsilci yanıtı yok"
        />
        <StatCard
          kicker="Bugün Çözülen"
          value={String(kpis.resolvedToday)}
          hue="accent"
        />
        <StatCard
          kicker="AI'dan Gelen"
          value={String(kpis.aiEscalated)}
          hue="violet"
          sub="AI sohbetinden aktarılan"
        />
        <StatCard kicker="Toplam" value={String(kpis.total)} hue="primary" />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-ink">
          Son Talepler
        </h2>
        <Link
          href="/admin/talepler"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80"
        >
          Tümünü gör
          <ArrowRight size={15} />
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState
          icon={<Inbox size={26} />}
          title="Aktif talep yok"
          description="Şu anda bekleyen destek talebi bulunmuyor."
        />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {recent.map((t) => (
            <Link
              key={t.id}
              href={`/admin/talepler/${t.id}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 transition-colors hover:bg-surface-2"
            >
              <span className="w-12 shrink-0 text-sm font-semibold tabular-nums text-muted">
                #{t.shortId}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {t.subject}
                </p>
                <p className="truncate text-xs text-muted">{t.customerName}</p>
              </div>
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
