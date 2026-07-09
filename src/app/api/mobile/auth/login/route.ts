// POST /api/mobile/auth/login — native istemci girişi.
// Gövde: { email, password, totp? } → { accessToken, refreshToken, user }
// Brute-force koruması: burst limiter + AuditLog tabanlı 15dk IP/e-posta sayacı.
import { type NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { verifyUserCredentials } from "@/lib/mobile/credentials";
import {
  signAccessToken,
  signRefreshToken,
  ACCESS_TTL_SECONDS,
} from "@/lib/mobile/tokens";
import { apiError } from "@/lib/mobile/guard";
import { checkLoginRate, clientIp } from "@/lib/mobile/loginGuard";
import { logAudit } from "@/lib/audit";

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

  const ip = clientIp(req);
  const email = parsed.data.email;

  const rate = await checkLoginRate(ip, email);
  if (rate.blocked) {
    await logAudit({ action: "mobile_login.blocked", metadata: { email, ip } });
    return NextResponse.json(
      {
        error: {
          code: "rate_limited",
          message: "Çok fazla deneme. 15 dakika sonra tekrar deneyin.",
        },
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  const result = await verifyUserCredentials(parsed.data);
  if (!result.ok) {
    await logAudit({ action: "mobile_login.failed", metadata: { email } });
    if (result.reason === "totp_required")
      return apiError(401, "totp_required", "İki adımlı doğrulama kodu gerekli.");
    if (result.reason === "totp_invalid")
      return apiError(401, "totp_invalid", "Doğrulama kodu hatalı.");
    return apiError(401, "invalid_credentials", "E-posta veya şifre hatalı.");
  }

  await logAudit({
    userId: result.user.id,
    action: "mobile_login.success",
    metadata: { email },
  });

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
