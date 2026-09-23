import { pgTable, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";

export const otpAttempts = pgTable(
  "otp_attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    phone: text("phone").notNull(),
    otpHash: text("otp_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    used: boolean("used").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("otp_attempts_phone_idx").on(table.phone),
    index("otp_attempts_expires_at_idx").on(table.expiresAt),
  ]
);

export type OtpAttempt = typeof otpAttempts.$inferSelect;
export type NewOtpAttempt = typeof otpAttempts.$inferInsert;
