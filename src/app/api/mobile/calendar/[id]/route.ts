// PATCH  /api/mobile/calendar/[id] — ödendi işaretini değiştir (IDOR korumalı).
// DELETE /api/mobile/calendar/[id] — etkinliği sil.
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate, apiError } from "@/lib/mobile/guard";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");
  const { id } = await params;

  const event = await db.calendarEvent.findFirst({
    where: { id, userId: auth.userId },
    select: { isPaid: true },
  });
  if (!event) return apiError(404, "not_found", "Etkinlik bulunamadı.");

  await db.calendarEvent.updateMany({
    where: { id, userId: auth.userId },
    data: { isPaid: !event.isPaid },
  });
  return NextResponse.json({ ok: true, isPaid: !event.isPaid });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");
  const { id } = await params;

  await db.calendarEvent.deleteMany({ where: { id, userId: auth.userId } });
  return NextResponse.json({ ok: true });
}
