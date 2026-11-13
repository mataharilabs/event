import type { EventDisplayStatus, EventLifecycleStatus } from "@/types";
import { daysUntil } from "@/lib/format";

interface EventTimings {
  lifecycleStatus: EventLifecycleStatus;
  startDatetime: Date;
  endDatetime: Date;
}

export function getEventDisplayStatus(event: EventTimings, now: Date = new Date()): EventDisplayStatus {
  if (event.lifecycleStatus === "cancelled") {
    return "cancelled";
  }

  if (now < event.startDatetime) {
    return "upcoming";
  }

  if (now >= event.startDatetime && now <= event.endDatetime) {
    return "ongoing";
  }

  return "past";
}

/**
 * Short label for the card's top-right pill: a live/past marker, or a
 * countdown like "2 hari lagi" for upcoming events.
 */
export function getCountdownLabel(
  displayStatus: EventDisplayStatus,
  startDatetime: Date,
  now: Date = new Date()
): string {
  switch (displayStatus) {
    case "cancelled":
      return "Dibatalkan";
    case "ongoing":
      return "Berlangsung";
    case "past":
      return "Selesai";
    default: {
      const days = daysUntil(startDatetime, now);
      if (days <= 0) return "Hari ini";
      if (days === 1) return "Besok";
      return `${days} hari lagi`;
    }
  }
}
