"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  type SettingsActionState,
} from "@/lib/actions/settings";
import { CategoryIcon, ICON_NAMES } from "@/components/ui/icon";
import { ColorInput } from "@/components/ui/color-input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: string;
};

export function CategoriesManager({
  categories,
}: {
  categories: Category[];
}) {
  const [state, formAction] = useActionState<SettingsActionState, FormData>(
    createCategory,
    {},
  );
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [icon, setIcon] = useState("tag");
  const [color, setColor] = useState("#1E40AF");

  useEffect(() => {
    if (state.ok) {
      setShowForm(false);
      setIcon("tag");
      setColor("#1E40AF");
    }
  }, [state]);

  const expense = categories.filter((c) => c.kind === "EXPENSE");
  const income = categories.filter((c) => c.kind === "INCOME");

  return (
    <div className="space-y-4">
      {[
        { label: "Gider kategorileri", list: expense },
        { label: "Gelir kategorileri", list: income },
      ].map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-1 text-sm font-semibold text-ink">
            {group.label}
          </p>
          <div className="card flex flex-wrap gap-2 p-3">
            {group.list.map((c) => (
              <span
                key={c.id}
                className="group inline-flex items-center gap-1.5 rounded-full border border-line py-1 pl-1.5 pr-1 text-sm"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: c.color + "22", color: c.color }}
                >
                  <CategoryIcon name={c.icon} size={13} />
                </span>
                <span className="text-ink">{c.name}</span>
                <button
                  onClick={() =>
                    startTransition(async () => {
                      await deleteCategory(c.id);
                    })
                  }
                  disabled={pending}
                  aria-label={`${c.name} kategorisini sil`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-destructive-soft hover:text-destructive"
                >
                  <Trash2 size={12} />
                </button>
              </span>
            ))}
            {group.list.length === 0 && (
              <p className="px-1 py-2 text-sm text-muted">Kategori yok.</p>
            )}
          </div>
        </div>
      ))}

      {showForm ? (
        <form action={formAction} className="card space-y-3 p-4">
          <input type="hidden" name="kind" value={kind} />
          <input type="hidden" name="icon" value={icon} />
          <input type="hidden" name="color" value={color} />

          <div className="flex gap-1 rounded-[calc(var(--app-radius)*0.7)] bg-surface-2 p-1">
            {(["EXPENSE", "INCOME"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "flex-1 rounded-[calc(var(--app-radius)*0.5)] py-1.5 text-sm font-medium",
                  kind === k ? "bg-surface text-ink" : "text-muted",
                )}
              >
                {k === "EXPENSE" ? "Gider" : "Gelir"}
              </button>
            ))}
          </div>

          <Field
            name="name"
            label="Kategori adı"
            placeholder="Örn. Evcil hayvan"
            required
            error={state.fieldErrors?.name}
          />

          <ColorInput label="Renk" value={color} onChange={setColor} />

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">İkon</p>
            <div className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto rounded-[calc(var(--app-radius)*0.6)] border border-line p-2">
              {ICON_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setIcon(name)}
                  className={cn(
                    "flex h-9 items-center justify-center rounded-[calc(var(--app-radius)*0.45)]",
                    icon === name
                      ? "bg-primary text-white"
                      : "text-muted hover:bg-surface-2",
                  )}
                >
                  <CategoryIcon name={name} size={17} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <SubmitButton size="sm" className="flex-1">
              Kategori ekle
            </SubmitButton>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 text-sm font-medium text-muted"
            >
              Vazgeç
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--app-radius)] border border-dashed border-line py-3 text-sm font-medium text-primary"
        >
          <Plus size={16} /> Kategori ekle
        </button>
      )}
    </div>
  );
}
