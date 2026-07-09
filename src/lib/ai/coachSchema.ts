// Kredi koçu planı — yapısal çıktı şeması (zod). SDK BAĞIMSIZ: hem Claude üretimi
// (creditCoach.ts) hem DB'den okunan planın doğrulaması (queries.getCoachPlan) bunu
// kullanır. Ayrı dosya → queries.ts Anthropic SDK'sını çekmeden şemayı import eder.
import { z } from "zod";

export const coachStepSchema = z.object({
  priority: z.enum(["high", "medium", "low"]),
  title: z.string(), // kısa başlık
  why: z.string(), // neden önemli — kullanıcının gerçek sayılarına dayalı
  action: z.string(), // bu ay atılacak somut adım
  impact: z.string(), // beklenen etki (nitel: "yüksek etki" gibi; sayı uydurmaz)
});

export const coachPlanSchema = z.object({
  summary: z.string(), // 1-2 cümlelik dürüst genel durum
  steps: z.array(coachStepSchema), // önceliklendirilmiş eylem listesi
});

export type CoachStep = z.infer<typeof coachStepSchema>;
export type CoachPlan = z.infer<typeof coachPlanSchema>;
