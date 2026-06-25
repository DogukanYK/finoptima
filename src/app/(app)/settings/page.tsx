import Link from "next/link";
import {
  Landmark,
  Tags,
  Ticket,
  ShieldCheck,
  DatabaseBackup,
} from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { getAccounts, getCategories } from "@/lib/queries";
import { PageHeader } from "@/components/ui/page-header";
import { AccountsManager } from "@/components/settings/accounts-manager";
import { CategoriesManager } from "@/components/settings/categories-manager";
import { InvitesManager } from "@/components/settings/invites-manager";
import { TwoFactorManager } from "@/components/settings/two-factor-manager";
import { DataPrivacy } from "@/components/settings/data-privacy";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "accounts", label: "Hesaplar", icon: Landmark },
  { id: "categories", label: "Kategoriler", icon: Tags },
  { id: "security", label: "Güvenlik", icon: ShieldCheck },
  { id: "data", label: "Veri & Gizlilik", icon: DatabaseBackup },
  { id: "invites", label: "Davet Kodları", icon: Ticket, adminOnly: true },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const isAdmin = user.role === "ADMIN";
  const tabs = TABS.filter((t) => !t.adminOnly || isAdmin);
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab! : "accounts";

  return (
    <div>
      <PageHeader
        kicker="Ayarlar"
        title="Ayarların"
        description="Görünümünü ve hesabını kendine göre düzenle."
      />

      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <Link
              key={t.id}
              href={`/settings?tab=${t.id}`}
              className={cn(
                "flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-ink",
              )}
            >
              <t.icon size={16} />
              {t.label}
            </Link>
          );
        })}
      </div>

      {tab === "accounts" && (
        <div className="max-w-xl">
          <AccountsManager
            accounts={(await getAccounts(user.id)).map((a) => ({
              id: a.id,
              bankName: a.bankName,
              type: a.type,
              label: a.label,
              iban: a.iban,
              balance: a.balance != null ? Number(a.balance) : null,
              cardLast4: a.cardLast4,
              cardExpiry: a.cardExpiry,
            }))}
          />
        </div>
      )}

      {tab === "categories" && (
        <div className="max-w-2xl">
          <CategoriesManager
            categories={(await getCategories(user.id)).map((c) => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
              color: c.color,
              kind: c.kind,
            }))}
          />
        </div>
      )}

      {tab === "security" && (
        <TwoFactorManager enabled={user.twoFactorEnabled} />
      )}

      {tab === "data" && <DataPrivacy />}

      {tab === "invites" && isAdmin && (
        <div className="max-w-xl">
          <InvitesManager
            invites={(
              await db.inviteCode.findMany({
                where: { createdById: user.id },
                include: { usedBy: true },
                orderBy: { createdAt: "desc" },
              })
            ).map((i) => ({
              id: i.id,
              code: i.code,
              used: Boolean(i.usedById),
              usedByName: i.usedBy?.name ?? null,
              expiresAt: i.expiresAt ? i.expiresAt.toISOString() : null,
            }))}
          />
        </div>
      )}
    </div>
  );
}
