// GET /api/mobile/debts — borç listesi + toplamlar (Bearer korumalı).
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import { getDebts } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  const items = await getDebts(auth.userId); // PlainDebt[] — temiz serialize
  const totalBalance = items.reduce((s, d) => s + d.balance, 0);

  return NextResponse.json({
    items,
    totals: { count: items.length, totalBalance },
  });
}
