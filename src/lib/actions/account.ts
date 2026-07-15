"use server";

import { after } from "next/server";
import { verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { getCurrentUser, requireUserId } from "@/lib/auth-helpers";
import { signOut } from "@/auth";
import { logAudit } from "@/lib/audit";
import { sendAccountEmail } from "@/lib/email/account";
import { accountDeleted, sessionsRevoked } from "@/lib/email/templates";

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

  // Veda e-postası için e-posta/adı silmeden ÖNCE yakala.
  const farewell = { to: user.email, name: user.name };
  await db.user.delete({ where: { id: user.id } });

  // Hesap artık yok → userId verme (audit FK'sı SetNull olsa da bağlanacak kullanıcı kalmadı).
  after(async () => {
    try {
      await sendAccountEmail({
        to: farewell.to,
        name: farewell.name,
        content: accountDeleted({ name: farewell.name }),
        kind: "account_deleted",
      });
    } catch (err) {
      console.error("[account-email] hesap silindi bildirimi başarısız:", err);
    }
  });

  await signOut({ redirectTo: "/login" });
  return { ok: true };
}

// Tüm cihazlardaki oturumları geçersiz kılar (~5 dk içinde).
export async function logoutEverywhere(): Promise<AccountActionState> {
  const userId = await requireUserId();
  const user = await db.user.update({
    where: { id: userId },
    data: { sessionsValidFrom: new Date() },
    select: { email: true, name: true },
  });
  await logAudit({ userId, action: "session.revoke_all" });

  after(async () => {
    try {
      await sendAccountEmail({
        userId,
        to: user.email,
        name: user.name,
        content: sessionsRevoked({ name: user.name }),
        kind: "sessions_revoked",
      });
    } catch (err) {
      console.error("[account-email] oturum kapatma bildirimi başarısız:", err);
    }
  });

  return { ok: true };
}
