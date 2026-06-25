import { requireUser } from "@/lib/auth-helpers";
import { getAccounts } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { ImportWizard } from "@/components/import/import-wizard";

export default async function ImportPage() {
  const user = await requireUser();
  const accounts = await getAccounts(user.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        kicker="İçe Aktar"
        title="Banka dökümü"
        description="Ay sonu hesap dökümünü yükle, işlemler otomatik aktarılsın."
      />
      <ImportWizard
        accounts={accounts.map((a) => ({
          id: a.id,
          label: a.label,
          bankName: a.bankName,
          type: a.type,
        }))}
      />
    </div>
  );
}
