import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * Singleton table (one row, id = "default") holding platform-wide payment
 * configuration managed by admins at /admin/settings.
 *
 * Secret keys are stored here so admins can configure gateways without a
 * redeploy. They are read server-side only and are NEVER sent to the browser
 * (the admin form receives booleans indicating whether a secret is set).
 */
export const paymentSettings = pgTable("payment_settings", {
  id: text("id").primaryKey().default("default"),

  // Xendit (auto confirmation via webhook)
  xenditEnabled: boolean("xendit_enabled").notNull().default(false),
  xenditSecretKey: text("xendit_secret_key"),
  xenditWebhookToken: text("xendit_webhook_token"),

  // Midtrans (auto confirmation via webhook)
  midtransEnabled: boolean("midtrans_enabled").notNull().default(false),
  midtransServerKey: text("midtrans_server_key"),
  midtransClientKey: text("midtrans_client_key"),
  midtransIsProduction: boolean("midtrans_is_production").notNull().default(false),

  // Bank transfer (manual confirmation)
  bankTransferEnabled: boolean("bank_transfer_enabled").notNull().default(false),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountHolder: text("bank_account_holder"),
  bankInstructions: text("bank_instructions"),

  // Static QRIS (manual confirmation)
  qrisEnabled: boolean("qris_enabled").notNull().default(false),
  qrisImageUrl: text("qris_image_url"),

  // Email notifications (Resend)
  emailEnabled: boolean("email_enabled").notNull().default(false),
  resendApiKey: text("resend_api_key"),
  resendFromEmail: text("resend_from_email"),

  // WhatsApp notifications (internal wa-gateway: POST /send { to, message })
  whatsappEnabled: boolean("whatsapp_enabled").notNull().default(false),
  whatsappApiUrl: text("whatsapp_api_url"),
  whatsappApiKey: text("whatsapp_api_key"),

  // Site branding & default SEO/OG (for the main website)
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  siteSeoTitle: text("site_seo_title"),
  siteSeoDescription: text("site_seo_description"),
  siteOgImageUrl: text("site_og_image_url"),

  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type NewPaymentSettings = typeof paymentSettings.$inferInsert;
