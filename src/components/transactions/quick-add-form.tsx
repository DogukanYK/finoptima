"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import {
  createTransaction,
  type TxActionState,
} from "@/lib/actions/transactions";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string; kind: string; icon: string };
type Account = { id: string; label: string; bankName: string };

const today = () => new Date().toISOString().slice(0, 10);

export function QuickAddForm({
  categories,
  accounts,
}: {
  categories: Category[];
  accounts: Account[];
}) {
  const [state, formAction] = useActionState<TxActionState, FormData>(
    createTransaction,
    {},
  );
  const [kind, setKind] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  // Tarih istemcide atanır — sunucu/istemci hidrasyon uyuşmazlığını önler
  useEffect(() => {
    if (!date) setDate(today());
  }, [date]);

  useEffect(() => {
    if (state.ok) {
      setAmount("");
      setDescription("");
      setShowNote(false);
      setJustSaved(true);
      amountRef.current?.focus();
      const t = setTimeout(() => setJustSaved(false), 2600);
      return () => clearTimeout(t);
    }
  }, [state]);

  const kindCategories = categories.filter((c) => c.kind === kind);

  return (
    <form action={formAction} className="card p-5">
      {/* Gelir / Gider seçimi */}
      <div className="grid grid-cols-2 gap-2 rounded-[calc(var(--app-radius)*0.8)] bg-surface-2 p-1">
        <button
          type="button"
          onClick={() => setKind("EXPENSE")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-[calc(var(--app-radius)*0.6)] py-2.5 text-sm font-semibold transition-colors",
            kind === "EXPENSE"
              ? "bg-destructive text-white"
              : "text-muted hover:text-ink",
          )}
        >
          <ArrowUpRight size={16} /> Gider
        </button>
        <button
          type="button"
          onClick={() => setKind("INCOME")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-[calc(var(--app-radius)*0.6)] py-2.5 text-sm font-semibold transition-colors",
            kind === "INCOME"
              ? "bg-accent text-white"
              : "text-muted hover:text-ink",
          )}
        >
          <ArrowDownLeft size={16} /> Gelir
        </button>
      </div>
      <input type="hidden" name="kind" value={kind} />

      {/* Tutar */}
      <div className="my-6 text-center">
        <label
          htmlFor="amount"
          className="text-xs font-medium uppercase tracking-wide text-muted"
        >
          Tutar
        </label>
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="text-3xl font-bold text-muted">₺</span>
          <input
            ref={amountRef}
            id="amount"
            name="amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value.replace(/[^0-9.,]/g, ""))
            }
            inputMode="decimal"
            placeholder="0,00"
            autoComplete="off"
            required
            className="w-48 rounded-[calc(var(--app-radius)*0.5)] bg-transparent text-center font-heading text-4xl font-extrabold tabular-nums text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary-soft)] placeholder:text-muted/40"
          />
        </div>
        {state.fieldErrors?.amount && (
          <p role="alert" className="mt-1 text-sm text-destructive">
            {state.fieldErrors.amount}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <Field
          name="description"
          label="Açıklama"
          placeholder="Örn. Migros alışveriş"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          error={state.fieldErrors?.description}
          autoComplete="off"
        />

        <div className="rounded-[calc(var(--app-radius)*0.7)] bg-primary-soft px-3 py-2 text-xs text-primary">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Sparkles size={13} /> Kategori boş bırakılırsa açıklamaya göre
            otomatik atanır.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select name="categoryId" label="Kategori" defaultValue="">
            <option value="">Otomatik seç</option>
            {kindCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Field
            name="date"
            type="date"
            label="Tarih"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {accounts.length > 0 && (
          <Select name="accountId" label="Hesap" defaultValue="">
            <option value="">Belirtilmedi</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} · {a.bankName}
              </option>
            ))}
          </Select>
        )}

        {showNote ? (
          <div>
            <label
              htmlFor="note"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Not
            </label>
            <textarea
              id="note"
              name="note"
              rows={2}
              placeholder="İsteğe bağlı not"
              className="w-full rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface px-3.5 py-2.5 text-base text-ink outline-none focus-visible:border-[var(--app-primary)]"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="flex items-center gap-1 text-sm font-medium text-primary"
          >
            <ChevronDown size={15} /> Not ekle
          </button>
        )}
      </div>

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="mt-5 flex items-center gap-3">
        <SubmitButton size="lg" className="flex-1" pendingText="Kaydediliyor…">
          Kaydet
        </SubmitButton>
      </div>

      {justSaved && (
        <div
          role="status"
          className="mt-4 flex items-center justify-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-accent-soft py-2.5 text-sm font-medium text-accent"
        >
          <CheckCircle2 size={17} /> Kaydedildi — yeni kayıt ekleyebilirsin
        </div>
      )}
    </form>
  );
}
