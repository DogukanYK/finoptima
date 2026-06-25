import { db } from "@/lib/db";
import { toMonthKey, toDateKey } from "@/lib/format";
import { decryptField } from "@/lib/crypto";

export type TxKind = "INCOME" | "EXPENSE" | "TRANSFER";

export type PlainTransaction = {
  id: string;
  kind: TxKind;
  amount: number;
  date: string;
  description: string;
  note: string | null;
  source: string;
  receiptImageUrl: string | null;
  category: { id: string; name: string; icon: string; color: string } | null;
  account: { id: string; label: string; bankName: string } | null;
};

function num(v: unknown): number {
  return Number(v ?? 0);
}

export async function getCategories(userId: string) {
  return db.category.findMany({
    where: { userId },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getAccounts(userId: string) {
  return db.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRules(userId: string) {
  const rules = await db.categoryRule.findMany({
    where: { userId },
    select: { pattern: true, categoryId: true, priority: true },
  });
  return rules;
}

function monthRange(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start, end };
}

export async function getDashboard(userId: string) {
  const now = new Date();
  const { start: monthStart, end: monthEnd } = monthRange(now);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [monthTx, allAgg, recent, trendTx, upcoming] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      include: { category: true },
    }),
    db.transaction.groupBy({
      by: ["kind"],
      where: { userId },
      _sum: { amount: true },
    }),
    db.transaction.findMany({
      where: { userId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: { category: true, account: true },
    }),
    db.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { kind: true, amount: true, date: true },
    }),
    db.calendarEvent.findMany({
      where: {
        userId,
        date: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        isPaid: false,
      },
      orderBy: { date: "asc" },
      take: 5,
    }),
  ]);

  let income = 0;
  let expense = 0;
  for (const t of monthTx) {
    if (t.kind === "INCOME") income += num(t.amount);
    else if (t.kind === "EXPENSE") expense += num(t.amount);
  }

  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of allAgg) {
    if (row.kind === "INCOME") totalIncome = num(row._sum.amount);
    else if (row.kind === "EXPENSE") totalExpense = num(row._sum.amount);
  }

  // kategori dağılımı (bu ay, gider)
  const catMap = new Map<
    string,
    { name: string; color: string; icon: string; total: number }
  >();
  for (const t of monthTx) {
    if (t.kind !== "EXPENSE") continue;
    const key = t.category?.id ?? "uncat";
    const existing = catMap.get(key);
    if (existing) existing.total += num(t.amount);
    else
      catMap.set(key, {
        name: t.category?.name ?? "Kategorisiz",
        color: t.category?.color ?? "#94A3B8",
        icon: t.category?.icon ?? "tag",
        total: num(t.amount),
      });
  }
  const breakdown = [...catMap.values()].sort((a, b) => b.total - a.total);

  // 6 aylık trend
  const trendMap = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendMap.set(toMonthKey(d), { income: 0, expense: 0 });
  }
  for (const t of trendTx) {
    const key = toMonthKey(new Date(t.date));
    const bucket = trendMap.get(key);
    if (!bucket) continue;
    if (t.kind === "INCOME") bucket.income += num(t.amount);
    else if (t.kind === "EXPENSE") bucket.expense += num(t.amount);
  }
  const trend = [...trendMap.entries()].map(([month, v]) => ({
    month,
    income: v.income,
    expense: v.expense,
  }));

  return {
    income,
    expense,
    net: income - expense,
    balance: totalIncome - totalExpense,
    recent: recent.map(plainTx),
    breakdown,
    trend,
    upcoming: upcoming.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString(),
      type: e.type,
      amount: e.amount ? num(e.amount) : null,
    })),
  };
}

function plainTx(t: {
  id: string;
  kind: string;
  amount: unknown;
  date: Date;
  description: string;
  note: string | null;
  source: string;
  receiptImageUrl: string | null;
  category: { id: string; name: string; icon: string; color: string } | null;
  account: { id: string; label: string; bankName: string } | null;
}): PlainTransaction {
  return {
    id: t.id,
    kind: t.kind as TxKind,
    amount: num(t.amount),
    date: t.date.toISOString(),
    description: t.description,
    note: t.note,
    source: t.source,
    receiptImageUrl: t.receiptImageUrl,
    category: t.category
      ? {
          id: t.category.id,
          name: t.category.name,
          icon: t.category.icon,
          color: t.category.color,
        }
      : null,
    account: t.account
      ? { id: t.account.id, label: t.account.label, bankName: t.account.bankName }
      : null,
  };
}

export type TransactionFilters = {
  kind?: TxKind;
  categoryId?: string;
  month?: string; // YYYY-MM
  search?: string;
};

