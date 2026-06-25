"use client";

import { useActionState } from "react";
import { Sparkles, AlertCircle, ArrowUpCircle } from "lucide-react";
import {
  generateCoachPlan,
  type CreditCoachState,
} from "@/lib/actions/credit-coach";
import { SubmitButton } from "@/components/ui/submit-button";

const PRIORITY = {
  high: { label: "Yüksek öncelik", cls: "bg-destructive-soft text-destructive" },
  medium: { label: "Orta öncelik", cls: "bg-accent-soft text-accent" },
  low: { label: "Düşük öncelik", cls: "bg-surface-2 text-muted" },
} as const;

export function CreditCoach() {
  const [state, formAction] = useActionState<CreditCoachState, FormData>(
    generateCoachPlan,
    { status: "idle" },
  );

  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 font-heading text-base font-bold text-ink">
        <Sparkles size={18} className="text-primary" /> Kredi koçu
      </h2>
      <p className="mt-1 text-sm text-muted">
        Yapay zeka, verilerine bakıp kredi sağlığını yükseltmen için bu ay yapman
        gerekenleri önceliklendirir.
      </p>

      {state.status === "error" && (
        <div className="mt-3 flex items-center gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0" />
          {state.error}
        </div>
      )}

      {state.status === "ok" && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-ink">{state.plan.summary}</p>
          <ol className="space-y-3">
            {state.plan.steps.map((s, i) => {
              const p = PRIORITY[s.priority];
              return (
                <li
                  key={i}
                  className="rounded-[var(--app-radius)] border border-line p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading text-sm font-bold text-ink">
                      {s.title}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${p.cls}`}
                    >
                      {p.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{s.why}</p>
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-ink">
                    <ArrowUpCircle
                      size={15}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <span>{s.action}</span>
                  </p>
                  <span className="mt-2 inline-block text-xs text-accent">
                    {s.impact}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-xs text-muted">
            Bu plan tahmini kredi sağlığı verilerinden üretildi; resmî Findeks notu
            değildir.
          </p>
        </div>
      )}

      <form action={formAction}>
        <SubmitButton
          className="mt-4 w-full"
          size="md"
          pendingText="Koç düşünüyor…"
        >
          {state.status === "ok" ? "Planı yenile" : "Eylem planı oluştur"}
        </SubmitButton>
      </form>
    </div>
  );
}
