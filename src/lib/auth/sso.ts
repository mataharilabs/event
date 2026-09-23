import type { AdminUser } from "@/db/schema";

export interface SSOTokenPayload {
  sub: string;
  email: string;
  name: string;
  role?: string;
}

export async function exchangeSSOCode(code: string): Promise<SSOTokenPayload> {
  const issuerUrl = process.env.SSO_ISSUER_URL;
  const clientId = process.env.SSO_CLIENT_ID;
  const clientSecret = process.env.SSO_CLIENT_SECRET;

  if (!issuerUrl || !clientId || !clientSecret) {
    throw new Error("SSO configuration is incomplete");
  }

  const tokenResponse = await fetch(`${issuerUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/admin/auth/callback`,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Failed to exchange SSO code");
  }

  const { access_token } = await tokenResponse.json() as { access_token: string };

  const userResponse = await fetch(`${issuerUrl}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userResponse.ok) {
    throw new Error("Failed to get user info from SSO");
  }

  return userResponse.json() as Promise<SSOTokenPayload>;
}

export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  const { db } = await import("@/db");
  const { adminUsers } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const decoded = decodeAdminSessionToken(token);
  if (!decoded) return null;

  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, decoded.adminId),
  });

  return admin ?? null;
}

function decodeAdminSessionToken(token: string): { adminId: string } | null {
  try {
    const payload = Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf-8");
    return JSON.parse(payload) as { adminId: string };
  } catch {
    return null;
  }
}
