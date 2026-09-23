import { pgTable, text, index } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { registrations } from "./registrations";
import { registrationFields } from "./registration-fields";

export const registrationAnswers = pgTable(
  "registration_answers",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    registrationId: text("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    fieldId: text("field_id")
      .notNull()
      .references(() => registrationFields.id),
    value: text("value"),
  },
  (table) => [index("registration_answers_registration_id_idx").on(table.registrationId)]
);

export type RegistrationAnswer = typeof registrationAnswers.$inferSelect;
export type NewRegistrationAnswer = typeof registrationAnswers.$inferInsert;
