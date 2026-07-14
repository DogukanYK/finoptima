// Destek talepleri listesi — server-safe (etkileşim yok, yalnız Link'ler).
// Durum/kategori TR etiketleri buradan export edilir; thread ve detay sayfası
// aynı rozetleri kullanır.

import Link from "next/link";
import { Inbox } from "lucide-react";
import type { PlainSupportTicket } from "@/lib/support-core";
import { formatDateShort } from "@/lib/format";
import { EmptyState } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export const STATUS_META: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Açık", className: "bg-blue-500/10 text-blue-600" },
  IN_PROGRESS: { label: "İlgileniliyor", className: "bg-violet-500/10 text-violet-600" },
  WAITING_USER: { label: "Yanıt bekleniyor", className: "bg-amber-500/10 text-amber-600" },
  RESOLVED: { label: "Çözüldü", className: "bg-emerald-500/10 text-emerald-600" },
  CLOSED: { label: "Kapalı", className: "bg-zinc-500/10 text-zinc-500" },
};

export const CATEGORY_LABELS: Record<string, string> = {
  ACCOUNT: "Hesap",
  TRANSACTIONS: "İşlemler",
  IMPORT: "Banka Dökümü",
  FINDEKS: "Findeks",
  DEBTS: "Borçlar",
  SECURITY: "Güvenlik",
  BUG: "Hata",
  OTHER: "Diğer",
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.OPEN;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function TicketList({ tickets }: { tickets: PlainSupportTicket[] }) {
  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<Inbox size={26} />}
        title="Henüz talebin yok"
        description="Bir sorun yaşarsan yukarıdaki AI sohbetine yazabilir ya da 'Yeni talep' ile bize ulaşabilirsin."
      />
    );
  }

  return (
    <div className="card divide-y divide-line p-0">
      {tickets.map((t) => (
        <Link
          key={t.id}
          href={`/destek/${t.id}`}
          className={cn(
            "flex items-center gap-3 px-4 py-3.5 transition-colors first:rounded-t-[inherit] last:rounded-b-[inherit] hover:bg-surface-2",
            t.unread && "bg-primary-soft/40",
          )}
        >
          {/* Okunmamış noktası — sabit genişlik: okunmuş satırlar da hizalı kalır */}
          <span className="flex w-2 shrink-0 justify-center" aria-hidden>
            {t.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
          </span>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
            #{t.shortId}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2">
              <span
                className={cn(
                  "truncate text-sm text-ink",
                  t.unread ? "font-semibold" : "font-medium",
                )}
              >
                {t.subject}
              </span>
              {t.unread && (
                <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                  yeni yanıt
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              {CATEGORY_LABELS[t.category] ?? t.category}
            </p>
          </div>
          <StatusBadge status={t.status} />
          <span className="shrink-0 text-xs text-muted">
            {formatDateShort(t.lastMessageAt)}
          </span>
        </Link>
      ))}
    </div>
  );
}
