import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@/lib/id";
import type { NotificationType } from "@/types";

interface SendNotificationParams {
  registrationId: string;
  eventId: string;
  userId: string;
  type: NotificationType;
  email: { to: string; subject: string; html: string; text?: string } | null;
  whatsapp: { to: string; message: string } | null;
}

async function sendEmailNotif(
  notifId: string,
  email: { to: string; subject: string; html: string; text?: string }
) {
  try {
    const { getEmailService } = await import("@/services/email/resend");
    const svc = getEmailService();
    const result = await svc.sendEmail(email);
    await db
      .update(notifications)
      .set({ status: "sent", sentAt: new Date(), providerMessageId: result.messageId })
      .where(eq(notifications.id, notifId));
  } catch (err) {
    await db
      .update(notifications)
      .set({ status: "failed", errorMessage: err instanceof Error ? err.message : String(err) })
      .where(eq(notifications.id, notifId));
  }
}

async function sendWhatsAppNotif(notifId: string, wa: { to: string; message: string }) {
  try {
    const { getWhatsAppService } = await import("@/services/whatsapp/provider");
    const svc = getWhatsAppService();
    const result = await svc.sendMessage({ to: wa.to, message: wa.message });
    await db
      .update(notifications)
      .set({ status: "sent", sentAt: new Date(), providerMessageId: result.messageId })
      .where(eq(notifications.id, notifId));
  } catch (err) {
    await db
      .update(notifications)
      .set({ status: "failed", errorMessage: err instanceof Error ? err.message : String(err) })
      .where(eq(notifications.id, notifId));
  }
}

export async function sendNotification(params: SendNotificationParams) {
  const { registrationId, eventId, userId, type } = params;
  const tasks: Array<Promise<void>> = [];

  if (params.email) {
    const notifId = createId();
    await db.insert(notifications).values({
      id: notifId, registrationId, eventId, userId,
      channel: "email", type, status: "pending",
    });
    tasks.push(sendEmailNotif(notifId, params.email));
  }

  if (params.whatsapp) {
    const notifId = createId();
    await db.insert(notifications).values({
      id: notifId, registrationId, eventId, userId,
      channel: "whatsapp", type, status: "pending",
    });
    tasks.push(sendWhatsAppNotif(notifId, params.whatsapp));
  }

  // Failures must not break caller
  await Promise.allSettled(tasks);
}
