// Talep detayı — başlık + durum rozeti + mesaj dizisi (SupportThread).

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getTicketForUser } from "@/lib/support-core";
import { formatDateShort } from "@/lib/format";
import { StatusBadge, CATEGORY_LABELS } from "@/components/support/ticket-list";
import { SupportThread } from "@/components/support/support-thread";

export const maxDuration = 60;

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const ticket = await getTicketForUser(user.id, id);
  if (!ticket) notFound();

  return (
    <div>
      <Link
        href="/destek"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft size={16} />
        Destek Merkezi
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
          <span className="text-muted">#{ticket.shortId}</span> · {ticket.subject}
        </h1>
        <StatusBadge status={ticket.status} />
      </div>
      <p className="-mt-4 mb-6 text-xs text-muted">
        {CATEGORY_LABELS[ticket.category] ?? ticket.category} · Açılış:{" "}
        {formatDateShort(ticket.createdAt)}
      </p>

      <SupportThread initial={ticket} />
    </div>
  );
}
