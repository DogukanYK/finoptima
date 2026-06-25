// Hız sınırlayıcı (brute-force koruması).
// Upstash Redis varsa dağıtık (serverless örnekler arası paylaşılır);
// yoksa bellek içine düşer (yerel geliştirme).

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult = { ok: boolean; retryAfter: number };

/* ---------- Bellek içi yedek ---------- */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

/* ---------- Upstash (dağıtık) ---------- */

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "akca-rl",
      analytics: false,
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Bir anahtar için hız sınırı uygular.
 * @param key   benzersiz anahtar (genelde "prefix:ip")
 * @param limit pencere içindeki azami istek sayısı
 * @param windowMs pencere süresi (ms)
 */
export async function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  if (!redis) return memoryLimit(key, limit, windowMs);
  try {
    const res = await getLimiter(limit, windowMs).limit(key);
    return {
      ok: res.success,
      retryAfter: res.success
        ? 0
        : Math.max(1, Math.ceil((res.reset - Date.now()) / 1000)),
    };
  } catch {
    // Upstash erişilemezse uygulamayı kilitleme — bellek içine düş.
    return memoryLimit(key, limit, windowMs);
  }
}
