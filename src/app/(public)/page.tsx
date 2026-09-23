import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EventSection } from "@/components/events/event-section";
import { getPublishedEventsForCards } from "@/lib/events/queries";
import { getEventDisplayStatus } from "@/lib/events/display-status";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AsiaCommerce Event — Discover Our Events",
  description:
    "Temukan dan ikuti event, workshop, webinar, dan aktivitas komunitas AsiaCommerce.",
};

export const revalidate = 300;

export default async function HomePage() {
  let allEvents: Awaited<ReturnType<typeof getPublishedEventsForCards>> = [];

  try {
    allEvents = await getPublishedEventsForCards();
  } catch {
    // DB not configured yet — show empty state
  }

  const now = new Date();

  const upcomingEvents = allEvents.filter(
    (e) =>
      getEventDisplayStatus(
        { lifecycleStatus: e.lifecycleStatus, startDatetime: e.startDatetime, endDatetime: e.endDatetime },
        now
      ) === "upcoming"
  );

  const ongoingEvents = allEvents.filter(
    (e) =>
      getEventDisplayStatus(
        { lifecycleStatus: e.lifecycleStatus, startDatetime: e.startDatetime, endDatetime: e.endDatetime },
        now
      ) === "ongoing"
  );

  const pastEvents = allEvents.filter(
    (e) =>
      getEventDisplayStatus(
        { lifecycleStatus: e.lifecycleStatus, startDatetime: e.startDatetime, endDatetime: e.endDatetime },
        now
      ) === "past"
  );

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mb-6">
            Discover AsiaCommerce Events
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Join our upcoming events, workshops, webinars, and community activities.
          </p>
          <Button asChild size="lg">
            <Link href="/events">Explore Events</Link>
          </Button>
        </div>
      </section>

      {/* Event sections */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {ongoingEvents.length > 0 && (
          <EventSection
            title="Sedang Berlangsung"
            events={ongoingEvents}
            viewAllHref="/events?status=ongoing"
          />
        )}

        <EventSection
          title="Upcoming / Segera Hadir"
          events={upcomingEvents}
          viewAllHref="/events?status=upcoming"
          emptyMessage="Tidak ada event yang akan datang saat ini."
        />

        <EventSection
          title="Past Event / Sudah Selesai"
          events={pastEvents}
          viewAllHref="/events?status=past"
          emptyMessage="Belum ada event yang selesai."
        />
      </div>
    </>
  );
}
