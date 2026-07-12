// GET /api/mobile/findeks — kredi sağlığı özeti (Bearer korumalı).
// Resmî rapor varsa onu, yoksa harcama davranışından tahmini skoru döndürür.
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import {
  getFindeksSignals,
  getLatestFindeksReport,
  getCoachPlan,
} from "@/lib/queries";
import { computeFindeks } from "@/lib/findeks";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  const [signals, report, coach] = await Promise.all([
    getFindeksSignals(auth.userId),
    getLatestFindeksReport(auth.userId),
    getCoachPlan(auth.userId),
  ]);
  const estimated = computeFindeks(signals);

  return NextResponse.json({
    hasReport: Boolean(report),
    score: report ? report.score : estimated.estimatedScore,
    band: report ? report.band : estimated.band,
    reportDate: report ? report.reportDate : null,
    estimated, // { estimatedScore, healthScore, band, factors[], advice[] }
    report, // resmî rapor (varsa) — temiz serialize
    coach, // { plan: { summary, steps[] }, generatedAt } | null (AI koç planı)
  });
}
