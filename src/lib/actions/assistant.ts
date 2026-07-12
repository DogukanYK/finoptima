"use server";

import { requireUserId } from "@/lib/auth-helpers";
import {
  askAssistantForUser,
  commitAssistantActionForUser,
} from "@/lib/assistant-core";
import type {
  AssistantMessage,
  AssistantResult,
  ProposedAction,
  CommitResult,
} from "@/lib/assistant-types";

// Web (cookie oturumu) sarmalayıcıları — çekirdek mantık assistant-core'da.
export async function askAssistant(
  history: AssistantMessage[],
  text: string,
): Promise<AssistantResult> {
  const userId = await requireUserId();
  return askAssistantForUser(userId, history, text);
}

export async function commitAssistantAction(
  action: ProposedAction,
): Promise<CommitResult> {
  const userId = await requireUserId();
  return commitAssistantActionForUser(userId, action);
}
