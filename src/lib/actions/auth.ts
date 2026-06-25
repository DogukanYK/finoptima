"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { hash, verify } from "@node-rs/argon2";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { registerSchema, loginSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { SEED_CATEGORIES, SEED_ACCOUNTS } from "@/lib/seed-data";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  needTotp?: boolean; // 2FA kodu gerekiyor — form TOTP alanını gösterir
};

async function clientKey(prefix: string): Promise<string> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return `${prefix}:${ip}`;
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const limit = await rateLimit(await clientKey("register"), 6, 60_000);
  if (!limit.ok) {
    return { error: `Çok fazla deneme. ${limit.retryAfter} sn sonra tekrar deneyin.` };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    inviteCode: formData.get("inviteCode") ?? "",
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, password, inviteCode } = parsed.data;

  // KVKK — aydınlatma metni rızası zorunlu.
  if (!formData.get("consent")) {
    return {
      fieldErrors: {
        consent: "Devam etmek için aydınlatma metnini kabul etmelisin.",
      },
    };
  }

  const userCount = await db.user.count();
  const isFirstUser = userCount === 0;

  let inviteId: string | null = null;
  if (!isFirstUser) {
    if (!inviteCode) {
      return { fieldErrors: { inviteCode: "Davet kodu gerekli" } };
    }
    // Davet kodu enumerasyonuna karşı ayrı ve daha sıkı limit.
    const inviteLimit = await rateLimit(await clientKey("invite"), 5, 600_000);
    if (!inviteLimit.ok) {
      return {
        fieldErrors: {
          inviteCode: `Çok fazla davet kodu denemesi. ${inviteLimit.retryAfter} sn sonra tekrar deneyin.`,
        },
      };
    }
    const invite = await db.inviteCode.findUnique({
      where: { code: inviteCode },
    });
    if (!invite || invite.usedById) {
      return {
        fieldErrors: { inviteCode: "Davet kodu geçersiz veya kullanılmış" },
      };
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return { fieldErrors: { inviteCode: "Davet kodunun süresi dolmuş" } };
    }
    inviteId = invite.id;
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: "Bu e-posta zaten kayıtlı" } };
  }

  const passwordHash = await hash(password);

  const newUserId = await db.$transaction(
    async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: isFirstUser ? "ADMIN" : "USER",
          consentedAt: new Date(),
          theme: { create: {} },
        },
      });

      for (const acc of SEED_ACCOUNTS) {
        await tx.account.create({ data: { userId: user.id, ...acc } });
      }

      for (const cat of SEED_CATEGORIES) {
        const created = await tx.category.create({
          data: {
            userId: user.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            kind: cat.kind,
            isSystem: true,
          },
        });
        if (cat.rules.length > 0) {
          await tx.categoryRule.createMany({
            data: cat.rules.map((pattern) => ({
              userId: user.id,
              pattern,
              categoryId: created.id,
              priority: 1,
            })),
          });
        }
      }

      if (inviteId) {
        await tx.inviteCode.update({
          where: { id: inviteId },
          data: { usedById: user.id, usedAt: new Date() },
        });
      }
      return user.id;
    },
    { timeout: 20_000 },
  );

  await logAudit({
    userId: newUserId,
    action: "register",
    entityType: "User",
    entityId: newUserId,
    metadata: { email, role: isFirstUser ? "ADMIN" : "USER" },
  });

  await signIn("credentials", { email, password, redirect: false });
  redirect("/onboarding");
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const limit = await rateLimit(await clientKey("login"), 8, 60_000);
  if (!limit.ok) {
    return { error: `Çok fazla deneme. ${limit.retryAfter} sn sonra tekrar deneyin.` };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    totp: formData.get("totp") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }
  const { email, password, totp } = parsed.data;

  // Parolayı önce burada doğrula — 2FA gerekip gerekmediğini bilmek için.
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verify(user.passwordHash, password))) {
    await logAudit({ action: "login.fail", metadata: { email } });
    return { error: "E-posta veya şifre hatalı." };
  }

  // 2FA açık ve kod henüz girilmemişse forma TOTP alanını açtır.
  if (user.twoFactorEnabled && !totp) {
    return { needTotp: true };
  }

  try {
    await signIn("credentials", { email, password, totp, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      await logAudit({
        userId: user.id,
        action: "login.fail",
        metadata: { email, reason: user.twoFactorEnabled ? "totp" : "password" },
      });
      return user.twoFactorEnabled
        ? { error: "Doğrulama kodu hatalı.", needTotp: true }
        : { error: "E-posta veya şifre hatalı." };
    }
    throw error;
  }

  await logAudit({
    userId: user.id,
    action: "login.success",
    entityType: "User",
    entityId: user.id,
    metadata: { email },
  });

  redirect("/findeks");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
