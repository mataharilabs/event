import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// OAuth callback no longer needed — SSO uses shared-cookie JWT.
// The SSO redirects back to /admin after login; session is read from the shared cookie.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/admin", request.url));
}
