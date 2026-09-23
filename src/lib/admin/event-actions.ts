"use server";

import { db } from "@/db";
import { events, eventTickets, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId, createShortCode } from "@/lib/id";
import { generateSlug, generateUniqueSlug } from "@/lib/events/slug";
import { requireAdmin } from "@/lib/auth/admin";
import { createEventSchema, updateEventSchema } from "@/validations/event";
import { createTicketSchema, updateTicketSchema } from "@/validations/ticket";
import { revalidatePath } from "next/cache";
import type { CreateEventInput, UpdateEventInput } from "@/validations/event";
import type { CreateTicketInput, UpdateTicketInput } from "@/validations/ticket";
import type { AuditAction } from "@/types";

async function logAudit(adminId: string, action: AuditAction, entity: string, entityId: string, before?: unknown, after?: unknown) {
  await db.insert(auditLogs).values({
    adminId,
    action,
    entity,
    entityId,
    before: before ?? null,
    after: after ?? null,
  });
}

export async function createEvent(input: CreateEventInput) {
  const admin = await requireAdmin();
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Input tidak valid." };

  const baseSlug = generateSlug(parsed.data.title);
  const existingSlugs = (await db.select({ slug: events.slug }).from(events)).map((e) => e.slug);
  const slug = generateUniqueSlug(baseSlug, existingSlugs);
  const shortCode = createShortCode();

  const [event] = await db
    .insert(events)
    .values({
      ...parsed.data,
      id: createId(),
      slug,
      shortCode,
      lifecycleStatus: "draft",
      createdBy: admin.id,
    })
    .returning();

  if (!event) return { success: false, error: "Gagal membuat event." };

  await logAudit(admin.id, "CREATE_EVENT", "events", event.id, null, event);
  revalidatePath("/admin/events");

  return { success: true, eventId: event.id, slug: event.slug };
}

export async function updateEvent(eventId: string, input: UpdateEventInput) {
  const admin = await requireAdmin();
  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Input tidak valid." };

  const existing = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!existing) return { success: false, error: "Event tidak ditemukan." };

  const [updated] = await db
    .update(events)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(events.id, eventId))
    .returning();

  await logAudit(admin.id, "UPDATE_EVENT", "events", eventId, existing, updated);
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}`);
  revalidatePath(`/${existing.slug}`);

  return { success: true };
}

export async function publishEvent(eventId: string) {
  const admin = await requireAdmin();
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) return { success: false, error: "Event tidak ditemukan." };
  if (event.lifecycleStatus !== "draft") return { success: false, error: "Hanya draft yang bisa dipublish." };

  await db.update(events)
    .set({ lifecycleStatus: "published", publishedAt: new Date(), updatedAt: new Date() })
    .where(eq(events.id, eventId));

  await logAudit(admin.id, "PUBLISH_EVENT", "events", eventId);
  revalidatePath("/admin/events");
  revalidatePath(`/${event.slug}`);

  return { success: true };
}

export async function cancelEvent(eventId: string) {
  const admin = await requireAdmin();
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) return { success: false, error: "Event tidak ditemukan." };

  await db.update(events)
    .set({ lifecycleStatus: "cancelled", updatedAt: new Date() })
    .where(eq(events.id, eventId));

  await logAudit(admin.id, "CANCEL_EVENT", "events", eventId);
  revalidatePath("/admin/events");

  return { success: true };
}

export async function archiveEvent(eventId: string) {
  const admin = await requireAdmin();
  await db.update(events)
    .set({ lifecycleStatus: "archived", updatedAt: new Date() })
    .where(eq(events.id, eventId));

  await logAudit(admin.id, "ARCHIVE_EVENT", "events", eventId);
  revalidatePath("/admin/events");

  return { success: true };
}

export async function duplicateEvent(eventId: string) {
  const admin = await requireAdmin();
  const source = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: { eventTickets: true },
  });
  if (!source) return { success: false, error: "Event tidak ditemukan." };

  const baseSlug = generateSlug(`${source.title} copy`);
  const existingSlugs = (await db.select({ slug: events.slug }).from(events)).map((e) => e.slug);
  const slug = generateUniqueSlug(baseSlug, existingSlugs);
  const shortCode = createShortCode();

  const result = await db.transaction(async (tx) => {
    const [newEvent] = await tx.insert(events).values({
      id: createId(),
      title: `${source.title} (Copy)`,
      slug,
      shortCode,
      description: source.description,
      primaryImageUrl: source.primaryImageUrl,
      startDatetime: source.startDatetime,
      endDatetime: source.endDatetime,
      timezone: source.timezone,
      attendanceMode: source.attendanceMode,
      venueName: source.venueName,
      venueAddress: source.venueAddress,
      latitude: source.latitude,
      longitude: source.longitude,
      googleMapsUrl: source.googleMapsUrl,
      onlinePlatform: source.onlinePlatform,
      meetingUrl: source.meetingUrl,
      theme: source.theme,
      themeConfig: source.themeConfig,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
      analyticsConfig: source.analyticsConfig,
      lifecycleStatus: "draft",
      createdBy: admin.id,
    }).returning();

    if (!newEvent) throw new Error("Failed to duplicate event");

    if (source.eventTickets.length > 0) {
      await tx.insert(eventTickets).values(
        source.eventTickets.map((t) => ({
          id: createId(),
          eventId: newEvent.id,
          name: t.name,
          description: t.description,
          price: t.price,
          currency: t.currency,
          quota: t.quota,
          salesStart: t.salesStart,
          salesEnd: t.salesEnd,
          isActive: t.isActive,
        }))
      );
    }

    return newEvent;
  });

  await logAudit(admin.id, "DUPLICATE_EVENT", "events", result.id);
  revalidatePath("/admin/events");

  return { success: true, eventId: result.id };
}

// Ticket actions
export async function createTicket(input: CreateTicketInput) {
  await requireAdmin();
  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Input tidak valid." };

  const [ticket] = await db.insert(eventTickets).values({ id: createId(), ...parsed.data }).returning();
  revalidatePath(`/admin/events/${input.eventId}`);

  return { success: true, ticketId: ticket?.id };
}

export async function updateTicket(ticketId: string, input: UpdateTicketInput) {
  const admin = await requireAdmin();
  const parsed = updateTicketSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Input tidak valid." };

  const existing = await db.query.eventTickets.findFirst({ where: eq(eventTickets.id, ticketId) });
  if (!existing) return { success: false, error: "Tiket tidak ditemukan." };

  await db.update(eventTickets).set({ ...parsed.data, updatedAt: new Date() }).where(eq(eventTickets.id, ticketId));

  await logAudit(admin.id, "UPDATE_TICKET", "event_tickets", ticketId);
  revalidatePath(`/admin/events/${existing.eventId}`);

  return { success: true };
}
