// Native iOS istemcisi için Bearer JWT üretimi/doğrulaması (stateless).
// Web tarafı NextAuth çerez-oturumu kullanır; mobil bundan bağımsız.
// İmza anahtarı: AUTH_SECRET (mevcut güçlü sır). HS256.
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-me",
);
const ISSUER = "finoptima";
const AUDIENCE = "finoptima-mobile";

// Banka app'i: kısa ömürlü access + uzun ömürlü refresh.
export const ACCESS_TTL_SECONDS = 15 * 60; // 15 dk
const ACCESS_TTL = "15m";
const REFRESH_TTL = "14d";

type Typ = "access" | "refresh";

export type TokenClaims = { userId: string; role: string; loginAt: number };
export type MobileClaims = JWTPayload & { role?: string; typ?: Typ; loginAt?: number };

function sign(typ: Typ, ttl: string, c: TokenClaims): Promise<string> {
  return new SignJWT({ role: c.role, typ, loginAt: c.loginAt })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(c.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secret);
}

export function signAccessToken(c: TokenClaims): Promise<string> {
  return sign("access", ACCESS_TTL, c);
}

export function signRefreshToken(c: TokenClaims): Promise<string> {
  return sign("refresh", REFRESH_TTL, c);
}

// Doğrular + token tipini (access/refresh) zorunlu kılar. Geçersizse fırlatır.
export async function verifyMobileToken(
  token: string,
  expected: Typ,
): Promise<MobileClaims> {
  const { payload } = await jwtVerify(token, secret, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  if ((payload as MobileClaims).typ !== expected) {
    throw new Error("wrong_token_type");
  }
  return payload as MobileClaims;
}
