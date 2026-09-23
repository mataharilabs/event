import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSSOLogoutUrl } from "@/lib/auth/sso";

export async function POST(_request: NextRequest) {
  // Redirect to SSO logout — clears the shared .asiacommerce.net cookie globally
  return NextResponse.redirect(getSSOLogoutUrl());
}

export async function GET(_request: NextRequest) {
  return NextResponse.redirect(getSSOLogoutUrl());
}
