// Mobil login brute-force koruması. İki katman:
// 1) Burst limiter (rate-limit.ts; Upstash varsa dağıtık, yoksa bellek-içi/instance).
// 2) AuditLog tabanlı 15dk sayaç — Upstash OLMASA DA serverless örnekler arası
//    çalışır (kalıcı DB üzerinden). IP başına ve e-posta başına ayrı eşik.
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const WINDOW_MS = 15 * 60 * 1000;
const IP_MAX = 10; // 15dk'da bir IP'den azami başarısız
const EMAIL_MAX = 5; // 15dk'da bir e-postaya azami başarısız (dönen-IP saldırısı)
const LOCK_SECONDS = 15 * 60;

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function checkLoginRate(
  ip: string,
  email: string,
): Promise<{ blocked: boolean; retryAfter: number }> {
  // 1) Ani patlama.
  const burst = await rateLimit(`mlogin:${ip}`, 10, 60_000);
  if (!burst.ok) return { blocked: true, retryAfter: burst.retryAfter };

  // 2) DB sayacı — son 15dk'daki başarısız denemeler.
  const since = new Date(Date.now() - WINDOW_MS);
  const [ipFails, emailFails] = await Promise.all([
    db.auditLog.count({
      where: { action: "mobile_login.failed", ip, createdAt: { gte: since } },
    }),
    db.auditLog.count({
      where: {
        action: "mobile_login.failed",
        createdAt: { gte: since },
        metadata: { path: ["email"], equals: email },
      },
    }),
  ]);
  if (ipFails >= IP_MAX || emailFails >= EMAIL_MAX) {
    return { blocked: true, retryAfter: LOCK_SECONDS };
  }
  return { blocked: false, retryAfter: 0 };
}
