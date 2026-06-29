// GET /api/mobile/me — oturumdaki kullanıcının profili (Bearer korumalı).
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate, apiError } from "@/lib/mobile/guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  const user = await db.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
  });
  if (!user) return apiError(404, "not_found", "Hesap bulunamadı.");

  return NextResponse.json({
    user: { ...user, createdAt: user.createdAt.toISOString() },
  });
}
