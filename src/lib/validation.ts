import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "İsim en az 2 karakter olmalı").max(80),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z
    .string()
    .min(10, "Şifre en az 10 karakter olmalı")
    .max(120)
    .regex(/[A-Za-z]/, "Şifre en az bir harf içermeli")
    .regex(/[0-9]/, "Şifre en az bir rakam içermeli"),
  inviteCode: z.string().trim().max(40).optional().default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
  totp: z.string().trim().optional(),
});

export const transactionSchema = z.object({
  amount: z.coerce.number().positive("Tutar pozitif olmalı"),
  kind: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().trim().min(1, "Açıklama gerekli").max(200),
  date: z.string().min(1),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  note: z.string().trim().max(500).optional(),
});

export const eventSchema = z.object({
  title: z.string().trim().min(1, "Başlık gerekli").max(160),
  date: z.string().min(1),
  time: z.string().optional(),
  type: z.enum(["REMINDER", "BILL", "EVENT"]),
  amount: z.coerce.number().optional(),
  note: z.string().trim().max(500).optional(),
});

export const accountSchema = z.object({
  bankName: z.string().trim().min(1).max(60),
  type: z.enum(["CHECKING", "CREDIT_CARD", "SAVINGS", "CASH", "OTHER"]),
  label: z.string().trim().min(1).max(60),
  iban: z.string().trim().max(40).optional(),
  cardLast4: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Son 4 hane 4 rakam olmalı")
    .optional()
    .or(z.literal("")),
  cardExpiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "AA/YY biçiminde girin")
    .optional()
    .or(z.literal("")),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  icon: z.string().trim().min(1).max(40),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{6})$/, "Geçersiz renk"),
  kind: z.enum(["INCOME", "EXPENSE"]),
});

export const debtSchema = z.object({
  name: z.string().trim().min(1, "Ad gerekli").max(60),
  kind: z.enum(["CREDIT_CARD", "LOAN"]),
  balance: z.coerce.number().nonnegative("Bakiye negatif olamaz"),
  apr: z.coerce
    .number()
    .min(0, "Faiz negatif olamaz")
    .max(50, "Geçersiz faiz oranı"),
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
});

export const debtPaymentSchema = z.object({
  debtId: z.string().min(1),
  amount: z.coerce.number().positive("Tutar pozitif olmalı"),
  note: z.string().trim().max(300).optional(),
});

export const strategySchema = z.object({
  strategy: z.enum(["aggressive", "balanced", "safe", "custom"]),
  allocDebt: z.coerce.number().int().min(0).max(100),
  allocSavings: z.coerce.number().int().min(0).max(100),
  allocCash: z.coerce.number().int().min(0).max(100),
});

export const financeProfileSchema = z.object({
  accountType: z.enum(["INDIVIDUAL", "CORPORATE"]),
  taxOrIdNumber: z.string().trim().max(20).optional(),
  birthDate: z.string().trim().optional(),
  nationality: z.string().trim().max(60).optional(),
  province: z.string().trim().max(60).optional(),
  district: z.string().trim().max(60).optional(),
  neighborhood: z.string().trim().max(60).optional(),
  fullAddress: z.string().trim().max(300).optional(),
  postalCode: z.string().trim().max(10).optional(),
  profession: z.string().trim().max(60).optional(),
  incomeRange: z.string().trim().max(40).optional(),
});

export const scenarioSchema = z.object({
  name: z.string().trim().min(1, "Senaryo adı gerekli").max(80),
  periodStart: z.string().min(1, "Başlangıç tarihi gerekli"),
  periodEnd: z.string().min(1, "Bitiş tarihi gerekli"),
  notes: z.string().trim().max(500).optional(),
});

export const scenarioEventSchema = z.object({
  kind: z.enum(["INCOME", "EXPENSE", "DEBT_PAYMENT"]),
  amount: z.coerce.number().positive("Tutar pozitif olmalı"),
  date: z.string().min(1, "Tarih gerekli"),
  description: z.string().trim().min(1, "Açıklama gerekli").max(120),
  categoryId: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
