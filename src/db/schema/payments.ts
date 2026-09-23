import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { registrations } from "./registrations";
import { adminUsers } from "./admin-users";

export const paymentProviderEnum = pgEnum("payment_provider", [
  "xendit",
  "manual",
  "qris",
]);

export const payments = pgTable(
  "payments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    registrationId: text("registration_id")
      .notNull()
      .references(() => registrations.id),
    provider: paymentProviderEnum("provider").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("IDR"),
    status: text("status").notNull().default("pending"),
    externalPaymentId: text("external_payment_id"),
    externalInvoiceUrl: text("external_invoice_url"),
    paymentProofUrl: text("payment_proof_url"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verifiedBy: text("verified_by").references(() => adminUsers.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("payments_registration_id_idx").on(table.registrationId),
    index("payments_external_payment_id_idx").on(table.externalPaymentId),
    index("payments_status_idx").on(table.status),
  ]
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
