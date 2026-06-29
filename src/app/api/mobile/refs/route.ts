// GET /api/mobile/refs — işlem ekleme formu için kategoriler + hesaplar.
// Yalnız güvenli görüntü alanları (IBAN/bakiye gibi hassas alanlar gönderilmez).
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate, apiError } from "@/lib/mobile/guard";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  const [categories, accounts] = await Promise.all([
    db.category.findMany({
      where: { userId: auth.userId },
      orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, icon: true, color: true, kind: true },
    }),
    db.account.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        label: true,
        bankName: true,
        type: true,
        cardLast4: true,
      },
    }),
  ]);

  return NextResponse.json({ categories, accounts });
}
