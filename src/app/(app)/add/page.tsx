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

      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[rgba(15,23,42,0.05)] px-2.5 py-1 text-xs font-semibold text-muted">
            Diğer yöntemler
          </span>
          <div className="h-px flex-1 bg-line" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
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
      className="card card-hover group flex items-center gap-3.5 p-5"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))" }}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading font-bold tracking-tight text-ink">
          {title}
        </p>
        <p className="text-sm text-muted">{desc}</p>
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary transition-transform group-hover:translate-x-0.5">
        <ChevronRight size={18} />
      </span>
    </Link>
  );
}
