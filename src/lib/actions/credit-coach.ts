"use server";

import { requireUserId } from "@/lib/auth-helpers";
import { getFindeksSignals, getDebts } from "@/lib/queries";
import { computeFindeks } from "@/lib/findeks";
import { generateCreditCoachPlan, type CoachPlan } from "@/lib/ai/creditCoach";
import { logAudit } from "@/lib/audit";

export type CreditCoachState =
  | { status: "idle" }
  | { status: "ok"; plan: CoachPlan }
  | { status: "error"; error: string };

// Kullanıcı tetiklemeli: "Eylem planı oluştur" butonuna basınca çalışır.
// Her sayfa yüklemesinde DEĞİL — maliyet kontrolü için kullanıcı isteyince.
// İmza useActionState'e uygundur (prevState + formData alır, kullanmaz).
export async function generateCoachPlan(
  _prev: CreditCoachState,
  _formData: FormData,
): Promise<CreditCoachState> {
  const userId = await requireUserId();
  try {
    const [signals, debts] = await Promise.all([
      getFindeksSignals(userId),
      getDebts(userId),
    ]);
    // Deterministik motor = gerçeğin kaynağı. Skoru o hesaplar, Claude değil.
    const findeks = computeFindeks(signals);
    const plan = await generateCreditCoachPlan({ findeks, debts });

    await logAudit({
      userId,
      action: "credit_coach.generate",
      entityType: "CreditCoach",
    });

    return { status: "ok", plan };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Plan oluşturulamadı, tekrar dene.",
    };
  }
}
