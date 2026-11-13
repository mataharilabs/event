import { z } from "zod";

/**
 * Secret fields use a sentinel: if the form sends `undefined` (field left
 * untouched), the existing stored value is kept; an empty string clears it.
 */
export const updatePaymentSettingsSchema = z.object({
  xenditEnabled: z.boolean(),
  xenditSecretKey: z.string().optional(),
  xenditWebhookToken: z.string().optional(),

  midtransEnabled: z.boolean(),
  midtransServerKey: z.string().optional(),
  midtransClientKey: z.string().optional(),
  midtransIsProduction: z.boolean(),

  bankTransferEnabled: z.boolean(),
  bankName: z.string().max(100).optional(),
  bankAccountNumber: z.string().max(50).optional(),
  bankAccountHolder: z.string().max(120).optional(),
  bankInstructions: z.string().max(1000).optional(),

  qrisEnabled: z.boolean(),
  qrisImageUrl: z.string().url().optional().or(z.literal("")),
});

export type UpdatePaymentSettingsInput = z.infer<typeof updatePaymentSettingsSchema>;
