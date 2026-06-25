"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { transactionSchema } from "@/lib/validation";
import { categorize } from "@/lib/categorize";
import { parseAmount, dateFromInput } from "@/lib/format";

export type ReceiptActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// Fiş kaydı. OCR kullanıcının cihazında yapılır; sunucuya yalnız
// yapılandırılmış veri gelir — fotoğraf gönderilmez ve saklanmaz.
export async function uploadReceipt(
  _prev: ReceiptActionState,
  formData: FormData,
): Promise<ReceiptActionState> {
  const userId = await requireUserId();

  const parsed = transactionSchema.safeParse({
    amount: parseAmount(String(formData.get("amount") ?? "")),
    kind: formData.get("kind"),
    description: formData.get("description"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId") || undefined,
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

  // Kategori otomatik (verilmemişse açıklamadan).
  let categoryId = data.categoryId;
  if (!categoryId) {
    const rules = await db.categoryRule.findMany({
      where: { userId },
      select: { pattern: true, categoryId: true, priority: true },
    });
    categoryId = categorize(data.description, rules) ?? undefined;
  }

  await db.transaction.create({
    data: {
      userId,
      kind: data.kind,
      amount: data.amount,
      description: data.description,
      date: dateFromInput(data.date),
      categoryId: categoryId ?? null,
      note: data.note ?? null,
      source: "RECEIPT",
    },
  });

  revalidatePath("/receipts");
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { ok: true };
}
