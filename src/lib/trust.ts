// Güven Skoru — profil doldurma oranından hesaplanır (0-100).
// Tahmini bir göstergedir; resmî bir doğrulama değildir.

export type TrustProfile = {
  accountType: "INDIVIDUAL" | "CORPORATE";
  taxOrIdNumber: string | null;
  birthDate: Date | string | null;
  nationality: string | null;
  province: string | null;
  district: string | null;
  neighborhood: string | null;
  fullAddress: string | null;
  postalCode: string | null;
  profession: string | null;
  incomeRange: string | null;
  aiIdentityText: string | null;
};

type FieldDef = {
  key: keyof TrustProfile;
  label: string;
  weight: number;
  individualOnly?: boolean;
};

const FIELDS: FieldDef[] = [
  { key: "taxOrIdNumber", label: "T.C. / Vergi Kimlik No", weight: 15 },
  { key: "birthDate", label: "Doğum Tarihi", weight: 10, individualOnly: true },
  { key: "nationality", label: "Uyruk / Kayıtlı Ülke", weight: 5 },
  { key: "province", label: "İl", weight: 5 },
  { key: "district", label: "İlçe", weight: 5 },
  { key: "neighborhood", label: "Mahalle", weight: 5 },
  { key: "fullAddress", label: "Tam Adres", weight: 10 },
  { key: "postalCode", label: "Posta Kodu", weight: 5 },
  { key: "profession", label: "Meslek Grubu / Sektör", weight: 15 },
  { key: "incomeRange", label: "Gelir / İşlem Hacmi Aralığı", weight: 10 },
  { key: "aiIdentityText", label: "AI Profil Tanımı", weight: 15 },
];

function isFilled(value: unknown): boolean {
  if (value == null) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return String(value).trim().length > 0;
}

export type TrustResult = {
  score: number; // 0-100
  filled: { label: string; weight: number }[];
  missing: { key: string; label: string; weight: number }[];
};

export function computeTrustScore(profile: TrustProfile): TrustResult {
  const applicable = FIELDS.filter(
    (f) => !f.individualOnly || profile.accountType === "INDIVIDUAL",
  );
  const maxWeight = applicable.reduce((s, f) => s + f.weight, 0);

  const filled: TrustResult["filled"] = [];
  const missing: TrustResult["missing"] = [];
  let earned = 0;

  for (const f of applicable) {
    if (isFilled(profile[f.key])) {
      earned += f.weight;
      filled.push({ label: f.label, weight: f.weight });
    } else {
      missing.push({ key: String(f.key), label: f.label, weight: f.weight });
    }
  }

  const score = maxWeight > 0 ? Math.round((earned / maxWeight) * 100) : 0;
  return { score, filled, missing };
}

export function trustBand(score: number): { label: string; tone: "danger" | "warning" | "accent" } {
  if (score >= 80) return { label: "Yüksek", tone: "accent" };
  if (score >= 50) return { label: "Orta", tone: "warning" };
  return { label: "Düşük", tone: "danger" };
}
