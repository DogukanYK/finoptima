// GET  /api/mobile/support/tickets — kullanıcının talepleri.
// POST /api/mobile/support/tickets — yeni talep (opsiyonel AI transcript ile eskalasyon).
import { type NextRequest, NextResponse } from "next/server";
import { authenticate, apiError } from "@/lib/mobile/guard";
import {
  listTicketsForUser,
  createTicketForUser,
  escalateSupportChatForUser,
} from "@/lib/support-core";
import type { AssistantMessage } from "@/lib/assistant-types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");
  const tickets = await listTicketsForUser(auth.userId);
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  let body: {
    subject?: unknown;
    category?: unknown;
    body?: unknown;
    transcript?: unknown;
    summary?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_request", "Geçersiz istek gövdesi.");
  }

  const subject = typeof body.subject === "string" ? body.subject : "";
  const category = typeof body.category === "string" ? body.category : undefined;

  // AI sohbet eskalasyonu: transcript verilmişse o yoldan.
  if (Array.isArray(body.transcript)) {
    const transcript: AssistantMessage[] = body.transcript
      .filter(
        (m): m is { role: string; content: string } =>
          !!m &&
          typeof (m as { content?: unknown }).content === "string" &&
          ((m as { role?: unknown }).role === "user" ||
            (m as { role?: unknown }).role === "assistant"),
      )
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    const result = await escalateSupportChatForUser(auth.userId, {
      transcript,
      subject,
      category,
      summary: typeof body.summary === "string" ? body.summary : undefined,
    });
    return result.ok
      ? NextResponse.json(result, { status: 201 })
      : apiError(400, "bad_request", result.error);
  }

  const text = typeof body.body === "string" ? body.body : "";
  const result = await createTicketForUser(auth.userId, {
    subject,
    category,
    body: text,
  });
  return result.ok
    ? NextResponse.json(result, { status: 201 })
    : apiError(400, "bad_request", result.error);
}
