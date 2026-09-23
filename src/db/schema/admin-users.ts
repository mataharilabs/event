import { pgTable, text, timestamp, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";

export const adminRoleEnum = pgEnum("admin_role", ["SUPER_ADMIN", "EVENT_ADMIN"]);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: adminRoleEnum("role").notNull().default("EVENT_ADMIN"),
    ssoSubject: text("sso_subject"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("admin_users_email_idx").on(table.email),
    uniqueIndex("admin_users_sso_subject_idx").on(table.ssoSubject),
  ]
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
