import { pgTable, text, timestamp, integer, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { events } from "./events";

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "page_view",
  "registration_started",
  "registration_completed",
  "payment_started",
  "payment_completed",
]);

export const eventAnalytics = pgTable(
  "event_analytics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    eventType: analyticsEventTypeEnum("event_type").notNull(),
    visitorId: text("visitor_id"),
    sessionId: text("session_id"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
    count: integer("count").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("event_analytics_event_id_idx").on(table.eventId),
    index("event_analytics_event_type_idx").on(table.eventType),
    index("event_analytics_created_at_idx").on(table.createdAt),
  ]
);

export type EventAnalytic = typeof eventAnalytics.$inferSelect;
export type NewEventAnalytic = typeof eventAnalytics.$inferInsert;
