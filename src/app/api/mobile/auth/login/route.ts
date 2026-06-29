// POST /api/mobile/auth/login — native istemci girişi.
// Gövde: { email, password, totp? } → { accessToken, refreshToken, user }
import { type NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { verifyUserCredentials } from "@/lib/mobile/credentials";
import {
  signAccessToken,
  signRefreshToken,
  ACCESS_TTL_SECONDS,
} from "@/lib/mobile/tokens";
import { apiError } from "@/lib/mobile/guard";

export const runtime = "nodejs"; // argon2 native modülü + Prisma → Edge'de çalışmaz

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_json", "Geçersiz istek gövdesi.");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(400, "validation", "E-posta ve şifre gerekli.");
  }

  const result = await verifyUserCredentials(parsed.data);
  if (!result.ok) {
    if (result.reason === "totp_required")
      return apiError(401, "totp_required", "İki adımlı doğrulama kodu gerekli.");
    if (result.reason === "totp_invalid")
      return apiError(401, "totp_invalid", "Doğrulama kodu hatalı.");
    return apiError(401, "invalid_credentials", "E-posta veya şifre hatalı.");
  }

  const loginAt = Date.now();
  const claims = { userId: result.user.id, role: result.user.role, loginAt };
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(claims),
    signRefreshToken(claims),
  ]);

  return NextResponse.json({
    tokenType: "Bearer",
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TTL_SECONDS,
    user: result.user,
  });
}
