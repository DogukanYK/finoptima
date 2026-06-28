import { ReceiptText, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getCategories } from "@/lib/queries";
import { db } from "@/lib/db";
import { formatTL, formatDateShort } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { ReceiptForm } from "@/components/receipts/receipt-form";

// Fiş AI okuması (offline okuyamazsa bulut) uzun sürebilir — süreyi uzat.
export const maxDuration = 60;

export default async function ReceiptsPage() {
  const user = await requireUser();
  const [categories, receipts] = await Promise.all([
    getCategories(user.id),
    db.transaction.findMany({
      where: { userId: user.id, source: "RECEIPT" },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 24,
      select: { id: true, description: true, amount: true, date: true, kind: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        kicker="Fişler"
        title="Fiş ile ekle"
        description="Fiş fotoğrafını çek — cihazında okunsun, harcaman kaydedilsin."
      />

      <div className="mb-5 flex items-start gap-3 rounded-[var(--app-radius)] bg-primary-soft p-3.5 text-sm text-primary">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <ShieldCheck size={18} />
        </span>
        <p className="pt-1">
          Fiş fotoğrafın <strong>önce cihazında okunur</strong>; cihazda
          okunamazsa daha doğru sonuç için yapay zekâya gönderilir.
        </p>
      </div>

      <ReceiptForm
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          kind: c.kind,
        }))}
      />

      {receipts.length > 0 ? (
        <div className="mt-5">
          <SectionCard
            title="Fişten eklenen işlemler"
            href="/transactions"
            hrefLabel="Tümü"
          >
            <div className="card divide-y divide-[var(--app-border)]">
              {receipts.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <ReceiptText size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {r.description}
                    </p>
                    <p className="text-xs text-muted">
                      {formatDateShort(r.date)}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      r.kind === "INCOME" ? "text-accent" : "text-ink"
                    }`}
                  >
                    {r.kind === "INCOME" ? "+" : "−"}
                    {formatTL(Number(r.amount))}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      ) : (
        <div className="card mt-5 flex items-center gap-3.5 p-5 text-sm text-muted">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <ReceiptText size={20} />
          </span>
          Henüz fiş eklemedin. Fişten eklediğin işlemler burada görünecek.
        </div>
      )}
    </div>
  );
}
