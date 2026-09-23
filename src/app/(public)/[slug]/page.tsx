import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/events/countdown";
import { ShareButtons } from "@/components/events/share-buttons";
import { getEventBySlug } from "@/lib/events/queries";
import { getEventDisplayStatus } from "@/lib/events/display-status";
import { buildEventMetadata, buildEventStructuredData } from "@/lib/seo/metadata";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import { APP_URL } from "@/config";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Tidak Ditemukan" };
  return buildEventMetadata(event);
}

const displayStatusConfig: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" }> = {
  upcoming: { label: "Upcoming", variant: "default" },
  ongoing: { label: "On Going", variant: "success" },
  past: { label: "Past", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug).catch(() => null);

  if (!event) notFound();

  const now = new Date();
  const displayStatus = getEventDisplayStatus(
    { lifecycleStatus: event.lifecycleStatus, startDatetime: event.startDatetime, endDatetime: event.endDatetime },
    now
  );
  const statusConfig = displayStatusConfig[displayStatus] ?? displayStatusConfig.upcoming;
  const eventUrl = `${APP_URL}/${slug}`;

  const activeTickets = event.eventTickets.filter((t) => {
    if (!t.isActive) return false;
    if (t.salesStart && now < t.salesStart) return false;
    if (t.salesEnd && now > t.salesEnd) return false;
    return true;
  });

  const minPrice = activeTickets.length > 0 ? Math.min(...activeTickets.map((t) => t.price)) : 0;
  const maxPrice = activeTickets.length > 0 ? Math.max(...activeTickets.map((t) => t.price)) : 0;

  const structuredData = buildEventStructuredData({
    ...event,
    price: minPrice,
    currency: activeTickets[0]?.currency,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero image */}
        {event.primaryImageUrl && (
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-6 bg-muted">
            <Image
              src={event.primaryImageUrl}
              alt={event.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
        )}

        {/* Gallery thumbnails */}
        {event.eventImages.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {event.eventImages.map((img) => (
              <div
                key={img.id}
                className="relative w-20 h-14 shrink-0 rounded-md overflow-hidden bg-muted cursor-pointer"
              >
                <Image src={img.imageUrl} alt={img.altText ?? event.title} fill className="object-cover" sizes="80px" />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Badge variant={statusConfig.variant} className="mb-3">
                {statusConfig.label}
              </Badge>
              <h1 className="text-3xl font-bold">{event.title}</h1>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Tanggal</p>
                  <p className="font-medium">{formatDate(event.startDatetime, event.timezone)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Waktu</p>
                  <p className="font-medium">
                    {formatTime(event.startDatetime, event.timezone)} – {formatTime(event.endDatetime, event.timezone)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Lokasi</p>
                  {event.attendanceMode === "online" ? (
                    <p className="font-medium">Online</p>
                  ) : (
                    <>
                      <p className="font-medium">{event.venueName ?? "TBA"}</p>
                      {event.venueAddress && (
                        <p className="text-sm text-muted-foreground">{event.venueAddress}</p>
                      )}
                      {event.googleMapsUrl && (
                        <a
                          href={event.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          Buka di Google Maps <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Countdown */}
            {displayStatus === "upcoming" && (
              <div className="p-4 bg-primary/5 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-3">Event dimulai dalam:</p>
                <Countdown targetDate={event.startDatetime} />
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Tentang Event</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                  {event.description}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="pt-4 border-t">
              <ShareButtons url={eventUrl} title={event.title} />
            </div>
          </div>

          {/* Sidebar — registration */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border bg-card p-5 shadow-sm space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Harga</p>
                <p className="text-2xl font-bold text-primary">
                  {minPrice === 0 && maxPrice === 0
                    ? "GRATIS"
                    : minPrice === maxPrice
                    ? formatCurrency(minPrice)
                    : `Mulai ${formatCurrency(minPrice)}`}
                </p>
              </div>

              {/* Tickets list */}
              {activeTickets.length > 0 && (
                <div className="space-y-2">
                  {activeTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{ticket.name}</span>
                      <span className="text-muted-foreground">
                        {ticket.price === 0 ? "Gratis" : formatCurrency(ticket.price)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                {displayStatus === "past" ? (
                  <Button className="w-full" disabled>
                    Event Telah Selesai
                  </Button>
                ) : displayStatus === "cancelled" ? (
                  <Button className="w-full" variant="destructive" disabled>
                    Event Dibatalkan
                  </Button>
                ) : (
                  <Button asChild className="w-full" size="lg">
                    <Link href={`/register/${event.id}`}>Daftar Sekarang</Link>
                  </Button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
