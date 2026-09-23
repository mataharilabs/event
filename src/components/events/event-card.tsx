import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/format";
import { getEventDisplayStatus } from "@/lib/events/display-status";
import type { EventLifecycleStatus } from "@/types";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    slug: string;
    primaryImageUrl: string | null;
    startDatetime: Date;
    endDatetime: Date;
    timezone: string;
    lifecycleStatus: EventLifecycleStatus;
    attendanceMode: string;
    venueName: string | null;
    minPrice: number;
    maxPrice: number;
    totalQuota: number | null;
    soldCount: number;
  };
}

const displayStatusLabel: Record<string, { label: string; variant: "default" | "success" | "warning" | "secondary" | "destructive" | "outline" }> = {
  upcoming: { label: "Upcoming", variant: "default" },
  ongoing: { label: "On Going", variant: "success" },
  past: { label: "Past", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

function getPriceLabel(minPrice: number, maxPrice: number): string {
  if (minPrice === 0 && maxPrice === 0) return "GRATIS";
  if (minPrice === maxPrice) return formatCurrency(minPrice);
  return `Mulai ${formatCurrency(minPrice)}`;
}

function getQuotaLabel(totalQuota: number | null, soldCount: number): string {
  if (totalQuota === null) return "Unlimited";
  const remaining = totalQuota - soldCount;
  if (remaining <= 0) return "SOLD OUT";
  return `${remaining} / ${totalQuota} tersedia`;
}

export function EventCard({ event }: EventCardProps) {
  const displayStatus = getEventDisplayStatus(
    {
      lifecycleStatus: event.lifecycleStatus,
      startDatetime: event.startDatetime,
      endDatetime: event.endDatetime,
    },
    new Date()
  );

  const statusConfig = displayStatusLabel[displayStatus] ?? displayStatusLabel.upcoming;
  const isSoldOut = event.totalQuota !== null && event.soldCount >= event.totalQuota;

  return (
    <Link href={`/${event.slug}`} className="group block">
      <article className="rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-[16/9] bg-muted overflow-hidden">
          {event.primaryImageUrl ? (
            <Image
              src={event.primaryImageUrl}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No Image</span>
            </div>
          )}
          {isSoldOut && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">SOLD OUT</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <Badge variant={statusConfig.variant} className="mb-2">
            {statusConfig.label}
          </Badge>

          <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-3 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{formatDate(event.startDatetime, event.timezone)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {event.attendanceMode === "online" ? "Online" : (event.venueName ?? "TBA")}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5 shrink-0" />
                <span>{getQuotaLabel(event.totalQuota, event.soldCount)}</span>
              </div>
              <span className="font-semibold text-foreground">
                {getPriceLabel(event.minPrice, event.maxPrice)}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
