"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events, eventTickets, registrations } from "@/db/schema";
import { eq, and, count, sql, or } from "drizzle-orm";
import { createId, createRegistrationCode } from "@/lib/id";

export async function createRegistration(input: {
  eventId: string;
  ticketId: string;
  name: string;
  email: string;
  phone: string;
}): Promise<
  | { success: false; error: string }
  | { success: true; registrationId: string; registrationCode: string; isFree: boolean }
> {
  // Login is optional: guests may register (identified by email).
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, input.eventId), eq(events.lifecycleStatus, "published")),
  });
  if (!event) {
    return { success: false, error: "Event tidak ditemukan atau sudah tidak tersedia." };
  }

  const ticket = await db.query.eventTickets.findFirst({
    where: and(
      eq(eventTickets.id, input.ticketId),
      eq(eventTickets.eventId, input.eventId),
      eq(eventTickets.isActive, true)
    ),
  });
  if (!ticket) {
    return { success: false, error: "Tiket tidak valid." };
  }

  const now = new Date();
  if (ticket.salesStart && now < ticket.salesStart) {
    return { success: false, error: "Penjualan tiket belum dimulai." };
  }
  if (ticket.salesEnd && now > ticket.salesEnd) {
    return { success: false, error: "Penjualan tiket sudah berakhir." };
  }

  // Paid tickets require an account (needed for the payment flow & tracking).
  // Free tickets allow guest registration.
  if (ticket.price > 0 && !userId) {
    return { success: false, error: "Silakan login terlebih dahulu untuk mendaftar tiket berbayar." };
  }

  // Check duplicate (allow re-register if previous was cancelled).
  // A participant is identified by their account when logged in, otherwise by
  // the email they register with.
  const existing = await db.query.registrations.findFirst({
    where: and(
      eq(registrations.eventId, input.eventId),
      userId
        ? or(eq(registrations.userId, userId), eq(registrations.email, input.email))
        : eq(registrations.email, input.email)
    ),
  });
  if (existing && existing.status !== "cancelled") {
    return { success: false, error: "Kamu sudah memiliki registrasi untuk event ini." };
  }

  // Quota check. A free registration involves no payment/transaction; we simply
  // guard against overselling with a count before insert. (Interactive
  // transactions aren't used — the serverless HTTP driver doesn't support them,
  // and the previous count-then-insert wasn't row-locked anyway.)
  if (ticket.quota !== null) {
    const [soldResult] = await db
      .select({ sold: count(registrations.id) })
      .from(registrations)
      .where(
        and(
          eq(registrations.ticketId, ticket.id),
          sql`${registrations.status} NOT IN ('cancelled')`
        )
      );
    const sold = Number(soldResult?.sold ?? 0);
    if (sold >= ticket.quota) {
      return { success: false, error: "Maaf, tiket ini sudah habis." };
    }
  }

  const registrationCode = createRegistrationCode(now.getFullYear());
  const isFree = ticket.price === 0;

  const [reg] = await db
    .insert(registrations)
    .values({
      id: createId(),
      eventId: input.eventId,
      userId,
      ticketId: ticket.id,
      registrationCode,
      name: input.name,
      email: input.email,
      phone: input.phone,
      status: isFree ? "confirmed" : "pending_payment",
      paymentStatus: isFree ? "paid" : "pending",
      confirmedAt: isFree ? new Date() : null,
    })
    .returning();

  if (!reg) {
    return { success: false, error: "Gagal membuat registrasi." };
  }

  return {
    success: true,
    registrationId: reg.id,
    registrationCode: reg.registrationCode,
    isFree,
  };
}
