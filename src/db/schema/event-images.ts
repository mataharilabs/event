import { pgTable, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { events } from "./events";

export const eventImages = pgTable(
  "event_images",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    altText: text("alt_text"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("event_images_event_id_idx").on(table.eventId)]
);

export type EventImage = typeof eventImages.$inferSelect;
export type NewEventImage = typeof eventImages.$inferInsert;
