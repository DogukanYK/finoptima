"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { eventSchema } from "@/lib/validation";
import { parseAmount, dateFromInput } from "@/lib/format";

export type EventActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function revalidate() {
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function createEvent(
  _prev: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const userId = await requireUserId();

  const rawAmount = String(formData.get("amount") ?? "").trim();
  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    time: formData.get("time") || undefined,
    type: formData.get("type"),
    amount: rawAmount ? parseAmount(rawAmount) : undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const data = parsed.data;
  await db.calendarEvent.create({
    data: {
      userId,
      title: data.title,
      date: dateFromInput(data.date),
      time: data.time || null,
      type: data.type,
      amount: data.amount != null && !Number.isNaN(data.amount) ? data.amount : null,
      note: data.note || null,
    },
  });

  revalidate();
  return { ok: true };
}

export async function deleteEvent(id: string): Promise<void> {
  const userId = await requireUserId();
  await db.calendarEvent.deleteMany({ where: { id, userId } });
  revalidate();
}

export async function toggleEventPaid(id: string): Promise<void> {
  const userId = await requireUserId();
  const event = await db.calendarEvent.findFirst({ where: { id, userId } });
  if (!event) return;
  // userId'yi where'e gömerek IDOR'a karşı derinlemesine savunma.
  await db.calendarEvent.updateMany({
    where: { id, userId },
    data: { isPaid: !event.isPaid },
  });
  revalidate();
}