function buildTxWhere(
  userId: string,
  filters: TransactionFilters,
): Record<string, unknown> {
  const where: Record<string, unknown> = { userId };
  if (filters.kind) where.kind = filters.kind;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.search)
    where.description = { contains: filters.search, mode: "insensitive" };
  if (filters.month) {
    const [y, m] = filters.month.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }
  return where;
}

export type TransactionPage = {
  items: PlainTransaction[];
  nextCursor: string | null;
};

// Keyset (cursor) sayfalama — derin sayfalarda sabit maliyet.
export async function getTransactions(
  userId: string,
  filters: TransactionFilters = {},
  cursor?: string,
  limit = 50,
): Promise<TransactionPage> {
  const rows = await db.transaction.findMany({
    where: buildTxWhere(userId, filters),
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: { category: true, account: true },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = (hasMore ? rows.slice(0, limit) : rows).map(plainTx);
  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

// İşlem toplamları — sayfalamadan bağımsız, tüm filtre kümesi üzerinde.
export async function getTransactionTotals(
  userId: string,
  filters: TransactionFilters = {},
) {
  const agg = await db.transaction.groupBy({
    by: ["kind"],
    where: buildTxWhere(userId, filters),
    _sum: { amount: true },
  });
  let income = 0;
  let expense = 0;
  for (const row of agg) {
    if (row.kind === "INCOME") income = num(row._sum.amount);
    else if (row.kind === "EXPENSE") expense = num(row._sum.amount);
  }
  return { income, expense };
}

export async function getReportData(userId: string, month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  const prevStart = new Date(y, m - 2, 1);
  const daysInMonth = new Date(y, m, 0).getDate();

  const [monthTx, prevAgg] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    db.transaction.groupBy({
      by: ["kind"],
      where: { userId, date: { gte: prevStart, lt: start } },
      _sum: { amount: true },
    }),
  ]);

  let income = 0;
  let expense = 0;
  for (const t of monthTx) {
    if (t.kind === "INCOME") income += num(t.amount);
    else if (t.kind === "EXPENSE") expense += num(t.amount);
  }

  let prevIncome = 0;
  let prevExpense = 0;
  for (const row of prevAgg) {
    if (row.kind === "INCOME") prevIncome = num(row._sum.amount);
    else if (row.kind === "EXPENSE") prevExpense = num(row._sum.amount);
  }

  // kategori dağılımı
  const catMap = new Map<
    string,
    { name: string; color: string; icon: string; total: number }
  >();
  for (const t of monthTx) {
    if (t.kind !== "EXPENSE") continue;
    const key = t.category?.id ?? "uncat";
    const existing = catMap.get(key);
    if (existing) existing.total += num(t.amount);
    else
      catMap.set(key, {
        name: t.category?.name ?? "Kategorisiz",
        color: t.category?.color ?? "#94A3B8",
        icon: t.category?.icon ?? "tag",
        total: num(t.amount),
      });
  }
  const breakdown = [...catMap.values()].sort((a, b) => b.total - a.total);

  const topExpenses = monthTx
    .filter((t) => t.kind === "EXPENSE")
    .sort((a, b) => num(b.amount) - num(a.amount))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      description: t.description,
      amount: num(t.amount),
      date: t.date.toISOString(),
      category: t.category
        ? { name: t.category.name, icon: t.category.icon, color: t.category.color }
        : null,
    }));

  return {
    month,
    income,
    expense,
    net: income - expense,
    prevIncome,
    prevExpense,
    savingsRate: income > 0 ? (income - expense) / income : 0,
    dailyAvgExpense: expense / daysInMonth,
    txCount: monthTx.length,
    breakdown,
    topExpenses,
  };
}

// Kullanıcının en güncel Findeks raporu (varsa)
export async function getLatestFindeksReport(userId: string) {
  const report = await db.findeksReport.findFirst({
    where: { userId },
    orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
  });
  if (!report) return null;
  return {
    score: report.score,
    band: report.band,
    reportDate: report.reportDate.toISOString(),
    componentWeights: report.componentWeights as {
      usage: number;
      currentDebt: number;
      payment: number;
      newProducts: number;
    },
    totalLimit: num(report.totalLimit),
    totalDebt: num(report.totalDebt),
    debtRatio: report.debtRatio,
    worstStatus: report.worstStatus,
    cards: report.accounts as {
      status: string;
      limit: number;
      debt: number;
      utilization: number;
      cashAdvance: number;
      restructured: boolean;
      openedAt: string | null;
    }[],
  };
}

