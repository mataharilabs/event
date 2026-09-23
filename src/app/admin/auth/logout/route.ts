import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(_request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login", _request.url));
  response.cookies.delete("admin_session");
  return response;
}
