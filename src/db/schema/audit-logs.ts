import { pgTable, text, timestamp, jsonb, index, pgEnum } from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { adminUsers } from "./admin-users";

export const auditActionEnum = pgEnum("audit_action", [
  "CREATE_EVENT",
  "UPDATE_EVENT",
  "PUBLISH_EVENT",
  "CANCEL_EVENT",
  "ARCHIVE_EVENT",
  "DUPLICATE_EVENT",
  "CREATE_TICKET",
  "UPDATE_TICKET",
  "VERIFY_PAYMENT",
  "REJECT_PAYMENT",
  "CHANGE_REGISTRATION_STATUS",
  "RESEND_NOTIFICATION",
  "EXPORT_PARTICIPANTS",
]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    adminId: text("admin_id")
      .notNull()
      .references(() => adminUsers.id),
    action: auditActionEnum("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_admin_id_idx").on(table.adminId),
    index("audit_logs_entity_id_idx").on(table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
