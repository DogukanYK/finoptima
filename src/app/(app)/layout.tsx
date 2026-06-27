import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { DEFAULT_THEME, themeStyleContent } from "@/lib/theme";
import { AppShell } from "@/components/app/app-shell";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user.onboardedAt) redirect("/onboarding");

  // Tema müşterileştirme kaldırıldı — herkese tek modern fintech teması.
  const theme = DEFAULT_THEME;

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
