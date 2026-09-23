import {
  pgTable,
  text,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { registrations } from "./registrations";
import { events } from "./events";
import { users } from "./users";

export const notificationTypeEnum = pgEnum("notification_type", [
  "registration_confirmation",
  "payment_confirmation",
  "event_reminder_1d",
  "event_day",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "whatsapp",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "cancelled",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    registrationId: text("registration_id").references(() => registrations.id),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    channel: notificationChannelEnum("channel").notNull(),
    type: notificationTypeEnum("type").notNull(),
    status: notificationStatusEnum("status").notNull().default("pending"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    providerMessageId: text("provider_message_id"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_registration_id_idx").on(table.registrationId),
    index("notifications_event_id_idx").on(table.eventId),
    index("notifications_status_idx").on(table.status),
    index("notifications_scheduled_at_idx").on(table.scheduledAt),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
