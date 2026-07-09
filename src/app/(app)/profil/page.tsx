import { Landmark, CreditCard, ShieldCheck, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getOrCreateFinanceProfile, getBanksAndCards } from "@/lib/queries";
import { computeTrustScore, trustBand } from "@/lib/trust";
import { formatTL } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { AiIdentity } from "@/components/profile/ai-identity";

export default async function ProfilPage() {
  const user = await requireUser();
  const [profile, accounts] = await Promise.all([
    getOrCreateFinanceProfile(user.id),
    getBanksAndCards(user.id),
  ]);

  const trust = computeTrustScore({
    accountType: profile.accountType,
    taxOrIdNumber: profile.taxOrIdNumber,
    birthDate: profile.birthDate,
    nationality: profile.nationality,
    province: profile.province,
    district: profile.district,
    neighborhood: profile.neighborhood,
    fullAddress: profile.fullAddress,
    postalCode: profile.postalCode,
    profession: profile.profession,
    incomeRange: profile.incomeRange,
    aiIdentityText: profile.aiIdentityText,
  });
  const band = trustBand(trust.score);

  const bandColor =
    band.tone === "accent"
      ? "var(--app-accent)"
      : band.tone === "warning"
        ? "var(--app-warning)"
        : "var(--app-destructive)";
  const initial = (user.name?.trim()?.[0] ?? "?").toUpperCase();
  const banks = accounts.banks;
  const cards = accounts.cards;
  const totalBalance = banks
    .filter((b) => b.balance != null)
    .reduce((s, b) => s + (b.balance ?? 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        kicker="Profil"
        title="Profilin"
        description="Kimlik bilgilerini tamamla, güven skorunu yükselt."
      />

      {/* Profil başlık kartı */}
      <div className="card flex items-center gap-4 p-5">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-heading text-xl font-extrabold text-white shadow-[var(--app-shadow)]"
          style={{ background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))" }}
        >
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate font-heading text-lg font-bold tracking-tight text-ink">
            {user.name ?? "Kullanıcı"}
          </p>
          <p className="truncate text-sm text-muted">{user.email}</p>
        </div>
      </div>

      {/* Güven Skoru kartı — koyu hero */}
      <div className="card-dark relative overflow-hidden p-5">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(37,99,235,0.55), transparent 70%)",
          }}
        />
        <div className="relative">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.12)] px-2.5 py-1 text-xs font-semibold text-white">
                <ShieldCheck size={13} /> Güven Skoru
              </span>
              <p className="text-sm font-semibold text-white/80">
                {band.label} güven
              </p>
            </div>
            <span className="font-heading text-5xl font-extrabold tabular-nums tracking-tight text-white">
              %{trust.score}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.14)]">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${trust.score}%`, background: bandColor }}
            />
          </div>
          {trust.missing.length > 0 && (
            <p className="mt-3 text-sm text-white/75">
              <span className="font-medium text-white">Eksik:</span>{" "}
              {trust.missing.map((m) => m.label).join(", ")}
            </p>
          )}
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/60">
            <TrendingUp size={13} className="shrink-0" />
            Güven skoru profil bilgilerini tamamladıkça yükselir; tahmini bir
            göstergedir.
          </p>
        </div>
      </div>

      {/* Profil formu */}
      <ProfileForm profile={profile} />

      {/* AI Profil Tanımı */}
      <AiIdentity initialText={profile.aiIdentityText} />

      {/* Bağlı Bankalar & Kartlar */}
      <SectionCard
        title="Bağlı Bankalar & Kartlar"
        subtitle="Hesaplarını Ayarlar'dan yönetebilirsin"
        href="/settings?tab=accounts"
        hrefLabel="Yönet"
      >
        {banks.length === 0 && cards.length === 0 ? (
          <p className="rounded-[calc(var(--app-radius)*0.7)] bg-surface-2 p-4 text-center text-sm text-muted">
            Henüz banka/kart eklemedin. Ayarlar &gt; Hesaplar&apos;dan
            ekleyebilirsin.
          </p>
        ) : (
          <div className="space-y-5">
            {banks.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">Bankalar</h3>
                  <span className="text-sm tabular-nums text-muted">
                    Toplam {formatTL(totalBalance)}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {banks.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 rounded-[var(--app-radius)] border border-line p-4 transition-colors hover:border-[var(--app-primary)]"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{
                          background: "linear-gradient(120deg, var(--app-primary), var(--app-accent))",
                        }}
                      >
                        <Landmark size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">
                          {b.label}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {b.bankName}
                          {b.iban && ` · ${b.iban}`}
                        </p>
                      </div>
                      {b.balance != null && (
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                          {formatTL(b.balance)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cards.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-ink">Kartlar</h3>
                <div className="space-y-2.5">
                  {cards.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 rounded-[var(--app-radius)] border border-line p-4 transition-colors hover:border-[var(--app-accent)]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <CreditCard size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">
                          {c.label}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {c.bankName}
                          {c.cardLast4 &&
                            ` · •••• •••• •••• ${c.cardLast4}`}
                        </p>
                      </div>
                      {c.cardExpiry && (
                        <span className="shrink-0 text-xs tabular-nums text-muted">
                          {c.cardExpiry}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
