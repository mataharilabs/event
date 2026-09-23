"use server";

import { db } from "@/db";
import { registrations, registrationAnswers, eventTickets, events } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createRegistrationCode, createId } from "@/lib/id";
import type { CreateRegistrationInput } from "@/validations/registration";

export interface CreateRegistrationResult {
  success: boolean;
  error?: string;
  registrationId?: string;
  registrationCode?: string;
}

export async function createRegistration(
  userId: string,
  input: CreateRegistrationInput
): Promise<CreateRegistrationResult> {
  try {
    // Check for existing active registration
    const existing = await db.query.registrations.findFirst({
      where: and(
        eq(registrations.eventId, input.eventId),
        eq(registrations.userId, userId),
        sql`${registrations.status} NOT IN ('cancelled')`
      ),
    });

    if (existing) {
      return { success: false, error: "Kamu sudah memiliki registrasi aktif untuk event ini." };
    }

    // Validate ticket exists and is active
    const ticket = await db.query.eventTickets.findFirst({
      where: and(eq(eventTickets.id, input.ticketId), eq(eventTickets.isActive, true)),
    });

    if (!ticket) {
      return { success: false, error: "Tiket tidak ditemukan atau tidak aktif." };
    }

    const now = new Date();
    if (ticket.salesStart && now < ticket.salesStart) {
      return { success: false, error: "Penjualan tiket belum dimulai." };
    }
    if (ticket.salesEnd && now > ticket.salesEnd) {
      return { success: false, error: "Penjualan tiket sudah berakhir." };
    }

    // Get event info
    const event = await db.query.events.findFirst({
      where: and(eq(events.id, input.eventId), eq(events.lifecycleStatus, "published")),
    });

    if (!event) {
      return { success: false, error: "Event tidak ditemukan." };
    }

    // Use DB transaction to prevent overselling
    const result = await db.transaction(async (tx) => {
      // Re-check quota inside transaction
      if (ticket.quota !== null) {
        const [{ soldCount }] = await tx
          .select({ soldCount: sql<number>`count(*)::int` })
          .from(registrations)
          .where(
            and(
              eq(registrations.ticketId, ticket.id),
              sql`${registrations.status} NOT IN ('cancelled', 'waitlisted')`
            )
          );

        if (soldCount >= ticket.quota) {
          throw new Error("QUOTA_EXCEEDED");
        }
      }

      const registrationCode = createRegistrationCode(new Date().getFullYear());

      const isFreeEvent = ticket.price === 0;
      const initialStatus = isFreeEvent ? "confirmed" : "pending_payment";
      const initialPaymentStatus = isFreeEvent ? "paid" : "pending";

      const [registration] = await tx
        .insert(registrations)
        .values({
          id: createId(),
          eventId: input.eventId,
          userId,
          ticketId: input.ticketId,
          registrationCode,
          name: input.name,
          email: input.email,
          phone: input.phone,
          status: initialStatus,
          paymentStatus: initialPaymentStatus,
          confirmedAt: isFreeEvent ? new Date() : null,
        })
        .returning();

      if (!registration) throw new Error("Failed to create registration");

      // Save custom field answers
      if (input.answers && input.answers.length > 0) {
        await tx.insert(registrationAnswers).values(
          input.answers
            .filter((a) => a.value)
            .map((a) => ({
              id: createId(),
              registrationId: registration.id,
              fieldId: a.fieldId,
              value: a.value,
            }))
        );
      }

      return registration;
    });

    // Send confirmation for free events (non-blocking)
    if (result.status === "confirmed") {
      fireRegistrationNotification(result, event, ticket).catch((err) =>
        console.error("Notification error:", err)
      );
    }

    return {
      success: true,
      registrationId: result.id,
      registrationCode: result.registrationCode,
    };
  } catch (err) {
    if (err instanceof Error && err.message === "QUOTA_EXCEEDED") {
      return { success: false, error: "Tiket habis. Kuota sudah penuh." };
    }
    console.error("Registration error:", err);
    return { success: false, error: "Gagal membuat registrasi. Coba lagi." };
  }
}

async function fireRegistrationNotification(
  reg: { id: string; userId: string; eventId: string; registrationCode: string; name: string; email: string; phone: string },
  event: { title: string; startDatetime: Date; timezone: string; venueName?: string | null; attendanceMode: string },
  ticket: { name: string; price: number },
) {
  const { sendNotification } = await import("@/services/notification");
  const { registrationConfirmationEmail, registrationConfirmationWhatsApp } = await import(
    "@/services/notification/templates"
  );

  const templateData = {
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

  const emailTpl = registrationConfirmationEmail(templateData);
  const waTpl = registrationConfirmationWhatsApp(templateData);

  await sendNotification({
    registrationId: reg.id,
    eventId: reg.eventId,
    userId: reg.userId,
    type: "registration_confirmation",
    email: { to: reg.email, ...emailTpl },
    whatsapp: { to: reg.phone, message: waTpl },
  });
}