// Findeks modülü için finansal sinyaller
export async function getFindeksSignals(userId: string) {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [trendTx, bills] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { kind: true, amount: true, date: true },
    }),
    db.calendarEvent.findMany({
      where: { userId, type: "BILL" },
      select: { isPaid: true, date: true },
    }),
  ]);

  const trendMap = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trendMap.set(toMonthKey(d), { income: 0, expense: 0 });
  }
  for (const t of trendTx) {
    const bucket = trendMap.get(toMonthKey(new Date(t.date)));
    if (!bucket) continue;
    if (t.kind === "INCOME") bucket.income += num(t.amount);
    else if (t.kind === "EXPENSE") bucket.expense += num(t.amount);
  }

  const months = [...trendMap.entries()].map(([month, v]) => ({
    month,
    income: v.income,
    expense: v.expense,
  }));
  const billsTotal = bills.length;
  const billsPaid = bills.filter((b) => b.isPaid).length;

  return { months, billsTotal, billsPaid };
}

export async function getCalendarMonth(
  userId: string,
  year: number,
  month0: number,
) {
  const start = new Date(year, month0, 1);
  const end = new Date(year, month0 + 1, 1);

  const [transactions, events] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    db.calendarEvent.findMany({
      where: { userId, date: { gte: start, lt: end } },
      orderBy: { date: "asc" },
    }),
  ]);

  const days = new Map<
    string,
    {
      income: number;
      expense: number;
      txCount: number;
      events: {
        id: string;
        title: string;
        type: string;
        amount: number | null;
        isPaid: boolean;
      }[];
    }
  >();

  const ensure = (key: string) => {
    if (!days.has(key))
      days.set(key, { income: 0, expense: 0, txCount: 0, events: [] });
    return days.get(key)!;
  };

  for (const t of transactions) {
    const bucket = ensure(toDateKey(new Date(t.date)));
    bucket.txCount += 1;
    if (t.kind === "INCOME") bucket.income += num(t.amount);
    else if (t.kind === "EXPENSE") bucket.expense += num(t.amount);
  }
  for (const e of events) {
    const bucket = ensure(toDateKey(new Date(e.date)));
    bucket.events.push({
      id: e.id,
      title: e.title,
      type: e.type,
      amount: e.amount ? num(e.amount) : null,
      isPaid: e.isPaid,
    });
  }

  return {
    days: Object.fromEntries(days),
    transactions: transactions.map((t) => ({
      id: t.id,
      kind: t.kind as TxKind,
      amount: num(t.amount),
      date: t.date.toISOString(),
      description: t.description,
      category: t.category
        ? { name: t.category.name, icon: t.category.icon, color: t.category.color }
        : null,
    })),
  };
}

/* ===================== Borç / strateji / profil ===================== */

export type PlainDebt = {
  id: string;
  name: string;
  kind: "CREDIT_CARD" | "LOAN";
  balance: number;
  apr: number;
  dueDay: number | null;
  paidTotal: number;
  createdAt: string;
};

function plainDebt(d: {
  id: string;
  name: string;
  kind: string;
  balance: unknown;
  apr: unknown;
  dueDay: number | null;
  createdAt: Date;
  payments?: { amount: unknown }[];
}): PlainDebt {
  return {
    id: d.id,
    name: d.name,
    kind: d.kind as "CREDIT_CARD" | "LOAN",
    balance: num(d.balance),
    apr: num(d.apr),
    dueDay: d.dueDay,
    paidTotal: (d.payments ?? []).reduce((s, p) => s + num(p.amount), 0),
    createdAt: d.createdAt.toISOString(),
  };
}

export async function getDebts(userId: string): Promise<PlainDebt[]> {
  const debts = await db.debt.findMany({
    where: { userId },
    orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
    include: { payments: { select: { amount: true } } },
  });
  return debts.map(plainDebt);
}

