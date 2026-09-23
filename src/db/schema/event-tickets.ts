import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { events } from "./events";

export const eventTickets = pgTable(
  "event_tickets",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").notNull().default(0),
    currency: text("currency").notNull().default("IDR"),
    quota: integer("quota"),
    salesStart: timestamp("sales_start", { withTimezone: true }),
    salesEnd: timestamp("sales_end", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("event_tickets_event_id_idx").on(table.eventId)]
);

export type EventTicket = typeof eventTickets.$inferSelect;
export type NewEventTicket = typeof eventTickets.$inferInsert;
