import { Suspense } from "react";
import { EventCard } from "@/components/events/event-card";
import { EventsFilter } from "@/components/events/events-filter";
import { getFilteredEvents } from "@/lib/events/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events",
  description: "Temukan semua event AsiaCommerce — workshop, webinar, dan aktivitas komunitas.",
  robots: { index: true, follow: true },
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    mode?: string;
    page?: string;
  }>;
}

async function EventsList({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const displayStatus = ["upcoming", "ongoing", "past"].includes(sp.status ?? "")
    ? (sp.status as "upcoming" | "ongoing" | "past")
    : undefined;

  const priceType = ["free", "paid"].includes(sp.type ?? "")
    ? (sp.type as "free" | "paid")
    : undefined;

  const attendanceMode = ["online", "offline"].includes(sp.mode ?? "")
    ? (sp.mode as "online" | "offline")
    : undefined;

  let result = { events: [] as Awaited<ReturnType<typeof getFilteredEvents>>["events"], total: 0, page: 1, limit: 12 };

  try {
    result = await getFilteredEvents({
      search: sp.q,
      displayStatus,
      priceType,
      attendanceMode,
      page,
      limit: 12,
    });
  } catch {
    // DB not configured
  }

  if (result.events.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">Tidak ada event ditemukan.</p>
        <p className="text-muted-foreground text-sm mt-2">Coba ubah filter pencarian kamu.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(result.total / result.limit);

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{result.total} event ditemukan</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {result.events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/events?${new URLSearchParams({ ...Object.fromEntries(Object.entries(sp).filter(([, v]) => v !== undefined) as [string, string][]), page: String(p) }).toString()}`}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                p === page
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-input hover:bg-accent"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EventsPage(props: PageProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Events</h1>

      <div className="mb-8">
        <Suspense>
          <EventsFilter />
        </Suspense>
      </div>

      <Suspense fallback={<EventsLoadingSkeleton />}>
        <EventsList {...props} />
      </Suspense>
    </div>
  );
}

function EventsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-lg border overflow-hidden animate-pulse">
          <div className="aspect-[16/9] bg-muted" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