export async function getDebt(userId: string, id: string) {
  const debt = await db.debt.findFirst({
    where: { id, userId },
    include: {
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
  if (!debt) return null;
  return {
    ...plainDebt(debt),
    payments: debt.payments.map((p) => ({
      id: p.id,
      amount: num(p.amount),
      paidAt: p.paidAt.toISOString(),
      source: p.source,
      note: p.note,
    })),
  };
}

export async function getAutomations(userId: string) {
  const rows = await db.paymentAutomation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { debt: { select: { name: true } } },
  });
  const map = (r: (typeof rows)[number]) => ({
    id: r.id,
    debtId: r.debtId,
    debtName: r.debt.name,
    amount: num(r.amount),
    optimalDate: r.optimalDate.toISOString(),
    reason: r.reason,
    result: r.result,
    status: r.status,
    decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
  });
  return {
    pending: rows.filter((r) => r.status === "PENDING").map(map),
    decided: rows.filter((r) => r.status !== "PENDING").map(map),
  };
}

// Aylık ortalama nakit akışı — son 3 ay üzerinden.
export async function getMonthlyCashFlow(userId: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const tx = await db.transaction.findMany({
    where: { userId, date: { gte: start } },
    select: { kind: true, amount: true },
  });
  let income = 0;
  let expense = 0;
  for (const t of tx) {
    if (t.kind === "INCOME") income += num(t.amount);
    else if (t.kind === "EXPENSE") expense += num(t.amount);
  }
  const months = 3;
  return {
    income: income / months,
    expense: expense / months,
    net: (income - expense) / months,
  };
}

const FINANCE_PROFILE_DEFAULTS = {
  accountType: "INDIVIDUAL" as const,
  strategy: "balanced",
  allocDebt: 50,
  allocSavings: 25,
  allocCash: 25,
  automationEnabled: false,
};

export async function getOrCreateFinanceProfile(userId: string) {
  const profile = await db.financeProfile.upsert({
    where: { userId },
    create: { userId, ...FINANCE_PROFILE_DEFAULTS },
    update: {},
  });
  return {
    accountType: profile.accountType,
    strategy: profile.strategy,
    allocDebt: profile.allocDebt,
    allocSavings: profile.allocSavings,
    allocCash: profile.allocCash,
    automationEnabled: profile.automationEnabled,
    // Hassas alanlar at-rest şifreli — okurken çözülür.
    taxOrIdNumber: decryptField(profile.taxOrIdNumber),
    birthDate: profile.birthDate ? profile.birthDate.toISOString() : null,
    nationality: profile.nationality,
    province: profile.province,
    district: profile.district,
    neighborhood: profile.neighborhood,
    fullAddress: decryptField(profile.fullAddress),
    postalCode: profile.postalCode,
    profession: profile.profession,
    incomeRange: profile.incomeRange,
    aiIdentityText: decryptField(profile.aiIdentityText),
  };
}

export type PlainFinanceProfile = Awaited<
  ReturnType<typeof getOrCreateFinanceProfile>
>;

export type PlainScenarioEvent = {
  id: string;
  kind: "INCOME" | "EXPENSE" | "DEBT_PAYMENT";
  amount: number;
  date: string;
  description: string;
  categoryId: string | null;
};

export type PlainScenario = {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  notes: string | null;
  createdAt: string;
  events: PlainScenarioEvent[];
};

function mapScenarioEvent(e: {
  id: string;
  kind: "INCOME" | "EXPENSE" | "DEBT_PAYMENT";
  amount: unknown;
  date: Date;
  description: string;
  categoryId: string | null;
}): PlainScenarioEvent {
  return {
    id: e.id,
    kind: e.kind,
    amount: num(e.amount),
    date: toDateKey(e.date),
    description: e.description,
    categoryId: e.categoryId,
  };
}

export async function getScenarios(userId: string): Promise<PlainScenario[]> {
  const list = await db.scenario.findMany({
    where: { userId },
    include: { events: { orderBy: { date: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return list.map((s) => ({
    id: s.id,
    name: s.name,
    periodStart: toDateKey(s.periodStart),
    periodEnd: toDateKey(s.periodEnd),
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    events: s.events.map(mapScenarioEvent),
  }));
}

export async function getScenario(
  userId: string,
  id: string,
): Promise<PlainScenario | null> {
  const s = await db.scenario.findFirst({
    where: { id, userId },
    include: { events: { orderBy: { date: "asc" } } },
  });
  if (!s) return null;
  return {
    id: s.id,
    name: s.name,
    periodStart: toDateKey(s.periodStart),
    periodEnd: toDateKey(s.periodEnd),
    notes: s.notes,
    createdAt: s.createdAt.toISOString(),
    events: s.events.map(mapScenarioEvent),
  };
}

// Hesapları banka hesapları ve kredi kartları olarak ayırır.
export async function getBanksAndCards(userId: string) {
  const accounts = await db.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  const map = (a: (typeof accounts)[number]) => ({
    id: a.id,
    bankName: a.bankName,
    type: a.type,
    label: a.label,
    iban: a.iban,
    balance: a.balance != null ? num(a.balance) : null,
    cardLast4: a.cardLast4,
    cardExpiry: a.cardExpiry,
  });
  return {
    banks: accounts.filter((a) => a.type !== "CREDIT_CARD").map(map),
    cards: accounts.filter((a) => a.type === "CREDIT_CARD").map(map),
  };
}
