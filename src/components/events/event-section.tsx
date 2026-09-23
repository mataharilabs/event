import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EventCard } from "./event-card";
import type { EventCardProps } from "./types";

interface EventSectionProps {
  title: string;
  events: EventCardProps["event"][];
  viewAllHref?: string;
  emptyMessage?: string;
}

export function EventSection({ title, events, viewAllHref, emptyMessage }: EventSectionProps) {
  if (events.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <p className="text-muted-foreground">{emptyMessage ?? "Tidak ada event saat ini."}</p>
      </section>
    );
  }

  const displayed = events.slice(0, 4);
  const hasMore = events.length > 4;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        {(hasMore || viewAllHref) && (
          <Link
            href={viewAllHref ?? "/events"}
            className="flex items-center gap-1 text-sm text-primary hover:underline font-medium"
          >
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayed.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}
