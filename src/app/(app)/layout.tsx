import { redirect } from "next/navigation";
import { requireUser, themeFromUser } from "@/lib/auth-helpers";
import { themeStyleContent } from "@/lib/theme";
import { AppShell } from "@/components/app/app-shell";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user.onboardedAt) redirect("/onboarding");

  const theme = themeFromUser(user.theme);

  return (
    <>
      <style
        id="akca-theme"
        dangerouslySetInnerHTML={{ __html: themeStyleContent(theme) }}
      />
      <AppShell user={{ name: user.name, email: user.email }}>
        {children}
      </AppShell>
      <InstallPrompt />
    </>
  );
}
