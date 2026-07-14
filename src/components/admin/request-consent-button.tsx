"use client";

// "Müşteriden izin iste" — admin, kilitli talep detayında bu butona basınca
// müşterinin talep sayfasına bir izin kartı düşer. Admin burada HİÇBİR finansal
// veri görmez; süreyi ve kapsamı yalnızca müşteri seçer (KVKK).

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldQuestion } from "lucide-react";
import { adminRequestConsent } from "@/lib/actions/admin-support";
import { Button } from "@/components/ui/button";

export function RequestConsentButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Başarıdan 2 sn sonra sayfayı tazele (müşteriye düşen izin kartı / sistem
  // mesajı akışta görünsün).
  useEffect(() => {
    if (!sent) return;
    const t = setTimeout(() => router.refresh(), 2000);
    return () => clearTimeout(t);
  }, [sent, router]);

  function request() {
    if (isPending || sent) return;
    setError(null);
    startTransition(async () => {
      const res = await adminRequestConsent(ticketId);
      if (res.ok) setSent(true);
      else setError(res.error);
    });
  }

  return (
    <div className="mt-3">
      {sent ? (
        <p className="text-xs font-medium text-accent">
          İzin talebi gönderildi ✓
        </p>
      ) : (
        <Button variant="outline" size="sm" onClick={request} disabled={isPending}>
          {isPending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ShieldQuestion size={15} />
          )}
          Müşteriden izin iste
        </Button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <p className="mt-2 text-xs text-muted">
        Müşterinin talep sayfasına bir izin kartı düşer; süre ve kapsamı kendisi
        seçer.
      </p>
    </div>
  );
}
