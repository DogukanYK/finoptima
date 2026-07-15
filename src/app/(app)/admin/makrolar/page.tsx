// Hazır yanıt makroları yönetim sayfası (admin). İlk açılışta tembel-seed:
// tablo boşsa 4 varsayılan makro eklenir (prod build'ini etkilemez).

import { requireAdmin } from "@/lib/auth-helpers";
import { ensureDefaultMacros, listMacros } from "@/lib/support/macros";
import { PageHeader } from "@/components/ui/page-header";
import { MacrosManager } from "@/components/admin/macros-manager";

export default async function AdminMacrosPage() {
  await requireAdmin();
  await ensureDefaultMacros();
  const macros = await listMacros();

  return (
    <div>
      <PageHeader
        kicker="Admin"
        title="Hazır Yanıtlar"
        description="Talepleri tek tıkla yanıtlamak için hazır makrolar. Finansal veri içermez."
      />
      <MacrosManager macros={macros} />
    </div>
  );
}
