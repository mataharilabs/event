import { cookies } from "next/headers";
import type { AdminUser } from "@/db/schema";

const ADMIN_SESSION_COOKIE = "admin_session";

export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!sessionToken) {
      return null;
    }

    const { verifyAdminToken } = await import("./sso");
    return verifyAdminToken(sessionToken);
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminSession();

  if (!admin) {
    throw new Error("Unauthorized: Admin session required");
  }

  return admin;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();

  if (admin.role !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Super admin access required");
  }

  return admin;
}
