import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { exchangeSSOCode } from "@/lib/auth/sso";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=missing_code", request.url));
  }

  try {
    const payload = await exchangeSSOCode(code);

    let admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.email, payload.email),
    });

    if (!admin) {
      const [newAdmin] = await db
        .insert(adminUsers)
        .values({
          email: payload.email,
          name: payload.name,
          ssoSubject: payload.sub,
          role: "EVENT_ADMIN",
        })
        .returning();
      admin = newAdmin;
    } else {
      await db
        .update(adminUsers)
        .set({ lastLoginAt: new Date(), ssoSubject: payload.sub })
        .where(eq(adminUsers.id, admin.id));
    }

    if (!admin) {
      return NextResponse.redirect(new URL("/admin/login?error=admin_creation_failed", request.url));
    }

    const sessionToken = createAdminSessionToken(admin.id);

    const response = NextResponse.redirect(new URL("/admin", request.url));
    response.cookies.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("SSO callback error:", error);
    return NextResponse.redirect(new URL("/admin/login?error=sso_failed", request.url));
  }
}

function createAdminSessionToken(adminId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ adminId, iat: Date.now() })).toString("base64url");
  return `${header}.${payload}.unsigned`;
}
