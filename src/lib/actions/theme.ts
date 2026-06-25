"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";

const hex = z.string().regex(/^#([0-9a-fA-F]{6})$/, "Geçersiz renk");

const themeUpdateSchema = z
  .object({
    mode: z.enum(["LIGHT", "DARK", "SYSTEM"]),
    presetName: z.string().max(40),
    primaryColor: hex,
    accentColor: hex,
    destructiveColor: hex,
    backgroundColor: hex,
    surfaceColor: hex,
    textColor: hex,
    mutedTextColor: hex,
    borderColor: hex,
    darkBackgroundColor: hex,
    darkSurfaceColor: hex,
    darkTextColor: hex,
    darkMutedTextColor: hex,
    darkBorderColor: hex,
    statusColors: z.object({
      success: hex,
      warning: hex,
      danger: hex,
    }),
    chartColors: z.array(hex).min(3).max(6),
    headingFont: z.string().max(60),
    bodyFont: z.string().max(60),
    fontWeightBody: z.number().int().min(300).max(800),
    fontWeightHeading: z.number().int().min(300).max(800),
    baseFontSize: z.number().int().min(13).max(20),
    lineHeight: z.number().min(1.2).max(2),
    letterSpacing: z.number().min(-0.05).max(0.12),
    borderRadius: z.number().int().min(0).max(28),
    shadowIntensity: z.enum(["none", "soft", "medium", "strong"]),
    borderWidth: z.number().int().min(0).max(3),
    density: z.enum(["compact", "comfortable", "spacious"]),
    animationLevel: z.enum(["none", "subtle", "full"]),
  })
  .partial();

export async function completeOnboarding(data: unknown): Promise<void> {
  const userId = await requireUserId();
  const parsed = themeUpdateSchema.safeParse(data);
  const themeData = parsed.success ? parsed.data : {};

  await db.$transaction([
    db.themeSettings.update({ where: { userId }, data: themeData }),
    db.user.update({
      where: { id: userId },
      data: { onboardedAt: new Date() },
    }),
  ]);

  redirect("/findeks");
}
