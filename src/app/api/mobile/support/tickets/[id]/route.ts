// GET  /api/mobile/support/tickets/[id] — talep + mesajlar (?after= polling).
// POST /api/mobile/support/tickets/[id] — mesaj gönder.
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import { getTicketForUser, addMessageForUser } from "@/lib/support-core";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");
  const { id } = await params;

  // Polling koruması.
  const rl = await rateLimit(`support:poll:${auth.userId}`, 30, 60 * 1000);
  if (!rl.ok) return apiError(429, "rate_limited", "Çok sık yenileme.");

  const after = req.nextUrl.searchParams.get("after") ?? undefined;
  const ticket = await getTicketForUser(auth.userId, id, { after });
  if (!ticket) return apiError(404, "not_found", "Talep bulunamadı.");
  return NextResponse.json(ticket);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");
  const { id } = await params;

  let body: { body?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_request", "Geçersiz istek gövdesi.");
  }
  const text = typeof body.body === "string" ? body.body : "";
  const result = await addMessageForUser(auth.userId, id, text);
  return result.ok
    ? NextResponse.json(result, { status: 201 })
    : apiError(400, "bad_request", result.error);
}
