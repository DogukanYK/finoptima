"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId, getCurrentUser } from "@/lib/auth-helpers";
import { accountSchema, categorySchema } from "@/lib/validation";
import { parseAmount } from "@/lib/format";

export type SettingsActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// ---- Hesaplar ----

export async function createAccount(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const userId = await requireUserId();
  const parsed = accountSchema.safeParse({
    bankName: formData.get("bankName"),
    type: formData.get("type"),
    label: formData.get("label"),
    iban: formData.get("iban") || undefined,
    cardLast4: formData.get("cardLast4") || undefined,
    cardExpiry: formData.get("cardExpiry") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }
  const { bankName, type, label, iban, cardLast4, cardExpiry } = parsed.data;
  const rawBalance = String(formData.get("balance") ?? "").trim();
  const balance = rawBalance ? parseAmount(rawBalance) : NaN;
  const isCard = type === "CREDIT_CARD";

  await db.account.create({
    data: {
      userId,
      bankName,
      type,
      label,
      iban: !isCard && iban ? iban : null,
      balance:
        !isCard && Number.isFinite(balance) ? balance : null,
      cardLast4: isCard && cardLast4 ? cardLast4 : null,
      cardExpiry: isCard && cardExpiry ? cardExpiry : null,
    },
  });
  revalidatePath("/settings");
  revalidatePath("/add");
  revalidatePath("/profil");
  return { ok: true };
}

export async function deleteAccount(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.account.deleteMany({ where: { id, userId } });
  revalidatePath("/settings");
  revalidatePath("/add");
  revalidatePath("/profil");
}

// ---- Kategoriler ----

export async function createCategory(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const userId = await requireUserId();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    icon: formData.get("icon"),
    color: formData.get("color"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] = issue.message;
    return { fieldErrors };
  }
  await db.category.create({ data: { userId, ...parsed.data } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.category.deleteMany({ where: { id, userId } });
  revalidatePath("/settings");
}

// ---- Davet kodları ----

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n: number) =>
    Array.from(
      { length: n },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  return `${pick(4)}-${pick(4)}`;
}

export async function createInviteCode(): Promise<{
  ok: boolean;
  code?: string;
  error?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };
  if (user.role !== "ADMIN") {
    return { ok: false, error: "Davet kodu üretme yetkin yok." };
  }

  let code = randomCode();
  for (let i = 0; i < 5; i++) {
    const exists = await db.inviteCode.findUnique({ where: { code } });
    if (!exists) break;
    code = randomCode();
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  await db.inviteCode.create({
    data: { code, createdById: user.id, expiresAt },
  });
  revalidatePath("/settings");
  return { ok: true, code };
}

export async function deleteInviteCode(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return;
  await db.inviteCode.deleteMany({
    where: { id, createdById: user.id, usedById: null },
  });
  revalidatePath("/settings");
}
