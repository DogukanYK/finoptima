"use server";

import { verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { getCurrentUser, requireUserId } from "@/lib/auth-helpers";
import { signOut } from "@/auth";
import { logAudit } from "@/lib/audit";

export type AccountActionState = { ok?: boolean; error?: string };

// Hesabı ve tüm verisini kalıcı olarak siler (KVKK — unutulma hakkı).
// Şemadaki onDelete: Cascade ile bağlı tüm kayıtlar silinir.
export async function deleteMyAccount(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const password = String(formData.get("password") ?? "");
  if (!password || !(await verify(user.passwordHash, password))) {
    return { error: "Parola hatalı." };
  }

  // Silmeden önce logla — kayıt anonimleşerek (userId null) korunur.
  await logAudit({
    userId: user.id,
    action: "account.delete",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email },
  });

  await db.user.delete({ where: { id: user.id } });

  await signOut({ redirectTo: "/login" });
  return { ok: true };
}

// Tüm cihazlardaki oturumları geçersiz kılar (~5 dk içinde).
export async function logoutEverywhere(): Promise<AccountActionState> {
  const userId = await requireUserId();
  await db.user.update({
    where: { id: userId },
    data: { sessionsValidFrom: new Date() },
  });
  await logAudit({ userId, action: "session.revoke_all" });
  return { ok: true };
}
