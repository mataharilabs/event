import { db } from "@/db";
import { events, eventTickets, registrations } from "@/db/schema";
import { eq, and, sql, count, min, max, sum } from "drizzle-orm";
import { getEventDisplayStatus } from "./display-status";
import type { EventCardProps } from "@/components/events/types";

export async function getPublishedEventsForCards(): Promise<EventCardProps["event"][]> {
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      primaryImageUrl: events.primaryImageUrl,
      startDatetime: events.startDatetime,
      endDatetime: events.endDatetime,
      timezone: events.timezone,
      lifecycleStatus: events.lifecycleStatus,
      attendanceMode: events.attendanceMode,
      venueName: events.venueName,
      minPrice: min(eventTickets.price),
      maxPrice: max(eventTickets.price),
      totalQuota: sum(eventTickets.quota),
    })
    .from(events)
    .leftJoin(eventTickets, and(eq(eventTickets.eventId, events.id), eq(eventTickets.isActive, true)))
    .where(eq(events.lifecycleStatus, "published"))
    .groupBy(events.id)
    .orderBy(events.startDatetime);

  const soldCounts = await db
    .select({
      eventId: registrations.eventId,
      soldCount: count(registrations.id),
    })
    .from(registrations)
    .where(
      sql`${registrations.status} NOT IN ('cancelled', 'waitlisted')`
    )
    .groupBy(registrations.eventId);

  const soldMap = new Map(soldCounts.map((r) => [r.eventId, r.soldCount]));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    primaryImageUrl: row.primaryImageUrl,
    startDatetime: row.startDatetime,
    endDatetime: row.endDatetime,
    timezone: row.timezone,
    lifecycleStatus: row.lifecycleStatus,
    attendanceMode: row.attendanceMode,
    venueName: row.venueName,
    minPrice: Number(row.minPrice ?? 0),
    maxPrice: Number(row.maxPrice ?? 0),
    totalQuota: row.totalQuota !== null ? Number(row.totalQuota) : null,
    soldCount: soldMap.get(row.id) ?? 0,
  }));
}

export async function getEventBySlug(slug: string) {
  return db.query.events.findFirst({
    where: and(eq(events.slug, slug), eq(events.lifecycleStatus, "published")),
    with: {
      eventImages: { orderBy: (img, ops) => [ops.asc(img.sortOrder)] },
      eventTickets: { where: (t, ops) => ops.eq(t.isActive, true) },
    },
  });
}

export interface EventsFilter {
  search?: string;
  displayStatus?: "upcoming" | "ongoing" | "past";
  attendanceMode?: "online" | "offline";
  priceType?: "free" | "paid";
  page?: number;
  limit?: number;
}

export async function getFilteredEvents(filter: EventsFilter = {}) {
  const allEvents = await getPublishedEventsForCards();
  const now = new Date();

  let filtered = allEvents;

  if (filter.search) {
    const q = filter.search.toLowerCase();
    filtered = filtered.filter((e) => e.title.toLowerCase().includes(q));
  }

  if (filter.displayStatus) {
    filtered = filtered.filter(
      (e) =>
        getEventDisplayStatus(
          { lifecycleStatus: e.lifecycleStatus, startDatetime: e.startDatetime, endDatetime: e.endDatetime },
          now
        ) === filter.displayStatus
    );
  }

  if (filter.attendanceMode) {
    filtered = filtered.filter((e) => e.attendanceMode === filter.attendanceMode);
  }

  if (filter.priceType === "free") {
    filtered = filtered.filter((e) => e.minPrice === 0 && e.maxPrice === 0);
  } else if (filter.priceType === "paid") {
    filtered = filtered.filter((e) => e.minPrice > 0 || e.maxPrice > 0);
  }

  const page = filter.page ?? 1;
  const limit = filter.limit ?? 12;
  const offset = (page - 1) * limit;
  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return { events: paginated, total, page, limit };
}
