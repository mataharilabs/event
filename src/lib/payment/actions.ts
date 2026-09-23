"use server";

import { db } from "@/db";
import { registrations, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@/lib/id";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { PaymentProvider } from "@/types";

export async function initiateXenditPayment(registrationId: string): Promise<
  { success: true; invoiceUrl: string } | { success: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
    with: { ticket: true, event: true },
  });

  if (!reg) return { success: false, error: "Registrasi tidak ditemukan." };
  if (reg.userId !== session.user.id) return { success: false, error: "Akses tidak diizinkan." };
  if (reg.status === "confirmed") return { success: false, error: "Registrasi sudah dikonfirmasi." };

  // Check if active payment already exists
  const existingPayment = await db.query.payments.findFirst({
    where: eq(payments.registrationId, registrationId),
  });

  if (existingPayment?.externalInvoiceUrl && existingPayment.status === "pending") {
    return { success: true, invoiceUrl: existingPayment.externalInvoiceUrl };
  }

  try {
    const { getXenditService } = await import("@/services/payment/xendit");
    const xendit = getXenditService();

    const result = await xendit.createPayment({
      registrationId,
      amount: reg.ticket.price,
      currency: reg.ticket.currency,
      email: reg.email,
      name: reg.name,
      description: `Tiket ${reg.ticket.name} - ${reg.event.title}`,
    });

    const paymentId = createId();
    await db.insert(payments).values({
      id: paymentId,
      registrationId,
      provider: "xendit",
      amount: reg.ticket.price,
      currency: reg.ticket.currency,
      status: "pending",
      externalPaymentId: result.externalPaymentId,
      externalInvoiceUrl: result.invoiceUrl ?? null,
    });

    await db.update(registrations)
      .set({ status: "pending_payment", paymentStatus: "pending", updatedAt: new Date() })
      .where(eq(registrations.id, registrationId));

    return { success: true, invoiceUrl: result.invoiceUrl! };
  } catch (err) {
    console.error("Xendit payment error:", err);
    return { success: false, error: "Gagal membuat tagihan Xendit. Coba lagi." };
  }
}

export async function initiateManualPayment(
  registrationId: string,
  provider: Extract<PaymentProvider, "manual" | "qris">
): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
    with: { ticket: true },
  });

  if (!reg) return { success: false, error: "Registrasi tidak ditemukan." };
  if (reg.userId !== session.user.id) return { success: false, error: "Akses tidak diizinkan." };

  const existing = await db.query.payments.findFirst({
    where: eq(payments.registrationId, registrationId),
  });

  if (existing) return { success: true };

  await db.insert(payments).values({
    id: createId(),
    registrationId,
    provider,
    amount: reg.ticket.price,
    currency: reg.ticket.currency,
    status: "pending",
  });

  await db.update(registrations)
    .set({ status: "payment_verification", paymentStatus: "pending", updatedAt: new Date() })
    .where(eq(registrations.id, registrationId));

  return { success: true };
}

export async function uploadPaymentProof(
  registrationId: string,
  proofUrl: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
  });

  if (!reg || reg.userId !== session.user.id) {
    return { success: false, error: "Akses tidak diizinkan." };
  }

  const payment = await db.query.payments.findFirst({
    where: eq(payments.registrationId, registrationId),
  });

  if (!payment) return { success: false, error: "Pembayaran tidak ditemukan." };

  await db.update(payments)
    .set({ paymentProofUrl: proofUrl, status: "pending", updatedAt: new Date() })
    .where(eq(payments.id, payment.id));

  await db.update(registrations)
    .set({ status: "payment_verification", updatedAt: new Date() })
    .where(eq(registrations.id, registrationId));

  return { success: true };
}
