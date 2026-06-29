// Tek kaynak: e-posta+şifre (+2FA) doğrulaması. Web (NextAuth authorize) ile
// AYNI mantık — argon2 + TOTP. İleride auth.ts de bunu çağıracak şekilde
// birleştirilebilir (auth-logic drift olmasın diye).
import { verify } from "@node-rs/argon2";
import { verify as verifyTotp } from "otplib";
import { db } from "@/lib/db";
import { decryptField } from "@/lib/crypto";

export type CredentialResult =
  | { ok: true; user: { id: string; email: string; name: string; role: string } }
  | { ok: false; reason: "invalid" | "totp_required" | "totp_invalid" };

export async function verifyUserCredentials(input: {
  email: string;
  password: string;
  totp?: string;
}): Promise<CredentialResult> {
  const user = await db.user.findUnique({ where: { email: input.email } });
  if (!user) return { ok: false, reason: "invalid" };

  const valid = await verify(user.passwordHash, input.password);
  if (!valid) return { ok: false, reason: "invalid" };

  // 2FA açıksa TOTP zorunlu (web ile birebir aynı yaptırım).
  if (user.twoFactorEnabled) {
    const secret = decryptField(user.twoFactorSecret);
    const token = (input.totp ?? "").replace(/\s/g, "");
    if (!secret || !token) return { ok: false, reason: "totp_required" };
    const result = await verifyTotp({ secret, token });
    if (!result.valid) return { ok: false, reason: "totp_invalid" };
  }

  return {
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  };
}
