"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Plus, Trash2, Landmark, CreditCard } from "lucide-react";
import {
  createAccount,
  deleteAccount,
  type SettingsActionState,
} from "@/lib/actions/settings";
import { formatTL } from "@/lib/format";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

type Account = {
  id: string;
  bankName: string;
  type: string;
  label: string;
  iban: string | null;
  balance: number | null;
  cardLast4: string | null;
  cardExpiry: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  CHECKING: "Vadesiz",
  CREDIT_CARD: "Kredi Kartı",
  SAVINGS: "Birikim",
  CASH: "Nakit",
  OTHER: "Diğer",
};

const BANKS = [
  "Enpara",
  "Garanti BBVA",
  "Yapı Kredi",
  "Ziraat Bankası",
  "İş Bankası",
  "Akbank",
  "Nays",
  "Nakit",
  "Diğer",
];

export function AccountsManager({ accounts }: { accounts: Account[] }) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(
    createAccount,
    {},
  );
  const [showForm, setShowForm] = useState(accounts.length === 0);
  const [type, setType] = useState("CHECKING");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (state.ok) {
      setShowForm(false);
      setType("CHECKING");
    }
  }, [state]);

  const isCard = type === "CREDIT_CARD";

  return (
    <div className="space-y-4">
      <div className="card divide-y divide-[var(--app-border)]">
        {accounts.length === 0 ? (
          <p className="p-5 text-center text-sm text-muted">
            Henüz hesap yok. Banka hesaplarını ve kartlarını ekle.
          </p>
        ) : (
          accounts.map((a) => {
            const card = a.type === "CREDIT_CARD";
            return (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{
                    background: card
                      ? "linear-gradient(120deg, var(--app-primary), var(--app-accent))"
                      : "linear-gradient(120deg, var(--app-primary), var(--app-accent))",
                  }}
                >
                  {card ? <CreditCard size={19} /> : <Landmark size={19} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-medium text-ink">{a.label}</p>
                    <span className="inline-flex items-center rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                      {TYPE_LABELS[a.type] ?? a.type}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted">
                    {a.bankName}
                    {card && a.cardLast4 && ` · •••• ${a.cardLast4}`}
                    {!card && a.iban && ` · ${a.iban}`}
                  </p>
                </div>
                {!card && a.balance != null && (
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                    {formatTL(a.balance)}
                  </span>
                )}
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await deleteAccount(a.id);
                    })
                  }
                  disabled={pending}
                  aria-label="Hesabı sil"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-destructive-soft hover:text-destructive"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {showForm ? (
        <form action={formAction} className="card space-y-3 p-4">
          <Select name="bankName" label="Banka" defaultValue="Enpara">
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
          <Select
            name="type"
            label="Tür"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="CHECKING">Vadesiz hesap</option>
            <option value="CREDIT_CARD">Kredi kartı</option>
            <option value="SAVINGS">Birikim hesabı</option>
            <option value="CASH">Nakit</option>
            <option value="OTHER">Diğer</option>
          </Select>
          <Field
            name="label"
            label="Etiket"
            placeholder={isCard ? "Örn. Bonus Premium" : "Örn. Maaş hesabım"}
            required
            error={state.fieldErrors?.label}
          />

          {isCard ? (
            <div className="grid grid-cols-2 gap-3">
              <Field
                name="cardLast4"
                label="Kart son 4 hane"
                placeholder="4567"
                inputMode="numeric"
                maxLength={4}
                error={state.fieldErrors?.cardLast4}
              />
              <Field
                name="cardExpiry"
                label="Son kullanma"
                placeholder="08/26"
                error={state.fieldErrors?.cardExpiry}
              />
            </div>
          ) : (
            <>
              <Field
                name="iban"
                label="IBAN (isteğe bağlı)"
                placeholder="TR00 0000 0000 0000 0000 00"
                error={state.fieldErrors?.iban}
              />
              <Field
                name="balance"
                label="Bakiye (isteğe bağlı)"
                placeholder="0,00"
                inputMode="decimal"
              />
            </>
          )}

          <div className="flex gap-2">
            <SubmitButton size="sm" className="flex-1">
              Hesap ekle
            </SubmitButton>
            {accounts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 text-sm font-medium text-muted"
              >
                Vazgeç
              </button>
            )}
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--app-radius)] border border-dashed border-line py-3 text-sm font-medium text-primary"
        >
          <Plus size={16} /> Hesap ekle
        </button>
      )}
    </div>
  );
}
