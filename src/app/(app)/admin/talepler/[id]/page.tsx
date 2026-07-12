// Talep detayı — sol: mesaj akışı + yanıt kutusu; sağ: müşteri, durum, KVKK
// izin durumu ve (yalnız aktif consent varsa) Tier 2 finansal paneller.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Lock, User as UserIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth-helpers";
import {
  getTicketAdmin,
  getCustomer360Tier2Panels,
} from "@/lib/support/admin-queries";
import { PageHeader } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { AdminReplyBox } from "@/components/admin/admin-reply-box";
import { StatusSelect } from "@/components/admin/status-select";
import { formatDate, formatDateShort, formatTL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const maxDuration = 60;

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

const CHANNEL_TR: Record<string, string> = {
  WEB: "Web",
  MOBILE: "Mobil",
  AI: "AI sohbeti",
};

const PRIORITY_TR: Record<string, string> = {
  LOW: "Düşük",
  NORMAL: "Normal",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  URGENT: "Acil",
};

const SCOPE_TR: Record<string, string> = {
  transactions: "İşlemler",
  debts: "Borçlar",
  findeks: "Findeks",
  dashboard: "Panel özeti",
};

const AUTHOR_TR: Record<string, string> = {
  USER: "Müşteri",
  AGENT: "Destek",
  AI: "AI Asistan",
  SYSTEM: "Sistem",
};

const dateTime = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;

  const ticket = await getTicketAdmin(user.id, id);
  if (!ticket) notFound();

  const tier2 = ticket.consent
    ? await getCustomer360Tier2Panels(user.id, ticket.customerId, ticket.consent)
    : null;

  return (
    <div>
      <PageHeader
        kicker={`Talep #${ticket.shortId}`}
        title={ticket.subject}
        description={`${CATEGORY_TR[ticket.category] ?? ticket.category} · ${
          CHANNEL_TR[ticket.channel] ?? ticket.channel
        } · ${formatDate(ticket.createdAt)}`}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ============ SOL: mesaj akışı ============ */}
        <div className="min-w-0">
          <div className="card space-y-3 p-5">
            {ticket.messages.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">
                Bu talepte henüz mesaj yok.
              </p>
            )}
            {ticket.messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-xl p-3.5",
                  m.internal
                    ? "border border-warning/25 bg-warning/10"
                    : m.author === "USER"
                      ? "bg-surface-2"
                      : m.author === "AGENT"
                        ? "bg-primary-soft"
                        : m.author === "AI"
                          ? "bg-[var(--app-violet-soft)]"
                          : "border border-line bg-surface",
                )}
              >
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      m.internal ? "text-warning" : "text-ink",
                    )}
                  >
                    {m.internal
                      ? "İç not"
                      : m.author === "USER"
                        ? ticket.customerName
                        : (AUTHOR_TR[m.author] ?? m.author)}
                  </span>
                  <span className="text-xs tabular-nums text-muted">
                    {dateTime.format(new Date(m.createdAt))}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink">{m.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <AdminReplyBox ticketId={ticket.id} />
          </div>
        </div>

        {/* ============ SAĞ: müşteri + durum + izin ============ */}
        <div className="space-y-4">
          {/* Müşteri kartı */}
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <UserIcon size={18} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {ticket.customerName}
                </p>
                <p className="truncate text-xs text-muted">
                  {ticket.customerEmail}
                </p>
              </div>
            </div>
            <LinkButton
              href={`/admin/musteriler/${ticket.customerId}`}
              variant="outline"
              size="sm"
              className="mt-4 w-full"
            >
              Müşteri 360° profilini aç
            </LinkButton>
          </div>

          {/* Durum kartı */}
          <div className="card p-5">
            <StatusSelect ticketId={ticket.id} status={ticket.status} />
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Öncelik</dt>
                <dd className="font-medium text-ink">
                  {PRIORITY_TR[ticket.priority] ?? ticket.priority}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Kanal</dt>
                <dd className="font-medium text-ink">
                  {CHANNEL_TR[ticket.channel] ?? ticket.channel}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Son mesaj</dt>
                <dd className="font-medium tabular-nums text-ink">
                  {formatDateShort(ticket.lastMessageAt)}
                </dd>
              </div>
            </dl>
          </div>

          {/* İzin (consent) + Tier 2 */}
          {ticket.consent && tier2 ? (
            <div className="card p-5">
              <div className="flex items-start gap-2.5 rounded-xl bg-accent-soft p-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-accent" />
                <div className="text-sm">
                  <p className="font-semibold text-accent">İzin aktif</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Kapsam:{" "}
                    {ticket.consent.scopes
                      .map((s) => SCOPE_TR[s] ?? s)
                      .join(", ")}
                  </p>
                  <p className="text-xs text-muted">
                    Bitiş: {dateTime.format(new Date(ticket.consent.expiresAt))}
                  </p>
                </div>
              </div>

              {tier2.dashboard && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                    Panel Özeti
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["Bakiye", tier2.dashboard.balance],
                        ["Gelir", tier2.dashboard.income],
                        ["Gider", tier2.dashboard.expense],
                        ["Net", tier2.dashboard.net],
                      ] as const
                    ).map(([label, v]) => (
                      <div
                        key={label}
                        className="rounded-xl bg-surface-2 px-3 py-2"
                      >
                        <p className="text-[11px] text-muted">{label}</p>
                        <p className="text-sm font-semibold tabular-nums text-ink">
                          {formatTL(v)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tier2.transactions && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                    Son İşlemler
                  </p>
                  <ul className="divide-y divide-line text-sm">
                    {tier2.transactions.slice(0, 10).map((t, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 py-1.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-ink">{t.description}</p>
                          <p className="text-xs tabular-nums text-muted">
                            {formatDateShort(t.date)}
                            {t.category ? ` · ${t.category}` : ""}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            t.kind === "INCOME" ? "text-accent" : "text-ink",
                          )}
                        >
                          {formatTL(t.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tier2.debts && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                    Borçlar
                  </p>
                  <ul className="divide-y divide-line text-sm">
                    {tier2.debts.map((d, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 py-1.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-ink">{d.name}</p>
                          <p className="text-xs text-muted">
                            {d.kind} · %{d.apr}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                          {formatTL(d.balance)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {tier2.findeks && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                    Findeks
                  </p>
                  <div className="flex items-baseline justify-between rounded-xl bg-surface-2 px-3 py-2">
                    <span className="font-heading text-lg font-extrabold tabular-nums text-ink">
                      {tier2.findeks.score}
                    </span>
                    <span className="text-xs text-muted">
                      {tier2.findeks.band}
                      {tier2.findeks.reportDate
                        ? ` · ${formatDateShort(tier2.findeks.reportDate)}`
                        : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex items-start gap-2.5 p-5">
              <Lock size={18} className="mt-0.5 shrink-0 text-muted" />
              <div className="text-sm">
                <p className="font-medium text-ink">Detay erişimi kapalı</p>
                <p className="mt-0.5 text-xs text-muted">
                  Detay erişimi için müşteri izni gerekiyor. Müşteri, talep
                  üzerinden süreli izin verdiğinde finansal paneller burada
                  görünür (KVKK).
                </p>
              </div>
            </div>
          )}

          <Link
            href="/admin/talepler"
            className="block text-center text-sm font-medium text-muted hover:text-ink"
          >
            ← Talep listesine dön
          </Link>
        </div>
      </div>
    </div>
  );
}
