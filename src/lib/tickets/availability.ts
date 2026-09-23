import type { EventTicket } from "@/db/schema";

export interface TicketAvailability {
  available: boolean;
  reason?: "sold_out" | "not_started" | "expired" | "inactive";
  remainingQuota?: number;
}

export function getTicketAvailability(
  ticket: EventTicket,
  soldCount: number,
  now: Date = new Date()
): TicketAvailability {
  if (!ticket.isActive) {
    return { available: false, reason: "inactive" };
  }

  if (ticket.salesStart && now < ticket.salesStart) {
    return { available: false, reason: "not_started" };
  }

  if (ticket.salesEnd && now > ticket.salesEnd) {
    return { available: false, reason: "expired" };
  }

  if (ticket.quota !== null && ticket.quota !== undefined) {
    const remaining = ticket.quota - soldCount;
    if (remaining <= 0) {
      return { available: false, reason: "sold_out", remainingQuota: 0 };
    }
    return { available: true, remainingQuota: remaining };
  }

  return { available: true };
}
