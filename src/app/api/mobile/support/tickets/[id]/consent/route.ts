// POST   /api/mobile/support/tickets/[id]/consent — süreli veri erişim izni ver.
// DELETE /api/mobile/support/tickets/[id]/consent — izni iptal et.
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import { grantConsentForUser, revokeConsentForUser } from "@/lib/support-core";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");
  const { id } = await params;

  let body: { hours?: unknown; scopes?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_request", "Geçersiz istek gövdesi.");
  }

  const hours = typeof body.hours === "number" ? body.hours : 24;
  const scopes = Array.isArray(body.scopes)
    ? body.scopes.filter((s): s is string => typeof s === "string")
    : [];

  const result = await grantConsentForUser(auth.userId, id, { hours, scopes });
  return result.ok
    ? NextResponse.json(result, { status: 201 })
    : apiError(400, "bad_request", result.error);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");
  const { id } = await params;
  const result = await revokeConsentForUser(auth.userId, id);
  return result.ok
    ? NextResponse.json(result)
    : apiError(400, "bad_request", result.error);
}
