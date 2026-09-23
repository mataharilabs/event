import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      apps?: Record<string, string>;
      isSuperAdmin?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apps?: Record<string, string>;
    isSuperAdmin?: boolean;
  }
}
