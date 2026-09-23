import type { EventDisplayStatus, EventLifecycleStatus } from "@/types";

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
