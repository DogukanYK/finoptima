// GET /api/support/tickets/[id]/messages?after=<ISO> — web polling hedefi.
// Oturum (cookie) doğrulamalı; yalnız talep sahibinin yeni mesajlarını döndürür.
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTicketForUser } from "@/lib/support-core";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Oturum gerekli." } },
      { status: 401 },
    );
  }
  const { id } = await params;

  const rl = await rateLimit(`support:poll:${session.user.id}`, 30, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Çok sık yenileme." } },
      { status: 429 },
    );
  }

  const after = req.nextUrl.searchParams.get("after") ?? undefined;
  const ticket = await getTicketForUser(session.user.id, id, { after });
  if (!ticket) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Talep bulunamadı." } },
      { status: 404 },
    );
  }
  return NextResponse.json(ticket);
}
