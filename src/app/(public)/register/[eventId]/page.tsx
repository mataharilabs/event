import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, ChevronLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events, eventTickets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { RegistrationForm } from "@/components/events/registration-form";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import { APP_URL } from "@/config";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.lifecycleStatus, "published")),
  });
  if (!event) return { title: "Event Tidak Ditemukan" };
  return {
    title: `Daftar — ${event.title}`,
    robots: { index: false, follow: false },
  };
}

export default async function RegisterPage({ params }: PageProps) {
  const { eventId } = await params;

  const [session, event] = await Promise.all([
    auth(),
    db.query.events.findFirst({
      where: and(eq(events.id, eventId), eq(events.lifecycleStatus, "published")),
      with: {
        eventTickets: {
          where: (t, { eq: eqFn }) => eqFn(t.isActive, true),
          orderBy: (t, { asc }) => [asc(t.price)],
        },
      },
    }),
  ]);

  if (!event) notFound();

  // Not logged in → redirect to login with callbackUrl
  if (!session?.user?.id) {
    const callbackUrl = `${APP_URL}/register/${eventId}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  // Filter tickets that are currently on sale
  const now = new Date();
  const availableTickets = event.eventTickets.filter((t) => {
    if (t.salesStart && now < t.salesStart) return false;
    if (t.salesEnd && now > t.salesEnd) return false;
    return true;
  });

  const minPrice = availableTickets.length > 0 ? Math.min(...availableTickets.map((t) => t.price)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back link */}
        <Link
          href={`/${event.slug}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" /> Kembali ke detail event
        </Link>

        {/* Event summary */}
        <div className="rounded-xl border bg-card p-4 mb-6 space-y-2">
          <h1 className="font-bold text-lg leading-snug">{event.title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDate(event.startDatetime, event.timezone)},{" "}
              {formatTime(event.startDatetime, event.timezone)}
            </span>
            {event.attendanceMode !== "online" && event.venueName && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {event.venueName}
              </span>
            )}
            {event.attendanceMode === "online" && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                Online
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-primary">
            {minPrice === 0 ? "GRATIS" : `Mulai ${formatCurrency(minPrice)}`}
          </p>
        </div>

        {/* Registration form */}
        <RegistrationForm
          eventId={event.id}
          eventTitle={event.title}
          tickets={availableTickets}
          defaultName={session.user.name ?? ""}
          defaultEmail={session.user.email ?? ""}
          defaultPhone={""}
        />
      </div>
    </div>
  );
}
