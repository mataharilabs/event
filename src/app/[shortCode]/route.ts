import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { shortLinks, events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { SHORT_CODE_LENGTH } from "@/config";
import { APP_URL } from "@/config";

const SHORT_CODE_REGEX = /^[a-z0-9]{8}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;

  if (shortCode.length !== SHORT_CODE_LENGTH || !SHORT_CODE_REGEX.test(shortCode)) {
    return NextResponse.redirect(new URL("/events", APP_URL), { status: 301 });
  }

  try {
    const result = await db
      .select({
        slug: events.slug,
        lifecycleStatus: events.lifecycleStatus,
      })
      .from(shortLinks)
      .innerJoin(events, eq(shortLinks.eventId, events.id))
      .where(
        and(
          eq(shortLinks.shortCode, shortCode),
          eq(events.lifecycleStatus, "published")
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.redirect(new URL("/events", APP_URL), { status: 301 });
    }

    return NextResponse.redirect(new URL(`/${result[0].slug}`, APP_URL), { status: 301 });
  } catch {
    return NextResponse.redirect(new URL("/events", APP_URL), { status: 302 });
  }
}
