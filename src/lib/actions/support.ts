"use server";

// Kullanıcı tarafı destek action'ları — ince sarmalayıcılar; iş mantığı
// support-core.ts'te (mobil API ile paylaşılır).

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth-helpers";
import {
  createTicketForUser,
  addMessageForUser,
  closeTicketForUser,
  grantConsentForUser,
  revokeConsentForUser,
  askSupportAIForUser,
  escalateSupportChatForUser,
  type SupportOpResult,
  type SupportAIResponse,
} from "@/lib/support-core";
import type { AssistantMessage } from "@/lib/assistant-types";

function revalidateSupport(ticketId?: string) {
  revalidatePath("/destek");
  if (ticketId) revalidatePath(`/destek/${ticketId}`);
}

export async function createSupportTicket(input: {
  subject: string;
  category?: string;
  body: string;
}): Promise<SupportOpResult> {
  const userId = await requireUserId();
  const result = await createTicketForUser(userId, input);
  if (result.ok) revalidateSupport();
  return result;
}

export async function sendSupportMessage(
  ticketId: string,
  body: string,
): Promise<SupportOpResult> {
  const userId = await requireUserId();
  const result = await addMessageForUser(userId, ticketId, body);
  if (result.ok) revalidateSupport(ticketId);
  return result;
}

export async function closeSupportTicket(ticketId: string): Promise<SupportOpResult> {
  const userId = await requireUserId();
  const result = await closeTicketForUser(userId, ticketId);
  if (result.ok) revalidateSupport(ticketId);
  return result;
}

export async function grantSupportConsent(
  ticketId: string,
  input: { hours: number; scopes: string[] },
): Promise<SupportOpResult> {
  const userId = await requireUserId();
  const result = await grantConsentForUser(userId, ticketId, input);
  if (result.ok) revalidateSupport(ticketId);
  return result;
}

export async function revokeSupportConsent(ticketId: string): Promise<SupportOpResult> {
  const userId = await requireUserId();
  const result = await revokeConsentForUser(userId, ticketId);
  if (result.ok) revalidateSupport(ticketId);
  return result;
}

export async function askSupportAI(
  history: AssistantMessage[],
  text: string,
): Promise<SupportAIResponse> {
  const userId = await requireUserId();
  return askSupportAIForUser(userId, history, text);
}

export async function escalateSupportChat(input: {
  transcript: AssistantMessage[];
  subject: string;
  category?: string;
  summary?: string;
}): Promise<SupportOpResult> {
  const userId = await requireUserId();
  const result = await escalateSupportChatForUser(userId, input);
  if (result.ok) revalidateSupport();
  return result;
}
