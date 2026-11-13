import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { payments, registrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@/lib/id";

/**
 * Midtrans payment notification webhook.
 * Signature is verified with SHA512(order_id + status_code + gross_amount +
 * serverKey). order_id is our registrationId. Processing is idempotent.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const p = body as {
    order_id?: string;
    transaction_status?: string;
    fraud_status?: string;
    signature_key?: string;
    gross_amount?: string;
    payment_type?: string;
    transaction_id?: string;
  };

  const registrationId = p.order_id;
  if (!registrationId || !p.signature_key) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Verify signature against admin-configured server key.
  const { getMidtransService } = await import("@/services/payment/midtrans");
  const midtrans = await getMidtransService();
  if (!midtrans) {
    return NextResponse.json({ error: "Midtrans not configured" }, { status: 503 });
  }
  const valid = await midtrans.verifyWebhook(body, p.signature_key);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
    with: { ticket: true },
  });
  if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });

  const existingPayment = await db.query.payments.findFirst({
    where: eq(payments.registrationId, registrationId),
  });

  // Idempotency: already paid → acknowledge.
  if (existingPayment?.status === "paid") {
    return NextResponse.json({ received: true });
  }

  const status = p.transaction_status;
  const isPaid =
    status === "settlement" || (status === "capture" && p.fraud_status === "accept");
  const isFailed = status === "deny" || status === "cancel" || status === "expire";

  if (isPaid) {
    const paymentOp = existingPayment
      ? db
          .update(payments)
          .set({
            status: "paid",
            paidAt: new Date(),
            externalPaymentId: p.transaction_id ?? existingPayment.externalPaymentId,
            updatedAt: new Date(),
          })
          .where(eq(payments.id, existingPayment.id))
      : db.insert(payments).values({
          id: createId(),
          registrationId,
          provider: "midtrans",
          amount: reg.ticket.price,
          currency: reg.ticket.currency,
          status: "paid",
          externalPaymentId: p.transaction_id ?? registrationId,
          paidAt: new Date(),
        });

    await db.batch([
      paymentOp,
      db
        .update(registrations)
        .set({
          status: "confirmed",
          paymentStatus: "paid",
          confirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(registrations.id, registrationId)),
    ]);
  } else if (isFailed && existingPayment) {
    await db.batch([
      db.update(payments).set({ status: "failed", updatedAt: new Date() }).where(eq(payments.id, existingPayment.id)),
      db.update(registrations).set({ paymentStatus: "failed", updatedAt: new Date() }).where(eq(registrations.id, registrationId)),
    ]);
  }

  return NextResponse.json({ received: true });
}
