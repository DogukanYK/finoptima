// Asistan çekirdeği — userId parametreli. Hem web server action'ı
// (requireUserId ile sarar) hem mobil API (Bearer userId ile) buradan çağırır.
// Böylece iş mantığı tek yerde.

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { categorize } from "@/lib/categorize";
import { dateFromInput, toDateKey } from "@/lib/format";
import { makeDedupHash } from "@/lib/dedup";
import { rateLimit } from "@/lib/rate-limit";
import { AI_DEMO } from "@/lib/ai/client";
import { getDashboard, getOrCreateFinanceProfile } from "@/lib/queries";
import { runAssistant, type AssistantContext } from "@/lib/ai/assistant";
import type {
  AssistantMessage,
  AssistantResult,
  ProposedAction,
  CommitResult,
} from "@/lib/assistant-types";

function foldTr(text: string): string {
  return text
    .toLowerCase()
    .replace(/i̇/g, "i")
    .replace(/[ıİ]/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

// Kullanıcının mesajına yanıt üretir (bağlamı toplar → runAssistant).
export async function askAssistantForUser(
  userId: string,
  history: AssistantMessage[],
  text: string,
): Promise<AssistantResult> {
  const trimmed = String(text ?? "").trim().slice(0, 1000);
  if (!trimmed) {
    return { reply: "Bir şey yazmadın 🙂", actions: [], navigate: null };
  }

  // Maliyet tavanı: her mesaj bir AI çağrısı. Demo modunda API çağrılmadığı
  // için sınır uygulanmaz (sunum akışı bozulmasın).
  if (!AI_DEMO) {
    const rl = await rateLimit(`assistant:ai:${userId}`, 30, 60 * 60 * 1000);
    if (!rl.ok) {
      return {
        reply:
          "Bu saatlik sohbet limitine ulaştın 🙏 Biraz sonra kaldığımız yerden devam edelim.",
        actions: [],
        navigate: null,
      };
    }
  }

  const [dash, profile, user, cats, accounts, recentTx] = await Promise.all([
    getDashboard(userId),
    getOrCreateFinanceProfile(userId),
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
    db.category.findMany({
      where: { userId },
      select: { name: true, kind: true },
      orderBy: { name: "asc" },
    }),
    db.account.findMany({
      where: { userId },
      select: { label: true, bankName: true },
      orderBy: { createdAt: "asc" },
    }),
    db.transaction.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 20,
      include: { category: true },
    }),
  ]);

  const ctx: AssistantContext = {
    todayISO: toDateKey(new Date()),
    userName: user?.name ?? "Kullanıcı",
    aiIdentity: profile.aiIdentityText ?? null,
    finance: {
      balance: dash.balance,
      monthIncome: dash.income,
      monthExpense: dash.expense,
      monthNet: dash.net,
    },
    categories: cats.map((c) => ({
      name: c.name,
      kind: c.kind as "INCOME" | "EXPENSE",
    })),
    accounts: accounts.map((a) => a.label || a.bankName),
    recent: recentTx.map((t) => ({
      date: toDateKey(new Date(t.date)),
      description: t.description,
      amount: Number(t.amount),
      kind: t.kind,
      category: t.category?.name ?? null,
    })),
  };

  try {
    return await runAssistant(history.slice(-10), trimmed, ctx);
  } catch {
    return {
      reply: "Şu an yanıt veremedim, birazdan tekrar dener misin?",
      actions: [],
      navigate: null,
    };
  }
}

// Onaylanan öneriyi gerçek işleme çevirir (sunucu otoritesi: doğrula + kategori çöz + dedupHash).
export async function commitAssistantActionForUser(
  userId: string,
  action: ProposedAction,
): Promise<CommitResult> {
  if (!action || action.type !== "transaction") {
    return { ok: false, error: "Desteklenmeyen işlem." };
  }
  const amount = Number(action.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Geçersiz tutar." };
  }
  const kind: "INCOME" | "EXPENSE" =
    action.kind === "INCOME" ? "INCOME" : "EXPENSE";
  const description =
    String(action.description ?? "").trim().slice(0, 200) || "İşlem";
  const dateStr =
    action.date && /^\d{4}-\d{2}-\d{2}/.test(action.date)
      ? action.date
      : toDateKey(new Date());
  const date = dateFromInput(dateStr);

  const cats = await db.category.findMany({
    where: { userId },
    select: { id: true, name: true, kind: true },
  });
  let categoryId: string | null = null;

  if (action.category) {
    const want = foldTr(action.category);
    const match =
      cats.find((c) => c.kind === kind && foldTr(c.name) === want) ??
      cats.find((c) => foldTr(c.name) === want);
    categoryId = match?.id ?? null;
  }
  if (!categoryId) {
    const kindCatIds = cats.filter((c) => c.kind === kind).map((c) => c.id);
    if (kindCatIds.length) {
      const rules = await db.categoryRule.findMany({
        where: { userId, categoryId: { in: kindCatIds } },
        select: { pattern: true, categoryId: true, priority: true },
      });
      categoryId = categorize(description, rules);
    }
  }

  await db.transaction.create({
    data: {
      userId,
      kind,
      amount,
      description,
      date,
      categoryId: categoryId ?? null,
      accountId: null,
      note: action.note ?? null,
      source: "MANUAL",
      dedupHash: makeDedupHash(date, amount, description),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/calendar");

  const categoryName = categoryId
    ? (cats.find((c) => c.id === categoryId)?.name ?? null)
    : null;

  return {
    ok: true,
    created: { kind, amount, description, date: toDateKey(date), categoryName },
  };
}
