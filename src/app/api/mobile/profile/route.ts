// GET/PATCH /api/mobile/profile — kullanıcı profili + AI profil tanımı (Bearer korumalı).
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate, apiError } from "@/lib/mobile/guard";
import { getOrCreateFinanceProfile } from "@/lib/queries";
import { encryptField } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  const [user, profile] = await Promise.all([
    db.user.findUnique({
      where: { id: auth.userId },
      select: {
        email: true,
        name: true,
        role: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    }),
    getOrCreateFinanceProfile(auth.userId),
  ]);
  if (!user) return apiError(404, "not_found", "Hesap bulunamadı.");

  return NextResponse.json({
    name: user.name,
    email: user.email,
    role: user.role,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt.toISOString(),
    aiIdentity: profile.aiIdentityText ?? "",
    profession: profile.profession ?? "",
    incomeRange: profile.incomeRange ?? "",
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  let body: { name?: unknown; aiIdentity?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_request", "Geçersiz istek gövdesi.");
  }

  if (typeof body.name === "string") {
    const name = body.name.trim().slice(0, 80);
    if (name.length >= 2) {
      await db.user.update({ where: { id: auth.userId }, data: { name } });
    }
  }

  if (typeof body.aiIdentity === "string") {
    const encrypted = encryptField(body.aiIdentity.trim().slice(0, 1500) || null);
    await db.financeProfile.upsert({
      where: { userId: auth.userId },
      create: { userId: auth.userId, aiIdentityText: encrypted },
      update: { aiIdentityText: encrypted },
    });
  }

  return NextResponse.json({ ok: true });
}
