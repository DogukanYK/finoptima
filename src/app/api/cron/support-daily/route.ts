// Günlük destek hijyeni cron'u (Vercel Cron → 06:00 UTC / 09:00 TR).
// Üç bağımsız işi SIRAYLA çalıştırır: izin süre-doldurma, RESOLVED>7g auto-close,
// yanıtsız talep digest'i. Her iş kendi try/catch'inde (biri patlarsa diğerleri
// çalışmaya devam eder). Güvenlik: CRON_SECRET tanımlıysa Bearer header zorunlu.

import { NextResponse, type NextRequest } from "next/server";
import {
  expireConsents,
  autoCloseResolved,
  unansweredDigest,
} from "@/lib/support/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const expired = await expireConsents();
  const autoClosed = await autoCloseResolved();
  const digestSent = await unansweredDigest();

  return NextResponse.json({ ok: true, expired, autoClosed, digestSent });
}
