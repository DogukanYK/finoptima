"use client";

import { useActionState, useEffect, useRef } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import {
  recordDebtPayment,
  type DebtActionState,
} from "@/lib/actions/debts";
import { formatTL } from "@/lib/format";
import { SectionCard } from "@/components/ui/section-card";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function DebtPaymentForm({
  debtId,
  balance,
}: {
  debtId: string;
  balance: number;
}) {
  const [state, formAction] = useActionState<DebtActionState, FormData>(
    recordDebtPayment,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <SectionCard title="Ödeme Yap" subtitle="Bu borca yaptığın ödemeyi kaydet">
      <form ref={formRef} action={formAction} className="space-y-3">
        <input type="hidden" name="debtId" value={debtId} />
        <div className="flex items-center gap-3 rounded-[var(--app-radius)] bg-accent-soft p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
            <Wallet size={18} />
          </span>
          <p className="text-sm font-medium text-ink">
            Kalan bakiye{" "}
            <span className="font-semibold tabular-nums text-accent">
              {formatTL(balance)}
            </span>
          </p>
        </div>
        <Field
          name="amount"
          label="Ödeme tutarı"
          placeholder="0,00"
          inputMode="decimal"
          required
          hint={`Bakiye: ${formatTL(balance)}`}
          error={state.fieldErrors?.amount}
        />
        <Field
          name="note"
          label="Not (isteğe bağlı)"
          placeholder="Örn. Asgari ödeme"
          error={state.fieldErrors?.note}
        />

        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="flex items-center gap-1.5 text-sm text-accent">
            <CheckCircle2 size={16} /> Ödemen kaydedildi.
          </p>
        )}

        <SubmitButton variant="accent" className="w-full">
          Ödemeyi kaydet
        </SubmitButton>
      </form>
    </SectionCard>
  );
}
