"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { categorize } from "@/lib/categorize";
import { dateFromInput, toDateKey } from "@/lib/format";
import { makeDedupHash } from "@/lib/dedup";
import { getDashboard, getOrCreateFinanceProfile } from "@/lib/queries";
import { runAssistant, type AssistantContext } from "@/lib/ai/assistant";
import type {
  AssistantMessage,
  AssistantResult,
  ProposedAction,
  CommitResult,
} from "@/lib/assistant-types";

// Türkçe karakter katlama (categorize.ts'teki normalize ile aynı taban) —
// AI'nın önerdiği kategori adını kullanıcının kategorisiyle eşlemek için.
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

// Kullanıcının mesajına yanıt üretir: doğal dil cevabı + önerilen işlemler.
// Bağlamı (finansal özet, kategoriler, son işlemler) sunucuda toplar; hiçbir
// hassas veri veya API anahtarı istemciye gitmez.
export async function askAssistant(
  history: AssistantMessage[],
  text: string,
): Promise<AssistantResult> {
  const userId = await requireUserId();
  const trimmed = String(text ?? "").trim().slice(0, 1000);
  if (!trimmed) {
    return { reply: "Bir şey yazmadın 🙂", actions: [], navigate: null };
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

// Onaylanan bir öneriyi gerçek işleme çevirir. Sunucu OTORİTESİ: tutarı doğrular,
// kategoriyi yeniden çözer (isim eşleme → kural motoru), dedupHash yazar —
// createTransaction ile aynı kurallar. İstemciden gelen kategori adına körü
// körüne güvenmez.
export async function commitAssistantAction(
  action: ProposedAction,
): Promise<CommitResult> {
  const userId = await requireUserId();

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

  // Kategori çözümü: (1) AI'nın önerdiği ada birebir eşleşme, (2) kural motoru.
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
    created: {
      kind,
      amount,
      description,
      date: toDateKey(date),
      categoryName,
    },
  };
}
