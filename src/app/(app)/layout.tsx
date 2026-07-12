import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { appliedThemeFromUser, themeStyleContent } from "@/lib/theme";
import { AppShell } from "@/components/app/app-shell";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  if (!user.onboardedAt) redirect("/onboarding");

  // Kullanıcının seçtiği mod + palet uygulanır (renkler preset'ten çözülür;
  // tipografi/köşe daima varsayılan → tutarlı).
  const theme = appliedThemeFromUser(user.theme);

  return (
    <>
      <style
        id="akca-theme"
        dangerouslySetInnerHTML={{ __html: themeStyleContent(theme) }}
      />
      <AppShell
        user={{ name: user.name, email: user.email }}
        isAdmin={user.role === "ADMIN"}
      >
        {children}
      </AppShell>
      <InstallPrompt />
    </>
  );
}
