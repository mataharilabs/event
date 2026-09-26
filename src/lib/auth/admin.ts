import { auth } from "@/lib/auth";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AdminUser } from "@/db/schema";

export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) return null;

    // Check for EVENT app role in SSO claims
    const eventRole = session.user.apps?.["EVENT"];
    if (!eventRole) return null;

    // Get or create local admin record (needed for FK references in audit logs, payments, etc.)
    const existing = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, session.user.email),
    });

    if (existing) {
      // Sync role if it changed in SSO
      if (existing.role !== eventRole) {
        const [updated] = await db
          .update(adminUsers)
          .set({ role: eventRole as AdminUser["role"], updatedAt: new Date() })
          .where(eq(adminUsers.id, existing.id))
          .returning();
        return updated ?? existing;
      }
      return existing;
    }

    // First login — create local record
    const [newAdmin] = await db
      .insert(adminUsers)
      .values({
        email: session.user.email,
        name: session.user.name ?? session.user.email,
        ssoSubject: session.user.id ?? null,
        role: eventRole as AdminUser["role"],
      })
      .returning();

    return newAdmin ?? null;
  } catch (err) {
    console.error("[getAdminSession] error:", err);
    return null;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminSession();
  if (!admin) throw new Error("Unauthorized: Admin session required");
  return admin;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "SUPER_ADMIN") throw new Error("Forbidden: Super admin access required");
  return admin;
}
