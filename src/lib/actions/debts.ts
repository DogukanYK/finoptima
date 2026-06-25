"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { debtSchema, debtPaymentSchema } from "@/lib/validation";
import { parseAmount } from "@/lib/format";
import { logAudit } from "@/lib/audit";

export type DebtActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function revalidate() {
  revalidatePath("/borclar");
  revalidatePath("/strateji");
  revalidatePath("/dashboard");
}

function fieldErrors(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) out[String(issue.path[0])] = issue.message;
  return out;
}

export async function createDebt(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const userId = await requireUserId();
  const rawDueDay = String(formData.get("dueDay") ?? "").trim();

  const parsed = debtSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    balance: parseAmount(String(formData.get("balance") ?? "")),
    apr: String(formData.get("apr") ?? "").replace(",", "."),
    dueDay: rawDueDay || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error.issues) };
  }

  const debt = await db.debt.create({
    data: {
      userId,
      name: parsed.data.name,
      kind: parsed.data.kind,
      balance: parsed.data.balance,
      apr: parsed.data.apr,
      dueDay: parsed.data.dueDay ?? null,
    },
  });
  await logAudit({
    userId,
    action: "debt.create",
    entityType: "Debt",
    entityId: debt.id,
    metadata: { name: debt.name, balance: parsed.data.balance },
  });
  revalidate();
  return { ok: true };
}

export async function updateDebt(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const userId = await requireUserId();
  const id = String(formData.get("id") ?? "");
  const rawDueDay = String(formData.get("dueDay") ?? "").trim();

  const parsed = debtSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    balance: parseAmount(String(formData.get("balance") ?? "")),
    apr: String(formData.get("apr") ?? "").replace(",", "."),
    dueDay: rawDueDay || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error.issues) };
  }

  await db.debt.updateMany({
    where: { id, userId },
    data: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      balance: parsed.data.balance,
      apr: parsed.data.apr,
      dueDay: parsed.data.dueDay ?? null,
    },
  });
  revalidate();
  revalidatePath(`/borclar/${id}`);
  return { ok: true };
}

export async function deleteDebt(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.debt.deleteMany({ where: { id, userId } });
  await logAudit({
    userId,
    action: "debt.delete",
    entityType: "Debt",
    entityId: id,
  });
  revalidate();
}

// Bir borca ödeme kaydeder: bakiyeyi düşürür, ödeme kaydı oluşturur.
export async function recordDebtPayment(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const userId = await requireUserId();
  const parsed = debtPaymentSchema.safeParse({
    debtId: formData.get("debtId"),
    amount: parseAmount(String(formData.get("amount") ?? "")),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error.issues) };
  }

  const debt = await db.debt.findFirst({
    where: { id: parsed.data.debtId, userId },
  });
  if (!debt) return { error: "Borç bulunamadı." };

  const amount = Math.min(parsed.data.amount, Number(debt.balance));
  await db.$transaction([
    db.debtPayment.create({
      data: {
        userId,
        debtId: debt.id,
        amount,
        source: "MANUAL",
        note: parsed.data.note ?? null,
      },
    }),
    db.debt.update({
      where: { id: debt.id },
      data: { balance: { decrement: amount } },
    }),
  ]);

  await logAudit({
    userId,
    action: "debt.payment",
    entityType: "Debt",
    entityId: debt.id,
    metadata: { amount, debtName: debt.name },
  });

  revalidate();
  revalidatePath(`/borclar/${debt.id}`);
  return { ok: true };
}
