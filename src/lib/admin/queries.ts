import { db } from "@/db";
import { events, eventTickets, registrations, payments } from "@/db/schema";
import { eq, sql, and, count, ilike, or } from "drizzle-orm";
import type { EventLifecycleStatus, RegistrationStatus } from "@/types";
import { getEventDisplayStatus } from "@/lib/events/display-status";

export async function getDashboardMetrics() {
  const [allEvents, allRegistrations, revenueResult] = await Promise.all([
    db.select({ id: events.id, lifecycleStatus: events.lifecycleStatus, startDatetime: events.startDatetime, endDatetime: events.endDatetime })
      .from(events),
    db.select({ status: registrations.status, paymentStatus: registrations.paymentStatus })
      .from(registrations),
    db.select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)::int` })
      .from(payments)
      .where(eq(payments.status, "paid")),
  ]);

  const now = new Date();
  const publishedEvents = allEvents.filter((e) => e.lifecycleStatus === "published");
  const upcomingCount = publishedEvents.filter(
    (e) => getEventDisplayStatus({ lifecycleStatus: e.lifecycleStatus, startDatetime: e.startDatetime, endDatetime: e.endDatetime }, now) === "upcoming"
  ).length;
  const ongoingCount = publishedEvents.filter(
    (e) => getEventDisplayStatus({ lifecycleStatus: e.lifecycleStatus, startDatetime: e.startDatetime, endDatetime: e.endDatetime }, now) === "ongoing"
  ).length;

  const confirmedCount = allRegistrations.filter((r) => r.status === "confirmed").length;
  const pendingPaymentCount = allRegistrations.filter((r) => r.paymentStatus === "pending").length;

  return {
    totalEvents: allEvents.length,
    publishedEvents: publishedEvents.length,
    upcomingCount,
    ongoingCount,
    totalRegistrations: allRegistrations.length,
    confirmedCount,
    pendingPaymentCount,
    totalRevenue: revenueResult[0]?.total ?? 0,
  };
}

export async function getAdminEvents(filter?: {
  search?: string;
  status?: EventLifecycleStatus;
  page?: number;
  pageSize?: number;
}) {
  const page = filter?.page ?? 1;
  const pageSize = filter?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (filter?.status) conditions.push(eq(events.lifecycleStatus, filter.status));
  if (filter?.search) {
    conditions.push(or(
      ilike(events.title, `%${filter.search}%`),
      ilike(events.slug, `%${filter.search}%`),
    ));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      shortCode: events.shortCode,
      lifecycleStatus: events.lifecycleStatus,
      startDatetime: events.startDatetime,
      endDatetime: events.endDatetime,
      attendanceMode: events.attendanceMode,
      createdAt: events.createdAt,
      registrationCount: count(registrations.id),
    })
      .from(events)
      .leftJoin(registrations, and(
        eq(registrations.eventId, events.id),
        sql`${registrations.status} NOT IN ('cancelled')`
      ))
      .where(where)
      .groupBy(events.id)
      .orderBy(sql`${events.createdAt} DESC`)
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(events).where(where),
  ]);

  return { rows, total: countResult[0]?.count ?? 0, page, pageSize };
}

export async function getAdminEventDetail(eventId: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      eventTickets: { orderBy: (t, ops) => [ops.asc(t.createdAt)] },
    },
  });
  return event ?? null;
}

export async function getAdminParticipants(filter?: {
  search?: string;
  eventId?: string;
  status?: RegistrationStatus;
  page?: number;
  pageSize?: number;
}) {
  const page = filter?.page ?? 1;
  const pageSize = filter?.pageSize ?? 25;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (filter?.eventId) conditions.push(eq(registrations.eventId, filter.eventId));
  if (filter?.status) conditions.push(eq(registrations.status, filter.status));
  if (filter?.search) {
    conditions.push(or(
      ilike(registrations.name, `%${filter.search}%`),
      ilike(registrations.email, `%${filter.search}%`),
      ilike(registrations.phone, `%${filter.search}%`),
      ilike(registrations.registrationCode, `%${filter.search}%`),
    ));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db.select({
      id: registrations.id,
      registrationCode: registrations.registrationCode,
      name: registrations.name,
      email: registrations.email,
      phone: registrations.phone,
      status: registrations.status,
      paymentStatus: registrations.paymentStatus,
      registeredAt: registrations.registeredAt,
      eventId: registrations.eventId,
      eventTitle: events.title,
      ticketName: eventTickets.name,
      ticketPrice: eventTickets.price,
    })
      .from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(eventTickets, eq(registrations.ticketId, eventTickets.id))
      .where(where)
      .orderBy(sql`${registrations.registeredAt} DESC`)
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(registrations).where(where),
  ]);

  return { rows, total: countResult[0]?.count ?? 0, page, pageSize };
}

export async function getAdminRegistrationDetail(registrationId: string) {
  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
    with: {
      event: true,
      ticket: true,
      user: true,
    },
  });
  if (!reg) return null;

  const payment = await db.query.payments.findFirst({
    where: eq(payments.registrationId, registrationId),
    orderBy: (p, ops) => [ops.desc(p.createdAt)],
  });

  return { ...reg, payment: payment ?? null };
}

export async function getAdminEventsForSelect() {
  return db.select({ id: events.id, title: events.title })
    .from(events)
    .orderBy(sql`${events.createdAt} DESC`);
}

export async function getRecentEvents(limit = 10) {
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      lifecycleStatus: events.lifecycleStatus,
      startDatetime: events.startDatetime,
      endDatetime: events.endDatetime,
      registrationCount: count(registrations.id),
    })
    .from(events)
    .leftJoin(registrations, and(
      eq(registrations.eventId, events.id),
      sql`${registrations.status} NOT IN ('cancelled')`
    ))
    .groupBy(events.id)
    .orderBy(sql`${events.createdAt} DESC`)
    .limit(limit);

  return rows;
}
