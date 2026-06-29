// Mobil API yardımcıları: standart JSON hata + Bearer doğrulama.
import { type NextRequest, NextResponse } from "next/server";
import { verifyMobileToken } from "./tokens";

export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export type AuthedUser = { userId: string; role: string; loginAt: number };

// Authorization: Bearer <accessToken> doğrular. Geçerliyse kullanıcı, değilse null.
export async function authenticate(req: NextRequest): Promise<AuthedUser | null> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    const claims = await verifyMobileToken(match[1], "access");
    if (!claims.sub) return null;
    return {
      userId: claims.sub,
      role: (claims.role as string) ?? "USER",
      loginAt: (claims.loginAt as number) ?? 0,
    };
  } catch {
    return null;
  }
}
