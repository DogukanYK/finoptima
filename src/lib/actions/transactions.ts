"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { transactionSchema } from "@/lib/validation";
import { categorize } from "@/lib/categorize";
import { parseAmount, dateFromInput } from "@/lib/format";
import { makeDedupHash } from "@/lib/dedup";
import {
  getTransactions,
  type TransactionFilters,
  type TransactionPage,
} from "@/lib/queries";

export type TxActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function revalidateFinance() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/calendar");
}

export async function createTransaction(
  _prev: TxActionState,
  formData: FormData,
): Promise<TxActionState> {
  const userId = await requireUserId();

  const parsed = transactionSchema.safeParse({
    amount: parseAmount(String(formData.get("amount") ?? "")),
    kind: formData.get("kind"),
    description: formData.get("description"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId") || undefined,
    accountId: formData.get("accountId") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;

  let categoryId = data.categoryId;
  if (!categoryId) {
    const cats = await db.category.findMany({
      where: { userId, kind: data.kind },
      select: { id: true },
    });
    const allowed = new Set(cats.map((c) => c.id));
    const rules = await db.categoryRule.findMany({
      where: { userId, categoryId: { in: [...allowed] } },
      select: { pattern: true, categoryId: true, priority: true },
    });
    categoryId = categorize(data.description, rules) ?? undefined;
  }

  const date = dateFromInput(data.date);
  await db.transaction.create({
    data: {
      userId,
      kind: data.kind,
      amount: data.amount,
      description: data.description,
      date,
      categoryId: categoryId ?? null,
      accountId: data.accountId ?? null,
      note: data.note ?? null,
      source: "MANUAL",
      dedupHash: makeDedupHash(date, data.amount, data.description),
    },
  });

  revalidateFinance();
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.transaction.deleteMany({ where: { id, userId } });
  revalidateFinance();
}

export async function setTransactionCategory(
  id: string,
  categoryId: string | null,
): Promise<void> {
  const userId = await requireUserId();
  await db.transaction.updateMany({
    where: { id, userId },
    data: { categoryId },
  });
  revalidateFinance();
}

// İşlem listesi için sonraki sayfayı getirir (keyset sayfalama).
export async function loadMoreTransactions(
  filters: TransactionFilters,
  cursor: string,
): Promise<TransactionPage> {
  const userId = await requireUserId();
  return getTransactions(userId, filters, cursor);
}
