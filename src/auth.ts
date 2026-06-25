import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { verify as verifyTotp } from "otplib";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { decryptField } from "@/lib/crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-posta", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const valid = await verify(user.passwordHash, parsed.data.password);
        if (!valid) return null;

        // İki adımlı doğrulama açıksa TOTP kodu zorunlu (sunucu tarafı yaptırım).
        if (user.twoFactorEnabled) {
          const secret = decryptField(user.twoFactorSecret);
          const token = (parsed.data.totp ?? "").replace(/\s/g, "");
          if (!secret || !token) return null;
          const result = await verifyTotp({ secret, token });
          if (!result.valid) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // İlk giriş: kimliği ve giriş zamanını damgala.
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "USER";
        token.loginAt = Date.now();
        token.checkedAt = Date.now();
        return token;
      }
      // Periyodik yeniden doğrulama (5 dk) — her istekte değil, performans için.
      const checkedAt = (token.checkedAt as number) ?? 0;
      if (Date.now() - checkedAt > 5 * 60 * 1000) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, sessionsValidFrom: true },
        });
        if (!dbUser) return null; // kullanıcı silinmiş → oturum biter
        const loginAt = (token.loginAt as number) ?? 0;
        if (
          dbUser.sessionsValidFrom &&
          loginAt < dbUser.sessionsValidFrom.getTime()
        ) {
          return null; // "tüm cihazlardan çıkış" yapılmış
        }
        token.role = dbUser.role;
        token.checkedAt = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "USER";
      }
      return session;
    },
  },
});
