import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@/lib/id";
import type { NotificationType } from "@/types";
import type { EmailService } from "@/services/email/types";
import type { WhatsAppService } from "@/services/whatsapp/types";

interface SendNotificationParams {
  registrationId: string;
  eventId: string;
  userId: string | null;
  type: NotificationType;
  email: { to: string; subject: string; html: string; text?: string } | null;
  whatsapp: { to: string; message: string } | null;
}

async function sendEmailNotif(
  svc: EmailService,
  notifId: string,
  email: { to: string; subject: string; html: string; text?: string }
) {
  try {
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

async function sendWhatsAppNotif(
  svc: WhatsAppService,
  notifId: string,
  wa: { to: string; message: string }
) {
  try {
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

  const { getEmailService } = await import("@/services/email/resend");
  const { getWhatsAppService } = await import("@/services/whatsapp/provider");
  const [emailSvc, waSvc] = await Promise.all([
    getEmailService().catch(() => null),
    getWhatsAppService().catch(() => null),
  ]);

  const tasks: Array<Promise<void>> = [];

  if (params.email && emailSvc) {
    const notifId = createId();
    await db.insert(notifications).values({
      id: notifId, registrationId, eventId, userId,
      channel: "email", type, status: "pending",
    });
    tasks.push(sendEmailNotif(emailSvc, notifId, params.email));
  }

  if (params.whatsapp && waSvc) {
    const notifId = createId();
    await db.insert(notifications).values({
      id: notifId, registrationId, eventId, userId,
      channel: "whatsapp", type, status: "pending",
    });
    tasks.push(sendWhatsAppNotif(waSvc, notifId, params.whatsapp));
  }

  // Failures must not break the caller.
  await Promise.allSettled(tasks);
}
