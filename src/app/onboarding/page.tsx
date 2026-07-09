import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.onboardedAt) redirect("/dashboard");

  return <OnboardingWizard userName={user.name.split(" ")[0]} />;
}
