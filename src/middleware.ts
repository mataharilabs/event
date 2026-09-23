import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limit store (edge-compatible, resets per isolation)
// For production scale use Upstash Redis or Vercel KV
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(request: NextRequest, prefix: string): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `${prefix}:${ip}`;
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

function rateLimitResponse() {
  return NextResponse.json(
    { error: "Terlalu banyak permintaan. Coba lagi nanti." },
    {
      status: 429,
      headers: { "Retry-After": "60" },
    }
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limit: OTP send endpoint — 5 req per 5 min per IP
  if (pathname === "/api/auth/otp/send" && request.method === "POST") {
    const key = getRateLimitKey(request, "otp");
    if (!checkRateLimit(key, 5, 5 * 60 * 1000)) {
      return rateLimitResponse();
    }
  }

  // Rate limit: file upload — 10 req per 10 min per IP
  if (pathname.startsWith("/api/upload/") && request.method === "POST") {
    const key = getRateLimitKey(request, "upload");
    if (!checkRateLimit(key, 10, 10 * 60 * 1000)) {
      return rateLimitResponse();
    }
  }

  // Rate limit: payment initiation — 20 req per 10 min per IP
  if (pathname.startsWith("/api/") && pathname.includes("payment") && request.method === "POST") {
    const key = getRateLimitKey(request, "payment");
    if (!checkRateLimit(key, 20, 10 * 60 * 1000)) {
      return rateLimitResponse();
    }
  }

  // Protect admin routes — redirect to SSO login if no session cookie present
  if (pathname.startsWith("/admin")) {
    const isPublicAdminPath =
      pathname.startsWith("/admin/login") ||
      pathname.startsWith("/admin/auth");

    if (!isPublicAdminPath) {
      const sessionCookie =
        request.cookies.get("__Secure-authjs.session-token") ??
        request.cookies.get("authjs.session-token");

      if (!sessionCookie) {
        const ssoUrl = process.env.SSO_URL;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (ssoUrl && appUrl) {
          const callbackUrl = `${appUrl}${pathname}`;
          return NextResponse.redirect(
            `${ssoUrl}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
          );
        }
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/auth/otp/:path*",
    "/api/upload/:path*",
  ],
};
