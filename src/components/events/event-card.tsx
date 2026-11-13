"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Ticket, Clock } from "lucide-react";
import { formatCurrency, formatDateBadge, formatDayName, formatTime } from "@/lib/format";
import { getEventDisplayStatus, getCountdownLabel } from "@/lib/events/display-status";
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

const countdownToneByStatus: Record<string, string> = {
  ongoing: "bg-green-600/90 text-white",
  upcoming: "bg-black/70 text-white",
  past: "bg-gray-500/80 text-white",
  cancelled: "bg-red-600/90 text-white",
};

function priceLabel(minPrice: number, maxPrice: number): string {
  if (minPrice === 0 && maxPrice === 0) return "Gratis";
  if (minPrice === maxPrice) return formatCurrency(minPrice);
  return `Mulai ${formatCurrency(minPrice)}`;
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();

  const displayStatus = getEventDisplayStatus(
    {
      lifecycleStatus: event.lifecycleStatus,
      startDatetime: event.startDatetime,
      endDatetime: event.endDatetime,
    },
    new Date()
  );

  const badge = formatDateBadge(event.startDatetime, event.timezone);
  const countdown = getCountdownLabel(displayStatus, event.startDatetime);
  const dayName = formatDayName(event.startDatetime, event.timezone);
  const time = formatTime(event.startDatetime, event.timezone);
  const isFree = event.minPrice === 0 && event.maxPrice === 0;
  const isSoldOut = event.totalQuota !== null && event.soldCount >= event.totalQuota;

  function handleOpen(e: React.MouseEvent) {
    // Let modified/middle clicks open the standalone detail page.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    // Read current URL at click time (avoids useSearchParams, which would force
    // a Suspense boundary on statically-rendered pages).
    const params = new URLSearchParams(window.location.search);
    params.set("event", event.slug);
    router.push(`${window.location.pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <a
      href={`/${event.slug}`}
      onClick={handleOpen}
      className="group block rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Poster over a blurred fill of the same image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-900">
        {event.primaryImageUrl ? (
          <>
            <Image
              src={event.primaryImageUrl}
              alt=""
              aria-hidden
              fill
              className="object-cover scale-110 blur-xl opacity-60"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            <Image
              src={event.primaryImageUrl}
              alt={event.title}
              fill
              className="object-contain"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}

        {/* Date badge — top-left */}
        <div className="absolute top-3 left-3 bg-white rounded-xl shadow-sm px-2.5 py-1.5 text-center leading-none">
          <div className="text-[10px] font-semibold text-primary tracking-wide">{badge.month}</div>
          <div className="text-xl font-bold text-gray-900 mt-0.5">{badge.day}</div>
        </div>

        {/* Countdown / status — top-right */}
        <div
          className={`absolute top-3 right-3 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${countdownToneByStatus[displayStatus] ?? countdownToneByStatus.upcoming}`}
        >
          {countdown}
        </div>

        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">SOLD OUT</span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Day + time — below image, above title */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="capitalize">{dayName}</span>
          <span>·</span>
          <span>{time}</span>
        </div>

        <h3 className="font-semibold text-base leading-tight line-clamp-2 mb-3 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            {event.attendanceMode === "online" ? (
              <Calendar className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <MapPin className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="truncate">
              {event.attendanceMode === "online" ? "Online" : event.venueName ?? "TBA"}
            </span>
          </div>

          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isFree ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            <Ticket className="h-3 w-3" />
            {priceLabel(event.minPrice, event.maxPrice)}
          </span>
        </div>
      </div>
    </a>
  );
}
