"use server";

import { put } from "@vercel/blob";
import { db } from "@/db";
import { paymentSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { getPaymentSettings } from "@/lib/settings/payment";
import {
  updatePaymentSettingsSchema,
  type UpdatePaymentSettingsInput,
} from "@/validations/payment-settings";

const SETTINGS_ID = "default";
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function updatePaymentSettings(
  input: UpdatePaymentSettingsInput
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();

  const parsed = updatePaymentSettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Input tidak valid." };
  const d = parsed.data;

  // Ensure the row exists.
  await getPaymentSettings();

  // Secret fields: `undefined` means "unchanged" (keep stored value); a provided
  // string (incl. empty) overwrites. Non-secret fields are always written.
  const update: Record<string, unknown> = {
    xenditEnabled: d.xenditEnabled,
    midtransEnabled: d.midtransEnabled,
    midtransIsProduction: d.midtransIsProduction,
    bankTransferEnabled: d.bankTransferEnabled,
    bankName: d.bankName ?? "",
    bankAccountNumber: d.bankAccountNumber ?? "",
    bankAccountHolder: d.bankAccountHolder ?? "",
    bankInstructions: d.bankInstructions ?? "",
    qrisEnabled: d.qrisEnabled,
    updatedAt: new Date(),
  };

  if (d.xenditSecretKey !== undefined) update.xenditSecretKey = d.xenditSecretKey || null;
  if (d.xenditWebhookToken !== undefined) update.xenditWebhookToken = d.xenditWebhookToken || null;
  if (d.midtransServerKey !== undefined) update.midtransServerKey = d.midtransServerKey || null;
  if (d.midtransClientKey !== undefined) update.midtransClientKey = d.midtransClientKey || null;
  if (d.qrisImageUrl !== undefined && d.qrisImageUrl !== "") update.qrisImageUrl = d.qrisImageUrl;

  await db.update(paymentSettings).set(update).where(eq(paymentSettings.id, SETTINGS_ID));

  console.warn("[settings] payment settings updated by admin");
  revalidatePath("/admin/settings");

  return { success: true };
}

/**
 * Upload a static QRIS image to Blob and store its URL on the settings row.
 * Returns the public URL so the form can preview it immediately.
 */
export async function uploadQrisImage(
  formData: FormData
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) return { success: false, error: "File tidak ditemukan." };
  if (!ALLOWED_MIME.includes(file.type)) {
    return { success: false, error: "Gunakan gambar JPG, PNG, atau WebP." };
  }
  if (file.size > MAX_BYTES) return { success: false, error: "Ukuran file maksimum 5 MB." };

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { success: false, error: "Storage belum dikonfigurasi (BLOB_READ_WRITE_TOKEN)." };
  }

  const ext = file.type.split("/")[1] ?? "png";
  try {
    const blob = await put(`settings/qris-${Date.now()}.${ext}`, file, { access: "public" });
    await getPaymentSettings();
    await db
      .update(paymentSettings)
      .set({ qrisImageUrl: blob.url, updatedAt: new Date() })
      .where(eq(paymentSettings.id, SETTINGS_ID));
    revalidatePath("/admin/settings");
    return { success: true, url: blob.url };
  } catch (err) {
    console.error("[settings] QRIS upload failed:", err);
    return { success: false, error: "Gagal mengunggah gambar QRIS." };
  }
}
