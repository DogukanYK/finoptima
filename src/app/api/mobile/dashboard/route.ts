// GET /api/mobile/dashboard — ana ekran özeti (bu ay gelir/gider/net, bakiye,
// son işlemler, kategori dağılımı, 6 aylık trend, yaklaşan ödemeler).
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import { getDashboard } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  const data = await getDashboard(auth.userId); // zaten temiz serialize
  return NextResponse.json(data);
}
