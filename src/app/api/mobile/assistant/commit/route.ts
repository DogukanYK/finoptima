// POST /api/mobile/assistant/commit — asistanın önerdiği işlemi onayla/kaydet.
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import { commitAssistantActionForUser } from "@/lib/assistant-core";
import type { ProposedAction } from "@/lib/assistant-types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  let body: { action?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_request", "Geçersiz istek gövdesi.");
  }

  const a = body.action as Partial<ProposedAction> | undefined;
  if (!a || a.type !== "transaction" || typeof a.amount !== "number") {
    return apiError(400, "bad_request", "Geçersiz işlem.");
  }

  const action: ProposedAction = {
    type: "transaction",
    kind: a.kind === "INCOME" ? "INCOME" : "EXPENSE",
    amount: a.amount,
    description: String(a.description ?? ""),
    category: typeof a.category === "string" ? a.category : null,
    date: typeof a.date === "string" ? a.date : "",
    note: typeof a.note === "string" ? a.note : null,
  };

  const result = await commitAssistantActionForUser(auth.userId, action);
  return NextResponse.json(result);
}
