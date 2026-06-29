// POST /api/mobile/auth/refresh — access token yenileme.
// Gövde: { refreshToken } → { accessToken, refreshToken }
// "Tüm cihazlardan çıkış" (sessionsValidFrom) web ile aynı şekilde uygulanır.
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyMobileToken,
  signAccessToken,
  signRefreshToken,
  ACCESS_TTL_SECONDS,
} from "@/lib/mobile/tokens";
import { apiError } from "@/lib/mobile/guard";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { refreshToken?: string };
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_json", "Geçersiz istek gövdesi.");
  }
  if (!body?.refreshToken) {
    return apiError(400, "validation", "refreshToken gerekli.");
  }

  let claims;
  try {
    claims = await verifyMobileToken(body.refreshToken, "refresh");
  } catch {
    return apiError(401, "invalid_token", "Geçersiz veya süresi dolmuş oturum.");
  }

  const userId = claims.sub as string;
  const loginAt = (claims.loginAt as number) ?? 0;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, sessionsValidFrom: true },
  });
  if (!user) return apiError(401, "user_gone", "Hesap bulunamadı.");
  if (user.sessionsValidFrom && loginAt < user.sessionsValidFrom.getTime()) {
    return apiError(401, "session_revoked", "Oturum sonlandırılmış. Tekrar giriş yapın.");
  }

  const next = { userId: user.id, role: user.role, loginAt };
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(next),
    signRefreshToken(next),
  ]);

  return NextResponse.json({
    tokenType: "Bearer",
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TTL_SECONDS,
  });
}
