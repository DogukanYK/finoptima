// Müşteri 360° — Tier 1 (HEP maskeli): kimlik, sayımlar, son aktivite,
// audit olayları ve talep geçmişi. Tier 2 (finansal detay) burada YOK —
// yalnız talep sayfasında, ticket-scoped consent ile gösterilir.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, ShieldOff, Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth-helpers";
import { getCustomer360Tier1 } from "@/lib/support/admin-queries";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const ROLE_TR: Record<string, string> = {
  ADMIN: "Yönetici",
  USER: "Üye",
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

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  const customer = await getCustomer360Tier1(user.id, id);
  if (!customer) notFound();

  const counts: { label: string; value: number }[] = [
    { label: "İşlem", value: customer.counts.transactions },
    { label: "Kategori", value: customer.counts.categories },
    { label: "Hesap", value: customer.counts.accounts },
    { label: "Borç", value: customer.counts.debts },
    { label: "Findeks Raporu", value: customer.counts.findeksReports },
    { label: "Döküm İçe Aktarımı", value: customer.counts.statementImports },
  ];

  return (
    <div>
      <PageHeader
        kicker="Müşteri 360°"
        title={customer.name}
        description="Maskeli profil görünümü — finansal detaylar izne tabidir."
      />

      {/* Kimlik kartı */}
      <div className="card mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 p-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{customer.email}</p>
          <p className="text-xs text-muted">
            Üyelik: {formatDate(customer.createdAt)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            customer.role === "ADMIN"
              ? "bg-primary-soft text-primary"
              : "bg-surface-2 text-muted",
          )}
        >
          {ROLE_TR[customer.role] ?? customer.role}
        </span>
        {customer.twoFactorEnabled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
            <ShieldCheck size={13} />
            2FA aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
            <ShieldOff size={13} />
            2FA kapalı
          </span>
        )}
        {customer.lastActivityAt && (
          <span className="ml-auto text-xs tabular-nums text-muted">
            Son aktivite: {dateTime.format(new Date(customer.lastActivityAt))}
          </span>
        )}
      </div>

      {/* Sayımlar */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {counts.map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
              {c.label}
            </p>
            <p className="mt-1 font-heading text-xl font-extrabold tabular-nums text-ink">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Son audit olayları */}
        <div className="card p-5">
          <h2 className="mb-3 font-heading text-base font-bold text-ink">
            Son Olaylar
          </h2>
          {customer.recentAuditEvents.length === 0 ? (
            <p className="text-sm text-muted">Kayıtlı olay yok.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {customer.recentAuditEvents.map((e, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="min-w-0 truncate font-medium text-ink">
                    {e.action}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {dateTime.format(new Date(e.createdAt))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Talep geçmişi */}
        <div className="card p-5">
          <h2 className="mb-3 font-heading text-base font-bold text-ink">
            Talep Geçmişi
          </h2>
          {customer.tickets.length === 0 ? (
            <div className="flex items-center gap-2.5 text-sm text-muted">
              <Inbox size={16} />
              Henüz destek talebi yok.
            </div>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {customer.tickets.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/admin/talepler/${t.id}`}
                    className="flex items-center gap-3 py-2 transition-colors hover:bg-surface-2"
                  >
                    <span className="w-12 shrink-0 font-semibold tabular-nums text-muted">
                      #{t.shortId}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-ink">
                      {t.subject}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        STATUS_STYLE[t.status] ?? "bg-surface-2 text-muted",
                      )}
                    >
                      {STATUS_TR[t.status] ?? t.status}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-muted">
                      {formatDateShort(t.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* KVKK bilgi kutusu */}
      <div className="mt-6 flex items-start gap-3 rounded-[var(--app-radius)] border border-line bg-surface-2 p-4 text-sm text-muted">
        <ShieldCheck size={18} className="mt-0.5 shrink-0" />
        <p>
          Detaylı finansal veriler yalnız müşterinin aktif destek talebi
          üzerinden verdiği süreli izinle görüntülenebilir (KVKK).
        </p>
      </div>
    </div>
  );
}
