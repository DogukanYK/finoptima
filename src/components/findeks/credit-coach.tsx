"use client";

import { useActionState } from "react";
import {
  Sparkles,
  AlertCircle,
  ArrowUpCircle,
  ListChecks,
  TrendingUp,
} from "lucide-react";
import {
  generateCoachPlan,
  type CreditCoachState,
} from "@/lib/actions/credit-coach";
import type { CoachPlan } from "@/lib/ai/coachSchema";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatDate } from "@/lib/format";

const PRIORITY = {
  high: { label: "Yüksek öncelik", cls: "bg-destructive-soft text-destructive" },
  medium: { label: "Orta öncelik", cls: "bg-accent-soft text-accent" },
  low: { label: "Düşük öncelik", cls: "bg-surface-2 text-muted" },
} as const;

export function CreditCoach({
  initialPlan = null,
  initialGeneratedAt = null,
}: {
  initialPlan?: CoachPlan | null;
  initialGeneratedAt?: string | null;
}) {
  // Kalıcı plan varsa idle yerine "ok" ile başla → sayfa yenilenince kaybolmaz.
  const initial: CreditCoachState =
    initialPlan && initialGeneratedAt
      ? { status: "ok", plan: initialPlan, generatedAt: initialGeneratedAt }
      : { status: "idle" };
  const [state, formAction] = useActionState<CreditCoachState, FormData>(
    generateCoachPlan,
    initial,
  );

  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2.5 font-heading text-base font-bold text-ink">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ background: "linear-gradient(120deg,#2563EB,#0EA5E9)" }}
        >
          <Sparkles size={18} />
        </span>
        Kredi koçu
      </h2>
      <p className="mt-2 text-sm text-muted">
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
          <div className="flex items-start gap-3 rounded-[var(--app-radius)] bg-surface-2 p-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <ListChecks size={16} />
            </span>
            <p className="text-sm text-ink">{state.plan.summary}</p>
          </div>
          <ol className="space-y-3">
            {state.plan.steps.map((s, i) => {
              const p = PRIORITY[s.priority];
              return (
                <li key={i} className="card card-hover p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2.5 font-heading text-sm font-bold text-ink">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-heading text-xs font-bold tabular-nums text-primary">
                        {i + 1}
                      </span>
                      {s.title}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.cls}`}
                    >
                      {p.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted">{s.why}</p>
                  <p className="mt-2.5 flex items-start gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-primary-soft px-3 py-2 text-sm text-ink">
                    <ArrowUpCircle
                      size={15}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <span>{s.action}</span>
                  </p>
                  <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
                    <TrendingUp size={13} />
                    {s.impact}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="text-xs text-muted">
            {formatDate(state.generatedAt)} tarihinde üretildi. Bu plan tahmini
            kredi sağlığı verilerinden üretildi; resmî Findeks notu değildir.
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
