import { ArrowLeftRight } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import {
  getTransactions,
  getTransactionTotals,
  getAccounts,
  getCategories,
  type TxKind,
  type TransactionFilters as TxFilters,
} from "@/lib/queries";
import { formatTL } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { LinkButton } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList } from "@/components/transactions/transaction-list";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const filters: TxFilters = {
    kind:
      sp.kind === "INCOME" || sp.kind === "EXPENSE"
        ? (sp.kind as TxKind)
        : undefined,
    month: sp.month || undefined,
    search: sp.search || undefined,
    categoryId: sp.category || undefined,
  };

  const [page, totals, accounts, categories] = await Promise.all([
    getTransactions(user.id, filters),
    getTransactionTotals(user.id, filters),
    getAccounts(user.id),
    getCategories(user.id),
  ]);
  const { income, expense } = totals;
  const filterKey = JSON.stringify(filters);

  const net = income - expense;
  const expenseCount = page.items.filter((t) => t.kind === "EXPENSE").length;
  const incomeCount = page.items.filter((t) => t.kind === "INCOME").length;
  const avgSpend = expenseCount > 0 ? expense / expenseCount : 0;

  return (
    <div>
      <PageHeader
        kicker="işlemler"
        title="İşlemler"
        description="Tüm hareketlerin tek listede, filtreli."
        action={
          <LinkButton href="/add" size="sm">
            Yeni işlem
          </LinkButton>
        }
      />

      <TransactionFilters
        accountCount={accounts.length}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />

      {page.items.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <StatCard
            kicker="gelir"
            value={formatTL(income)}
            hue="accent"
            sub={`${incomeCount} işlem`}
          />
          <StatCard
            kicker="gider"
            value={formatTL(expense)}
            hue="destructive"
            sub={`${expenseCount} işlem`}
          />
          <StatCard
            kicker="net"
            value={`${net >= 0 ? "+" : ""}${formatTL(net)}`}
            hue={net >= 0 ? "primary" : "destructive"}
          />
          <StatCard
            kicker="ortalama gider"
            value={formatTL(avgSpend)}
            hue="violet"
            sub="işlem başına"
          />
        </div>
      )}

      {page.items.length > 0 ? (
        <TransactionList
          key={filterKey}
          initialItems={page.items}
          initialCursor={page.nextCursor}
          filters={filters}
        />
      ) : (
        <EmptyState
          icon={<ArrowLeftRight size={26} />}
          title="Henüz işlem yok"
          description="Filtrene uyan bir işlem bulunamadı ya da hiç işlem eklemedin."
          action={
            <LinkButton href="/add" size="md">
              İlk işlemini ekle
            </LinkButton>
          }
        />
      )}
    </div>
  );
}
