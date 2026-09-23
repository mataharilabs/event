"use server";

import { db } from "@/db";
import { registrations, payments, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { createId } from "@/lib/id";
import type { RegistrationStatus } from "@/types";

export async function changeRegistrationStatus(registrationId: string, newStatus: RegistrationStatus) {
  const admin = await requireAdmin();

  const reg = await db.query.registrations.findFirst({ where: eq(registrations.id, registrationId) });
  if (!reg) return { success: false, error: "Registrasi tidak ditemukan." };

  const confirmedAt = newStatus === "confirmed" ? new Date() : reg.confirmedAt;

  await db.update(registrations)
    .set({ status: newStatus, confirmedAt, updatedAt: new Date() })
    .where(eq(registrations.id, registrationId));

  await db.insert(auditLogs).values({
    id: createId(),
    adminId: admin.id,
    action: "CHANGE_REGISTRATION_STATUS",
    entity: "registrations",
    entityId: registrationId,
    before: { status: reg.status },
    after: { status: newStatus },
  });

  revalidatePath("/admin/participants");
  revalidatePath(`/admin/participants/${registrationId}`);

  return { success: true };
}

export async function verifyManualPayment(registrationId: string) {
  const admin = await requireAdmin();

  const reg = await db.query.registrations.findFirst({ where: eq(registrations.id, registrationId) });
  if (!reg) return { success: false, error: "Registrasi tidak ditemukan." };

  const payment = await db.query.payments.findFirst({ where: eq(payments.registrationId, registrationId) });
  if (!payment) return { success: false, error: "Pembayaran tidak ditemukan." };

  await db.transaction(async (tx) => {
    await tx.update(payments)
      .set({ status: "paid", verifiedAt: new Date(), verifiedBy: admin.id, updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    await tx.update(registrations)
      .set({ status: "confirmed", paymentStatus: "paid", confirmedAt: new Date(), updatedAt: new Date() })
      .where(eq(registrations.id, registrationId));

    await tx.insert(auditLogs).values({
      id: createId(),
      adminId: admin.id,
      action: "VERIFY_PAYMENT",
      entity: "payments",
      entityId: payment.id,
      before: { status: payment.status },
      after: { status: "paid" },
    });
  });

  revalidatePath("/admin/participants");
  revalidatePath(`/admin/participants/${registrationId}`);

  // Fire payment confirmation notification (non-blocking)
  firePaymentConfirmedNotification(registrationId).catch((err) =>
    console.error("Payment notification error:", err)
  );

  return { success: true };
}

async function firePaymentConfirmedNotification(registrationId: string) {
  const { db } = await import("@/db");
  const { registrations, payments } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
    with: { event: true, ticket: true },
  });
  if (!reg) return;

  const payment = await db.query.payments.findFirst({
    where: eq(payments.registrationId, registrationId),
  });

  const { sendNotification } = await import("@/services/notification");
  const { paymentConfirmationEmail, paymentConfirmationWhatsApp } = await import(
    "@/services/notification/templates"
  );

  const templateData = {
    name: reg.name,
    registrationCode: reg.registrationCode,
    eventTitle: reg.event.title,
    ticketName: reg.ticket.name,
    ticketPrice: reg.ticket.price,
    startDatetime: reg.event.startDatetime,
    timezone: reg.event.timezone,
    venueName: reg.event.venueName,
    attendanceMode: reg.event.attendanceMode,
    amount: payment?.amount ?? reg.ticket.price,
  };

  await sendNotification({
    registrationId: reg.id,
    eventId: reg.eventId,
    userId: reg.userId,
    type: "payment_confirmation",
    email: { to: reg.email, ...paymentConfirmationEmail(templateData) },
    whatsapp: { to: reg.phone, message: paymentConfirmationWhatsApp(templateData) },
  });
}

export async function rejectManualPayment(registrationId: string) {
  const admin = await requireAdmin();

  const reg = await db.query.registrations.findFirst({ where: eq(registrations.id, registrationId) });
  if (!reg) return { success: false, error: "Registrasi tidak ditemukan." };

  const payment = await db.query.payments.findFirst({ where: eq(payments.registrationId, registrationId) });
  if (!payment) return { success: false, error: "Pembayaran tidak ditemukan." };

  await db.transaction(async (tx) => {
    await tx.update(payments)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(payments.id, payment.id));

    await tx.update(registrations)
      .set({ status: "pending_payment", paymentStatus: "failed", updatedAt: new Date() })
      .where(eq(registrations.id, registrationId));

    await tx.insert(auditLogs).values({
      id: createId(),
      adminId: admin.id,
      action: "REJECT_PAYMENT",
      entity: "payments",
      entityId: payment.id,
      before: { status: payment.status },
      after: { status: "failed" },
    });
  });

  revalidatePath("/admin/participants");
  revalidatePath(`/admin/participants/${registrationId}`);

  return { success: true };
}
