// GET  /api/mobile/transactions — liste (keyset sayfalama) + toplamlar
//      ?kind=&categoryId=&month=YYYY-MM&search=&cursor=
// POST /api/mobile/transactions — yeni işlem (JSON). Web ile aynı mantık:
//      validate → (kategori yoksa) otomatik kategorize → create source=MANUAL.
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticate, apiError } from "@/lib/mobile/guard";
import {
  getTransactions,
  getTransactionTotals,
  type TransactionFilters,
  type TxKind,
} from "@/lib/queries";
import { transactionSchema } from "@/lib/validation";
import { categorize } from "@/lib/categorize";
import { dateFromInput } from "@/lib/format";

export const runtime = "nodejs";

function readFilters(url: URL): TransactionFilters {
  const f: TransactionFilters = {};
  const kind = url.searchParams.get("kind");
  if (kind === "INCOME" || kind === "EXPENSE" || kind === "TRANSFER") {
    f.kind = kind as TxKind;
  }
  const categoryId = url.searchParams.get("categoryId");
  if (categoryId) f.categoryId = categoryId;
  const month = url.searchParams.get("month");
  if (month) f.month = month;
  const search = url.searchParams.get("search");
  if (search) f.search = search;
  return f;
}

export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  const url = new URL(req.url);
  const filters = readFilters(url);
  const cursor = url.searchParams.get("cursor") ?? undefined;

  const [page, totals] = await Promise.all([
    getTransactions(auth.userId, filters, cursor),
    getTransactionTotals(auth.userId, filters),
  ]);

  return NextResponse.json({
    items: page.items,
    nextCursor: page.nextCursor,
    totals, // { income, expense }
  });
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req);
  if (!auth) return apiError(401, "unauthorized", "Geçerli bir oturum gerekli.");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "bad_json", "Geçersiz istek gövdesi.");
  }

  const parsed = transactionSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return NextResponse.json(
      { error: { code: "validation", message: "Form hatalı.", fieldErrors } },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Sahiplik doğrulaması — başka kullanıcının kategori/hesabına işlem atılamasın.
  if (data.categoryId) {
    const owned = await db.category.findFirst({
      where: { id: data.categoryId, userId: auth.userId },
      select: { id: true },
    });
    if (!owned) return apiError(400, "invalid_category", "Kategori bulunamadı.");
  }
  if (data.accountId) {
    const owned = await db.account.findFirst({
      where: { id: data.accountId, userId: auth.userId },
      select: { id: true },
    });
    if (!owned) return apiError(400, "invalid_account", "Hesap bulunamadı.");
  }

  // Kategori verilmediyse kurallarla otomatik ata (web ile aynı).
  let categoryId = data.categoryId;
  if (!categoryId) {
    const cats = await db.category.findMany({
      where: { userId: auth.userId, kind: data.kind },
      select: { id: true },
    });
    const allowed = new Set(cats.map((c) => c.id));
    const rules = await db.categoryRule.findMany({
      where: { userId: auth.userId, categoryId: { in: [...allowed] } },
      select: { pattern: true, categoryId: true, priority: true },
    });
    categoryId = categorize(data.description, rules) ?? undefined;
  }

  const tx = await db.transaction.create({
    data: {
      userId: auth.userId,
      kind: data.kind,
      amount: data.amount,
      description: data.description,
      date: dateFromInput(data.date),
      categoryId: categoryId ?? null,
      accountId: data.accountId ?? null,
      note: data.note ?? null,
      source: "MANUAL",
    },
    include: { category: true, account: true },
  });

  return NextResponse.json(
    {
      transaction: {
        id: tx.id,
        kind: tx.kind,
        amount: Number(tx.amount),
        date: tx.date.toISOString(),
        description: tx.description,
        note: tx.note,
        source: tx.source,
        category: tx.category
          ? {
              id: tx.category.id,
              name: tx.category.name,
              icon: tx.category.icon,
              color: tx.category.color,
            }
          : null,
        account: tx.account
          ? { id: tx.account.id, label: tx.account.label, bankName: tx.account.bankName }
          : null,
      },
    },
    { status: 201 },
  );
}
