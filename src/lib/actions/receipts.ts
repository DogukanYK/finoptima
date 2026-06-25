"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { transactionSchema } from "@/lib/validation";
import { categorize } from "@/lib/categorize";
import { parseAmount, dateFromInput } from "@/lib/format";
import { extractDocument } from "@/lib/extract";

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

export type ReceiptExtractResult =
  | {
      ok: true;
      amount: string;
      description: string;
      date: string;
      kind: "EXPENSE" | "INCOME";
    }
  | { ok: false; error: string };

// Offline OCR fişi okuyamazsa: görüntüyü buluta (Claude vision) gönderip
// alanları doldurur. Fotoğraf YALNIZ bu durumda sunucuya gider.
export async function extractReceiptFromImage(
  formData: FormData,
): Promise<ReceiptExtractResult> {
  await requireUserId();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Görüntü bulunamadı." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "Görüntü 10 MB'tan küçük olmalı." };
  }

  const buffer = await file.arrayBuffer();
  const result = await extractDocument(
    { fileName: file.name, mimeType: file.type || "image/png", buffer },
    { allowCloud: true },
  );
  const row = result.rows[0];
  if (!row) {
    return {
      ok: false,
      error:
        "Görüntüden bilgi okunamadı. Görüntü okuma AI gerektirir — ANTHROPIC_API_KEY ekli mi?",
    };
  }
  const dt = row.date;
  const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  return {
    ok: true,
    amount: row.amount.toFixed(2).replace(".", ","),
    description: row.description || "Fiş",
    date: dateStr,
    kind: row.direction === "in" ? "INCOME" : "EXPENSE",
  };
}
