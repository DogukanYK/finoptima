"use client";

import { useActionState, useEffect } from "react";
import { createEvent, type EventActionState } from "@/lib/actions/events";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

export function EventForm({
  date,
  onDone,
}: {
  date: string;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState<EventActionState, FormData>(
    createEvent,
    {},
  );

  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-[var(--app-radius)] border border-line bg-surface-2 p-4"
    >
      <input type="hidden" name="date" value={date} />
      <Field
        name="title"
        label="Başlık"
        placeholder="Örn. Kredi kartı ödemesi"
        required
        error={state.fieldErrors?.title}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select name="type" label="Tür" defaultValue="REMINDER">
          <option value="REMINDER">Hatırlatma</option>
          <option value="BILL">Fatura</option>
          <option value="EVENT">Etkinlik</option>
        </Select>
        <Field name="time" type="time" label="Saat" />
      </div>
      <Field
        name="amount"
        label="Tutar (isteğe bağlı)"
        placeholder="₺ 0,00"
        inputMode="decimal"
      />
      <div className="flex gap-2">
        <SubmitButton size="sm" className="flex-1" pendingText="Ekleniyor…">
          Ekle
        </SubmitButton>
        <button
          type="button"
          onClick={onDone}
          className="rounded-[calc(var(--app-radius)*0.6)] px-3 py-2 text-sm font-medium text-muted"
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
