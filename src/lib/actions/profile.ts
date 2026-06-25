"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { financeProfileSchema } from "@/lib/validation";
import { dateFromInput } from "@/lib/format";
import { encryptField } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";

export type ProfileActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function revalidate() {
  revalidatePath("/profil");
}

export async function updateFinanceProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const userId = await requireUserId();

  const parsed = financeProfileSchema.safeParse({
    accountType: formData.get("accountType"),
    taxOrIdNumber: formData.get("taxOrIdNumber") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    nationality: formData.get("nationality") || undefined,
    province: formData.get("province") || undefined,
    district: formData.get("district") || undefined,
    neighborhood: formData.get("neighborhood") || undefined,
    fullAddress: formData.get("fullAddress") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    profession: formData.get("profession") || undefined,
    incomeRange: formData.get("incomeRange") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }

  const d = parsed.data;
  // taxOrIdNumber ve fullAddress hassas (KVKK) — at-rest şifrelenir.
  const data = {
    accountType: d.accountType,
    taxOrIdNumber: encryptField(d.taxOrIdNumber || null),
    birthDate: d.birthDate ? dateFromInput(d.birthDate) : null,
    nationality: d.nationality || null,
    province: d.province || null,
    district: d.district || null,
    neighborhood: d.neighborhood || null,
    fullAddress: encryptField(d.fullAddress || null),
    postalCode: d.postalCode || null,
    profession: d.profession || null,
    incomeRange: d.incomeRange || null,
  };

  await db.financeProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
  await logAudit({
    userId,
    action: "profile.update",
    entityType: "FinanceProfile",
    metadata: { accountType: d.accountType },
  });
  revalidate();
  return { ok: true };
}

export async function updateAiIdentity(
  text: string,
): Promise<ProfileActionState> {
  const userId = await requireUserId();
  const trimmed = text.trim().slice(0, 1500);
  // aiIdentityText kullanıcının serbest metni — at-rest şifrelenir.
  const encrypted = encryptField(trimmed || null);
  await db.financeProfile.upsert({
    where: { userId },
    create: { userId, aiIdentityText: encrypted },
    update: { aiIdentityText: encrypted },
  });
  revalidate();
  return { ok: true };
}
