import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { events } from "./events";
import { users } from "./users";
import { eventTickets } from "./event-tickets";

export const registrationStatusEnum = pgEnum("registration_status", [
  "pending_payment",
  "payment_verification",
  "confirmed",
  "cancelled",
  "waitlisted",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "expired",
  "failed",
  "cancelled",
]);

export const registrations = pgTable(
  "registrations",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => eventTickets.id),
    registrationCode: text("registration_code").notNull(),

    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),

    status: registrationStatusEnum("status").notNull().default("pending_payment"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),

    registeredAt: timestamp("registered_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("registrations_code_idx").on(table.registrationCode),
    index("registrations_event_id_idx").on(table.eventId),
    index("registrations_user_id_idx").on(table.userId),
    index("registrations_status_idx").on(table.status),
    index("registrations_event_user_idx").on(table.eventId, table.userId),
  ]
);

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
