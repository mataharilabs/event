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

  // Send confirmation (free) or payment link (paid) via email + WhatsApp.
  // Awaited so the external calls complete before the serverless function ends;
  // internally resilient (never throws, skips disabled channels).
  await fireRegistrationNotification({
    reg,
    event,
    ticket,
    userId,
    isFree,
  }).catch((err) => console.error("Registration notification error:", err));

  return {
    success: true,
    registrationId: reg.id,
    registrationCode: reg.registrationCode,
    isFree,
  };
}

async function fireRegistrationNotification(args: {
  reg: { id: string; registrationCode: string; name: string; email: string; phone: string };
  event: { id: string; title: string; slug: string; startDatetime: Date; timezone: string; venueName: string | null; attendanceMode: string };
  ticket: { name: string; price: number };
  userId: string | null;
  isFree: boolean;
}) {
  const { reg, event, ticket, userId, isFree } = args;
  const { sendNotification } = await import("@/services/notification");
  const {
    registrationConfirmationEmail,
    registrationConfirmationWhatsApp,
    paymentPendingEmail,
    paymentPendingWhatsApp,
  } = await import("@/services/notification/templates");
  const { APP_URL } = await import("@/config");

  const base = {
    registrationCode: reg.registrationCode,
    name: reg.name,
    eventTitle: event.title,
    ticketName: ticket.name,
    ticketPrice: ticket.price,
    startDatetime: event.startDatetime,
    timezone: event.timezone,
    venueName: event.venueName,
    attendanceMode: event.attendanceMode,
  };

  let email: { to: string; subject: string; html: string; text?: string };
  let whatsapp: { to: string; message: string };

  if (isFree) {
    email = { to: reg.email, ...registrationConfirmationEmail(base) };
    whatsapp = { to: reg.phone, message: registrationConfirmationWhatsApp(base) };
  } else {
    const paymentUrl = `${APP_URL}/payment/${reg.id}`;
    email = { to: reg.email, ...paymentPendingEmail({ ...base, amount: ticket.price, paymentUrl }) };
    whatsapp = {
      to: reg.phone,
      message: paymentPendingWhatsApp({
        name: reg.name,
        eventTitle: event.title,
        registrationCode: reg.registrationCode,
        amount: ticket.price,
        paymentUrl,
      }),
    };
  }

  await sendNotification({
    registrationId: reg.id,
    eventId: event.id,
    userId,
    type: "registration_confirmation",
    email,
    whatsapp,
  });
}
