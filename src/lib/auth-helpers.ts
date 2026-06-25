import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DEFAULT_THEME, type ThemeSettings } from "@/lib/theme";

// Oturum açmış kullanıcıyı + tema ayarlarını getirir.
// React cache() ile sarılı: tek istek içinde tekrar çağrılsa da DB'ye bir kez gider
// (layout + sayfa aynı kullanıcıyı çekiyor — sorgu sayısı yarıya iner).
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { theme: true },
  });
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Sadece kullanıcı kimliğini döndürür (server action'lar için hafif).
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export function themeFromUser(
  theme: {
    mode: string;
    presetName: string;
    primaryColor: string;
    accentColor: string;
    destructiveColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    mutedTextColor: string;
    borderColor: string;
    darkBackgroundColor: string;
    darkSurfaceColor: string;
    darkTextColor: string;
    darkMutedTextColor: string;
    darkBorderColor: string;
    statusColors: unknown;
    chartColors: unknown;
    headingFont: string;
    bodyFont: string;
    fontWeightBody: number;
    fontWeightHeading: number;
    baseFontSize: number;
    lineHeight: number;
    letterSpacing: number;
    borderRadius: number;
    shadowIntensity: string;
    borderWidth: number;
    density: string;
    animationLevel: string;
  } | null,
): ThemeSettings {
  if (!theme) return DEFAULT_THEME;
  return {
    mode: theme.mode as ThemeSettings["mode"],
    presetName: theme.presetName,
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    destructiveColor: theme.destructiveColor,
    backgroundColor: theme.backgroundColor,
    surfaceColor: theme.surfaceColor,
    textColor: theme.textColor,
    mutedTextColor: theme.mutedTextColor,
    borderColor: theme.borderColor,
    darkBackgroundColor: theme.darkBackgroundColor,
    darkSurfaceColor: theme.darkSurfaceColor,
    darkTextColor: theme.darkTextColor,
    darkMutedTextColor: theme.darkMutedTextColor,
    darkBorderColor: theme.darkBorderColor,
    statusColors: theme.statusColors as ThemeSettings["statusColors"],
    chartColors: theme.chartColors as string[],
    headingFont: theme.headingFont,
    bodyFont: theme.bodyFont,
    fontWeightBody: theme.fontWeightBody,
    fontWeightHeading: theme.fontWeightHeading,
    baseFontSize: theme.baseFontSize,
    lineHeight: theme.lineHeight,
    letterSpacing: theme.letterSpacing,
    borderRadius: theme.borderRadius,
    shadowIntensity: theme.shadowIntensity,
    borderWidth: theme.borderWidth,
    density: theme.density,
    animationLevel: theme.animationLevel,
  };
}
