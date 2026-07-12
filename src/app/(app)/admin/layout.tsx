// Admin destek paneli kabuğu — requireAdmin guard + ince alt nav.
// DİKKAT: Bu guard yalnız SAYFALARI korur; server action'lar kendi içinde
// requireAdminId() çağırır (bkz. lib/actions/admin-support.ts).

import { requireAdmin } from "@/lib/auth-helpers";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin(); // ADMIN değilse /dashboard'a yönlendirir

  return (
    <div>
      <AdminNav />
      {children}
    </div>
  );
}
