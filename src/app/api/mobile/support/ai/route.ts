// POST /api/mobile/support/ai — AI destek asistanına sor (ön-yanıt/deflection).
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import { askSupportAIForUser } from "@/lib/support-core";
import type { AssistantMessage } from "@/lib/assistant-types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  let body: { history?: unknown; text?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_request", "Geçersiz istek gövdesi.");
  }

  const text = typeof body.text === "string" ? body.text : "";
  const history: AssistantMessage[] = Array.isArray(body.history)
    ? body.history
        .filter(
          (m): m is { role: string; content: string } =>
            !!m &&
            typeof (m as { content?: unknown }).content === "string" &&
            ((m as { role?: unknown }).role === "user" ||
              (m as { role?: unknown }).role === "assistant"),
        )
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
        .slice(-10)
    : [];

  const result = await askSupportAIForUser(auth.userId, history, text);
  if (!result.ok) return apiError(400, "bad_request", result.error);
  return NextResponse.json(result);
}
