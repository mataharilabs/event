// Server-only module: imports the DB and reads secret keys. Never import from a
// client component.
import { db } from "@/db";
import { paymentSettings, type PaymentSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_ID = "default";

/**
 * Full payment settings including secret keys. SERVER-ONLY — never return this
 * to a client component. Creates the singleton row with safe defaults if absent.
 */
export async function getPaymentSettings(): Promise<PaymentSettings> {
  const existing = await db.query.paymentSettings.findFirst({
    where: eq(paymentSettings.id, SETTINGS_ID),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(paymentSettings)
    .values({ id: SETTINGS_ID })
    .onConflictDoNothing()
    .returning();

  // If a concurrent insert won the race, read it back.
  return (
    created ??
    (await db.query.paymentSettings.findFirst({ where: eq(paymentSettings.id, SETTINGS_ID) }))!
  );
}

/**
 * Admin-facing view: secrets replaced by booleans indicating whether a value is
 * stored. Safe to pass to the settings form (client component).
 */
export interface AdminPaymentSettings {
  xenditEnabled: boolean;
  hasXenditSecretKey: boolean;
  hasXenditWebhookToken: boolean;
  midtransEnabled: boolean;
  hasMidtransServerKey: boolean;
  hasMidtransClientKey: boolean;
  midtransIsProduction: boolean;
  bankTransferEnabled: boolean;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  bankInstructions: string;
  qrisEnabled: boolean;
  qrisImageUrl: string | null;
  emailEnabled: boolean;
  hasResendApiKey: boolean;
  resendFromEmail: string;
  whatsappEnabled: boolean;
  whatsappApiUrl: string;
  hasWhatsappApiKey: boolean;
}

export async function getPaymentSettingsForAdmin(): Promise<AdminPaymentSettings> {
  const s = await getPaymentSettings();
  return {
    xenditEnabled: s.xenditEnabled,
    hasXenditSecretKey: !!s.xenditSecretKey,
    hasXenditWebhookToken: !!s.xenditWebhookToken,
    midtransEnabled: s.midtransEnabled,
    hasMidtransServerKey: !!s.midtransServerKey,
    hasMidtransClientKey: !!s.midtransClientKey,
    midtransIsProduction: s.midtransIsProduction,
    bankTransferEnabled: s.bankTransferEnabled,
    bankName: s.bankName ?? "",
    bankAccountNumber: s.bankAccountNumber ?? "",
    bankAccountHolder: s.bankAccountHolder ?? "",
    bankInstructions: s.bankInstructions ?? "",
    qrisEnabled: s.qrisEnabled,
    qrisImageUrl: s.qrisImageUrl,
    emailEnabled: s.emailEnabled,
    hasResendApiKey: !!s.resendApiKey,
    resendFromEmail: s.resendFromEmail ?? "",
    whatsappEnabled: s.whatsappEnabled,
    whatsappApiUrl: s.whatsappApiUrl ?? "",
    hasWhatsappApiKey: !!s.whatsappApiKey,
  };
}

/**
 * Public-safe payment methods for the checkout page. Contains NO secret keys —
 * only which methods are usable and the data a payer needs to see.
 */
export interface EnabledPaymentMethods {
  xendit: boolean;
  midtrans: boolean;
  bankTransfer: {
    enabled: boolean;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    instructions: string;
  };
  qris: {
    enabled: boolean;
    imageUrl: string | null;
  };
}

export async function getEnabledPaymentMethods(): Promise<EnabledPaymentMethods> {
  const s = await getPaymentSettings();

  // A gateway is only usable if enabled AND its required keys are present.
  const xendit = s.xenditEnabled && !!s.xenditSecretKey;
  const midtrans = s.midtransEnabled && !!s.midtransServerKey && !!s.midtransClientKey;
  const bankEnabled = s.bankTransferEnabled && !!s.bankAccountNumber;
  const qrisEnabled = s.qrisEnabled && !!s.qrisImageUrl;

  return {
    xendit,
    midtrans,
    bankTransfer: {
      enabled: bankEnabled,
      bankName: s.bankName ?? "",
      accountNumber: s.bankAccountNumber ?? "",
      accountHolder: s.bankAccountHolder ?? "",
      instructions: s.bankInstructions ?? "",
    },
    qris: {
      enabled: qrisEnabled,
      imageUrl: s.qrisImageUrl,
    },
  };
}
