import { NextResponse } from "next/server";
import { getEventBySlug } from "@/lib/events/queries";
import { auth } from "@/lib/auth";

/**
 * Public event detail used by the on-page modal (/?event=<slug>). Returns the
 * published event, its on-sale tickets, and minimal viewer info so the modal's
 * registration step can prefill and know whether the user is logged in.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const event = await getEventBySlug(slug).catch(() => null);
  if (!event) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const session = await auth().catch(() => null);
  const now = new Date();

  const tickets = event.eventTickets
    .filter((t) => {
      if (!t.isActive) return false;
      if (t.salesStart && now < t.salesStart) return false;
      if (t.salesEnd && now > t.salesEnd) return false;
      return true;
    })
    .map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      price: t.price,
      currency: t.currency,
      quota: t.quota,
    }));

  return NextResponse.json({
    event: {
      id: event.id,
      title: event.title,
      slug: event.slug,
      description: event.description,
      primaryImageUrl: event.primaryImageUrl,
      startDatetime: event.startDatetime,
      endDatetime: event.endDatetime,
      timezone: event.timezone,
      attendanceMode: event.attendanceMode,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      googleMapsUrl: event.googleMapsUrl,
      lifecycleStatus: event.lifecycleStatus,
    },
    tickets,
    viewer: {
      isAuthenticated: !!session?.user?.id,
      name: session?.user?.name ?? "",
      email: session?.user?.email ?? "",
    },
  });
}
