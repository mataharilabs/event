import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { payments, registrations } from "@/db/schema";
import { eq } from "drizzle-orm";

// Xendit sends x-callback-token header for verification
export async function POST(request: NextRequest) {
  const callbackToken = request.headers.get("x-callback-token");
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;

  if (!expectedToken || callbackToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Validate shape
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).external_id !== "string" ||
    typeof (body as Record<string, unknown>).status !== "string"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const payload = body as {
    id: string;
    external_id: string;
    status: string;
    paid_amount?: number;
    paid_at?: string;
  };

  const registrationId = payload.external_id;
  const xenditStatus = payload.status.toUpperCase();

  // Idempotency: find existing payment by external_id
  const existingPayment = await db.query.payments.findFirst({
    where: eq(payments.externalPaymentId, payload.id),
  });

  if (existingPayment?.status === "paid") {
    // Already processed — safe to return 200
    return NextResponse.json({ received: true });
  }

  if (xenditStatus === "PAID" || xenditStatus === "SETTLED") {
    try {
      await db.transaction(async (tx) => {
        // Update payment
        if (existingPayment) {
          await tx
            .update(payments)
            .set({
              status: "paid",
              paidAt: payload.paid_at ? new Date(payload.paid_at) : new Date(),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, existingPayment.id));
        } else {
          // Payment record not pre-created — create it now
          const { createId } = await import("@/lib/id");
          await tx.insert(payments).values({
            id: createId(),
            registrationId,
            provider: "xendit",
            amount: payload.paid_amount ?? 0,
            currency: "IDR",
            status: "paid",
            externalPaymentId: payload.id,
            paidAt: payload.paid_at ? new Date(payload.paid_at) : new Date(),
          });
        }

        // Update registration
        await tx
          .update(registrations)
          .set({
            status: "confirmed",
            paymentStatus: "paid",
            confirmedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(registrations.id, registrationId));
      });

      // Fire payment confirmation notification (non-blocking)
      firePaymentNotification(registrationId).catch((err) =>
        console.error("Payment notification error:", err)
      );
    } catch (err) {
      console.error("Xendit webhook processing error:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  } else if (xenditStatus === "EXPIRED") {
    await db
      .update(payments)
      .set({ status: "expired", updatedAt: new Date() })
      .where(eq(payments.registrationId, registrationId));

    await db
      .update(registrations)
      .set({ paymentStatus: "expired", updatedAt: new Date() })
      .where(eq(registrations.id, registrationId));
  }

  return NextResponse.json({ received: true });
}

async function firePaymentNotification(registrationId: string) {
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

  const emailTpl = paymentConfirmationEmail(templateData);
  const waTpl = paymentConfirmationWhatsApp(templateData);

  await sendNotification({
    registrationId: reg.id,
    eventId: reg.eventId,
    userId: reg.userId,
    type: "payment_confirmation",
    email: { to: reg.email, ...emailTpl },
    whatsapp: { to: reg.phone, message: waTpl },
  });
}
