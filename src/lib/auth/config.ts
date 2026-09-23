import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "whatsapp-otp",
      name: "WhatsApp OTP",
      credentials: {
        phone: { label: "Phone", type: "text" },
        otpToken: { label: "OTP Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otpToken) return null;

        try {
          const tokenStr = credentials.otpToken as string;
          const parts = tokenStr.split(".");
          if (parts.length !== 3) return null;

          const payload = JSON.parse(
            Buffer.from(parts[1] ?? "", "base64url").toString("utf-8")
          ) as { userId: string; phone: string; type: string };

          if (payload.type !== "otp") return null;

          const user = await db.query.users.findFirst({
            where: eq(users.id, payload.userId),
          });

          if (!user) return null;

          return { id: user.id, name: user.name, email: user.email, image: user.avatarUrl };
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    signIn({ user, account }) {
      if (account?.provider === "google") {
        return handleGoogleSignIn(user, account);
      }
      return true;
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
};

async function handleGoogleSignIn(
  user: { id?: string; name?: string | null; email?: string | null; image?: string | null },
  account: { providerAccountId: string }
): Promise<boolean> {
  try {
    if (!user.email) return false;

    const existing = await db.query.users.findFirst({
      where: eq(users.email, user.email),
    });

    if (!existing) {
      const [newUser] = await db
        .insert(users)
        .values({
          name: user.name ?? user.email,
          email: user.email,
          avatarUrl: user.image,
          authProvider: "google",
          authProviderId: account.providerAccountId,
        })
        .returning();

      if (newUser) user.id = newUser.id;
    } else {
      user.id = existing.id;
    }

    return true;
  } catch (err) {
    console.error("Google sign-in error:", err);
    return false;
  }
}
