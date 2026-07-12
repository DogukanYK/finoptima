// GET  /api/mobile/calendar — yaklaşan + son etkinlikler (hatırlatma/fatura).
// POST /api/mobile/calendar — yeni etkinlik oluştur.
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate, apiError } from "@/lib/mobile/guard";
import { dateFromInput } from "@/lib/format";

export const runtime = "nodejs";

const TYPES = new Set(["REMINDER", "BILL", "EVENT"]);

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const to = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());

  const events = await db.calendarEvent.findMany({
    where: { userId: auth.userId, date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      date: true,
      time: true,
      type: true,
      amount: true,
      note: true,
      isPaid: true,
    },
  });

  return NextResponse.json({
    events: events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString(),
      time: e.time,
      type: e.type,
      amount: e.amount != null ? Number(e.amount) : null,
      note: e.note,
      isPaid: e.isPaid,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  let body: { title?: unknown; date?: unknown; type?: unknown; amount?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_request", "Geçersiz istek gövdesi.");
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  const dateStr = typeof body.date === "string" ? body.date : "";
  const type = (
    typeof body.type === "string" && TYPES.has(body.type) ? body.type : "REMINDER"
  ) as "REMINDER" | "BILL" | "EVENT";
  if (title.length < 1 || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return apiError(400, "bad_request", "Başlık ve geçerli tarih gerekli.");
  }
  const amount =
    typeof body.amount === "number" && Number.isFinite(body.amount) && body.amount > 0
      ? body.amount
      : null;

  const created = await db.calendarEvent.create({
    data: {
      userId: auth.userId,
      title,
      date: dateFromInput(dateStr),
      type,
      amount,
      note: typeof body.note === "string" ? body.note.slice(0, 500) : null,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id });
}
