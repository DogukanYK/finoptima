// GET /api/mobile/dashboard — ana ekran özeti (bu ay gelir/gider/net, bakiye,
// son işlemler, kategori dağılımı, 6 aylık trend, yaklaşan ödemeler) +
// Findeks skoru özeti + AI koç önceliği (native panelin zengin görünümü için).
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import {
  getDashboard,
  getFindeksSignals,
  getLatestFindeksReport,
  getCoachPlan,
} from "@/lib/queries";
import { computeFindeks } from "@/lib/findeks";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  const [data, signals, report, coach] = await Promise.all([
    getDashboard(auth.userId),
    getFindeksSignals(auth.userId),
    getLatestFindeksReport(auth.userId),
    getCoachPlan(auth.userId),
  ]);

  const estimated = computeFindeks(signals);
  const findeks = {
    score: report ? report.score : estimated.estimatedScore,
    band: report ? report.band : estimated.band,
    healthScore: estimated.healthScore,
    hasReport: Boolean(report),
  };

  const step = coach?.plan.steps?.[0] ?? null;
  const topCoach = step
    ? { title: step.title, action: step.action, priority: step.priority }
    : null;

  return NextResponse.json({ ...data, findeks, topCoach });
}
