"use server";

import { revalidatePath } from "next/cache";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-helpers";
import { encryptField, decryptField } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";

export type TwoFactorState = {
  ok?: boolean;
  error?: string;
  qr?: string; // data URL — kurulum QR kodu
};

function clean(code: string): string {
  return (code ?? "").replace(/\s/g, "");
}

// 2FA kurulumunu başlatır: gizli anahtar üretir, QR kodu döndürür.
export async function start2FA(): Promise<TwoFactorState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const secret = generateSecret();
  await db.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: encryptField(secret), twoFactorEnabled: false },
  });

  const otpauth = generateURI({ issuer: "FinOptima", label: user.email, secret });
  const qr = await QRCode.toDataURL(otpauth);
  return { ok: true, qr };
}

// Kullanıcının girdiği kodu doğrular ve 2FA'yı etkinleştirir.
export async function confirm2FA(code: string): Promise<TwoFactorState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Oturum bulunamadı." };

  const secret = decryptField(user.twoFactorSecret);
  if (!secret) return { error: "Önce kurulumu başlat." };
  const result = await verify({ secret, token: clean(code) });
  if (!result.valid) {
    return { error: "Kod doğrulanamadı. Authenticator uygulamandaki kodu gir." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });
  await logAudit({ userId: user.id, action: "2fa.enable" });
  revalidatePath("/settings");
  return { ok: true };
}

// 2FA'yı devre dışı bırakır (geçerli bir kod gerekir).
export async function disable2FA(code: string): Promise<TwoFactorState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Oturum bulunamadı." };

  if (user.twoFactorEnabled) {
    const secret = decryptField(user.twoFactorSecret);
    const result = secret
      ? await verify({ secret, token: clean(code) })
      : { valid: false };
    if (!result.valid) {
      return { error: "Kod doğrulanamadı." };
    }
  }

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
  await logAudit({ userId: user.id, action: "2fa.disable" });
  revalidatePath("/settings");
  return { ok: true };
}
