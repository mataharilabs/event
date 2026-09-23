import { pgTable, text, timestamp, integer, boolean, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { events } from "./events";

export const fieldTypeEnum = pgEnum("field_type", [
  "text",
  "number",
  "date",
  "dropdown",
  "radio",
  "checkbox",
  "textarea",
  "file",
]);

export const registrationFields = pgTable(
  "registration_fields",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    fieldKey: text("field_key").notNull(),
    label: text("label").notNull(),
    type: fieldTypeEnum("type").notNull(),
    required: boolean("required").notNull().default(false),
    placeholder: text("placeholder"),
    optionsJson: jsonb("options_json"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("registration_fields_event_id_idx").on(table.eventId)]
);

export type RegistrationField = typeof registrationFields.$inferSelect;
export type NewRegistrationField = typeof registrationFields.$inferInsert;
