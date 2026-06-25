"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { parseFindeksPdf } from "@/lib/findeksReport";

export type FindeksUploadState = { ok?: boolean; error?: string };

export async function uploadFindeksReport(
  _prev: FindeksUploadState,
  formData: FormData,
): Promise<FindeksUploadState> {
  const userId = await requireUserId();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Lütfen Findeks raporu PDF'ini seç." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "Dosya 10 MB'tan küçük olmalı." };
  }

  const buffer = await file.arrayBuffer();
  let parsed;
  try {
    parsed = await parseFindeksPdf(buffer);
  } catch {
    return { error: "PDF okunamadı." };
  }
  if (!parsed) {
    return {
      error: "Bu dosya bir Findeks Risk Raporu PDF'i gibi görünmüyor.",
    };
  }

  await db.findeksReport.create({
    data: {
      userId,
      reportDate: new Date(parsed.reportDate),
      score: parsed.score,
      band: parsed.band,
      componentWeights: parsed.componentWeights,
      totalLimit: parsed.totalLimit,
      totalDebt: parsed.totalDebt,
      debtRatio: parsed.debtRatio,
      worstStatus: parsed.worstStatus,
      accounts: parsed.cards,
      fileName: file.name.slice(0, 160),
    },
  });

  revalidatePath("/findeks");
  revalidatePath("/dashboard");
  return { ok: true };
}
