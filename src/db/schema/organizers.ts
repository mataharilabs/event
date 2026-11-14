import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";

export const organizers = pgTable(
  "organizers",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    logoUrl: text("logo_url"),
    website: text("website"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("organizers_slug_idx").on(table.slug)]
);

export type Organizer = typeof organizers.$inferSelect;
export type NewOrganizer = typeof organizers.$inferInsert;
