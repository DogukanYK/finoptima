"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, User, Building2 } from "lucide-react";
import {
  updateFinanceProfile,
  type ProfileActionState,
} from "@/lib/actions/profile";
import { computeTrustScore, trustBand } from "@/lib/trust";
import { Field, Label } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

type Profile = {
  accountType: "INDIVIDUAL" | "CORPORATE";
  taxOrIdNumber: string | null;
  birthDate: string | null;
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

const NATIONALITIES = [
  "Türk",
  "Amerika Birleşik Devletleri",
  "Almanya",
  "Fransa",
  "Birleşik Krallık",
  "İtalya",
  "İspanya",
  "Japonya",
  "Çin",
  "Diğer",
];

const PROVINCES = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Adana",
  "Konya",
  "Gaziantep",
  "Diğer",
];

const PROFESSIONS = [
  "Öğrenci",
  "Özel Sektör Çalışanı",
  "Kamu Sektörü Çalışanı",
  "Serbest Meslek/Danışman",
  "İşveren",
  "Emekli",
  "Diğer",
];

const INCOME_RANGES = [
  "₺0-5K",
  "₺5K-10K",
  "₺10K-20K",
  "₺20K-50K",
  "₺50K-100K",
  "₺100K+",
];

const textareaClass =
  "w-full rounded-[calc(var(--app-radius)*0.7)] border border-line bg-surface p-3.5 text-ink outline-none transition-colors focus-visible:border-[var(--app-primary)] focus-visible:ring-2 focus-visible:ring-[var(--app-primary-soft)]";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-heading text-sm font-bold text-ink">{children}</h3>
  );
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState<ProfileActionState, FormData>(
    updateFinanceProfile,
    {},
  );

  const [accountType, setAccountType] = useState<
    "INDIVIDUAL" | "CORPORATE"
  >(profile.accountType);

  const birthDefault = profile.birthDate
    ? profile.birthDate.slice(0, 10)
    : "";

  // Canlı güven skoru için izlenen alanlar
  const [fields, setFields] = useState({
    taxOrIdNumber: profile.taxOrIdNumber ?? "",
    birthDate: birthDefault,
    nationality: profile.nationality ?? "",
    province: profile.province ?? "",
    district: profile.district ?? "",
    neighborhood: profile.neighborhood ?? "",
    fullAddress: profile.fullAddress ?? "",
    postalCode: profile.postalCode ?? "",
    profession: profile.profession ?? "",
    incomeRange: profile.incomeRange ?? "",
  });

  function update(key: keyof typeof fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  const liveTrust = computeTrustScore({
    accountType,
    taxOrIdNumber: fields.taxOrIdNumber || null,
    birthDate: fields.birthDate || null,
    nationality: fields.nationality || null,
    province: fields.province || null,
    district: fields.district || null,
    neighborhood: fields.neighborhood || null,
    fullAddress: fields.fullAddress || null,
    postalCode: fields.postalCode || null,
    profession: fields.profession || null,
    incomeRange: fields.incomeRange || null,
    aiIdentityText: profile.aiIdentityText,
  });
  const liveBand = trustBand(liveTrust.score);
  const liveColor =
    liveBand.tone === "accent"
      ? "var(--app-accent)"
      : liveBand.tone === "warning"
        ? "var(--app-warning)"
        : "var(--app-destructive)";

  const isIndividual = accountType === "INDIVIDUAL";
  const fe = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="card space-y-6 p-5">
      <input type="hidden" name="accountType" value={accountType} />

      {/* Hesap türü geçişi */}
      <div>
        <Label>Hesap Türü</Label>
        <div className="grid grid-cols-2 gap-2 rounded-[calc(var(--app-radius)*0.7)] bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => setAccountType("INDIVIDUAL")}
            className={`flex items-center justify-center gap-2 rounded-[calc(var(--app-radius)*0.55)] py-2 text-sm font-medium transition-colors ${
              isIndividual
                ? "bg-surface text-ink shadow-[var(--app-shadow)]"
                : "text-muted hover:text-ink"
            }`}
          >
            <User size={16} /> Bireysel
          </button>
          <button
            type="button"
            onClick={() => setAccountType("CORPORATE")}
            className={`flex items-center justify-center gap-2 rounded-[calc(var(--app-radius)*0.55)] py-2 text-sm font-medium transition-colors ${
              !isIndividual
                ? "bg-surface text-ink shadow-[var(--app-shadow)]"
                : "text-muted hover:text-ink"
            }`}
          >
            <Building2 size={16} /> Şirket
          </button>
        </div>
      </div>

      {/* Canlı güven skoru */}
      <div className="rounded-[calc(var(--app-radius)*0.7)] bg-surface-2 p-3.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-ink">
            Güven Skoru: %{liveTrust.score}
          </span>
          <span className="text-xs text-muted">{liveBand.label}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--app-border)]">
          <div
            className="h-full rounded-full transition-[width] duration-300"
            style={{ width: `${liveTrust.score}%`, background: liveColor }}
          />
        </div>
      </div>

      {/* 1. Kimlik ve Doğrulama */}
      <div className="space-y-3.5">
        <SectionTitle>Kimlik ve Doğrulama</SectionTitle>
        <Field
          name="taxOrIdNumber"
          label={isIndividual ? "T.C. Kimlik No" : "Vergi Kimlik No"}
          hint={isIndividual ? "11 haneli" : "10 haneli"}
          inputMode="numeric"
          value={fields.taxOrIdNumber}
          onChange={(e) => update("taxOrIdNumber", e.target.value)}
          error={fe.taxOrIdNumber}
        />
        {isIndividual && (
          <Field
            name="birthDate"
            label="Doğum Tarihi"
            type="date"
            value={fields.birthDate}
            onChange={(e) => update("birthDate", e.target.value)}
            error={fe.birthDate}
          />
        )}
        <Select
          name="nationality"
          label="Uyruk"
          value={fields.nationality}
          onChange={(e) => update("nationality", e.target.value)}
        >
          <option value="">Seçiniz</option>
          {NATIONALITIES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>

      {/* 2. Adres ve Konum */}
      <div className="space-y-3.5">
        <SectionTitle>Adres ve Konum</SectionTitle>
        <Select
          name="province"
          label="İl"
          value={fields.province}
          onChange={(e) => update("province", e.target.value)}
        >
          <option value="">Seçiniz</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Field
            name="district"
            label="İlçe"
            value={fields.district}
            onChange={(e) => update("district", e.target.value)}
            error={fe.district}
          />
          <Field
            name="neighborhood"
            label="Mahalle"
            value={fields.neighborhood}
            onChange={(e) => update("neighborhood", e.target.value)}
            error={fe.neighborhood}
          />
        </div>
        <div>
          <Label htmlFor="fullAddress">Tam Adres</Label>
          <textarea
            id="fullAddress"
            name="fullAddress"
            rows={3}
            className={textareaClass}
            placeholder="Sokak, bina no, daire…"
            value={fields.fullAddress}
            onChange={(e) => update("fullAddress", e.target.value)}
          />
        </div>
        <Field
          name="postalCode"
          label="Posta Kodu"
          inputMode="numeric"
          value={fields.postalCode}
          onChange={(e) => update("postalCode", e.target.value)}
          error={fe.postalCode}
        />
      </div>

      {/* 3. Mesleki ve Finansal Durum */}
      <div className="space-y-3.5">
        <SectionTitle>Mesleki ve Finansal Durum</SectionTitle>
        <Select
          name="profession"
          label="Meslek Grubu"
          value={fields.profession}
          onChange={(e) => update("profession", e.target.value)}
        >
          <option value="">Seçiniz</option>
          {PROFESSIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select
          name="incomeRange"
          label={
            isIndividual ? "Aylık Gelir Aralığı" : "Aylık İşlem Hacmi"
          }
          value={fields.incomeRange}
          onChange={(e) => update("incomeRange", e.target.value)}
        >
          <option value="">Seçiniz</option>
          {INCOME_RANGES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-accent">
          <CheckCircle2 size={16} /> Bilgilerin kaydedildi.
        </p>
      )}

      <SubmitButton className="w-full sm:w-auto">
        Bilgileri Kaydet
      </SubmitButton>
    </form>
  );
}
