import { pgTable, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { events } from "./events";

export const shortLinks = pgTable(
  "short_links",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    shortCode: text("short_code").notNull(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("short_links_short_code_idx").on(table.shortCode),
    index("short_links_event_id_idx").on(table.eventId),
  ]
);

export type ShortLink = typeof shortLinks.$inferSelect;
export type NewShortLink = typeof shortLinks.$inferInsert;
