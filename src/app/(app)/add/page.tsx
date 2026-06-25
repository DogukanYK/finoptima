import Link from "next/link";
import { ReceiptText, Upload, ChevronRight } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getCategories, getAccounts } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { QuickAddForm } from "@/components/transactions/quick-add-form";

export default async function AddPage() {
  const user = await requireUser();
  const [categories, accounts] = await Promise.all([
    getCategories(user.id),
    getAccounts(user.id),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        kicker="Hızlı Ekle"
        title="Harcama ekle"
        description="Saniyeler içinde kaydet — kategorisini FinOptima halleder."
      />

      <QuickAddForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
          icon: c.icon,
        }))}
        accounts={accounts.map((a) => ({
          id: a.id,
          label: a.label,
          bankName: a.bankName,
        }))}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MethodCard
          href="/receipts"
          icon={<ReceiptText size={20} />}
          title="Fiş fotoğrafı"
          desc="Fişini yükle, sakla"
        />
        <MethodCard
          href="/import"
          icon={<Upload size={20} />}
          title="Banka dökümü"
          desc="Excel / CSV içe aktar"
        />
      </div>
    </div>
  );
}

function MethodCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="card flex items-center gap-3 p-4 transition-colors hover:bg-surface-2"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--app-radius)*0.7)] bg-primary-soft text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{title}</p>
        <p className="text-sm text-muted">{desc}</p>
      </div>
      <ChevronRight size={18} className="text-muted" />
    </Link>
  );
}
