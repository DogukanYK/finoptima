// Destek Merkezi — AI sohbet kartı + kullanıcının talepleri.
// Liste server-side çekilir; etkileşim client bileşenlerde.

import { requireUser } from "@/lib/auth-helpers";
import { listTicketsForUser } from "@/lib/support-core";
import { PageHeader } from "@/components/ui/page-header";
import { SupportAiChat } from "@/components/support/support-ai-chat";
import { TicketList } from "@/components/support/ticket-list";
import { NewTicketForm } from "@/components/support/new-ticket-form";

export const maxDuration = 60;

export default async function DestekPage() {
  const user = await requireUser();
  const tickets = await listTicketsForUser(user.id);

  return (
    <div>
      <PageHeader
        kicker="destek"
        title="Destek Merkezi"
        description="Önce AI'ya sor — çözemezse sohbeti tek tıkla ekibimize aktar."
      />

      <SupportAiChat />

      <section className="mt-10">
        <NewTicketForm />
        <TicketList tickets={tickets} />
      </section>
    </div>
  );
}
