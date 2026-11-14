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
    emailEnabled: d.emailEnabled,
    resendFromEmail: d.resendFromEmail ?? "",
    whatsappEnabled: d.whatsappEnabled,
    whatsappApiUrl: d.whatsappApiUrl ?? "",
    siteSeoTitle: d.siteSeoTitle ?? "",
    siteSeoDescription: d.siteSeoDescription ?? "",
    updatedAt: new Date(),
  };

  if (d.logoUrl !== undefined) update.logoUrl = d.logoUrl || null;
  if (d.faviconUrl !== undefined) update.faviconUrl = d.faviconUrl || null;
  if (d.siteOgImageUrl !== undefined) update.siteOgImageUrl = d.siteOgImageUrl || null;

  if (d.xenditSecretKey !== undefined) update.xenditSecretKey = d.xenditSecretKey || null;
  if (d.xenditWebhookToken !== undefined) update.xenditWebhookToken = d.xenditWebhookToken || null;
  if (d.midtransServerKey !== undefined) update.midtransServerKey = d.midtransServerKey || null;
  if (d.midtransClientKey !== undefined) update.midtransClientKey = d.midtransClientKey || null;
  if (d.qrisImageUrl !== undefined && d.qrisImageUrl !== "") update.qrisImageUrl = d.qrisImageUrl;
  if (d.resendApiKey !== undefined) update.resendApiKey = d.resendApiKey || null;
  if (d.whatsappApiKey !== undefined) update.whatsappApiKey = d.whatsappApiKey || null;

  await db.update(paymentSettings).set(update).where(eq(paymentSettings.id, SETTINGS_ID));

  console.warn("[settings] payment settings updated by admin");
  revalidatePath("/admin/settings");
  // Branding (logo/favicon/site SEO) lives in the public layout + root metadata,
  // which are ISR-cached — revalidate the whole tree so changes show immediately.
  revalidatePath("/", "layout");

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

const ALLOWED_BRANDING_MIME = [...ALLOWED_MIME, "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"];

/** Upload a branding asset (logo/favicon/OG image) and return its public URL. */
export async function uploadBrandingImage(
  formData: FormData
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  await requireAdmin();

  const file = formData.get("file");
  const kind = (formData.get("kind") as string) || "asset";
  if (!(file instanceof File)) return { success: false, error: "File tidak ditemukan." };
  if (!ALLOWED_BRANDING_MIME.includes(file.type)) {
    return { success: false, error: "Format tidak didukung (JPG, PNG, WebP, SVG, ICO)." };
  }
  if (file.size > MAX_BYTES) return { success: false, error: "Ukuran file maksimum 5 MB." };
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { success: false, error: "Storage belum dikonfigurasi (BLOB_READ_WRITE_TOKEN)." };
  }

  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  try {
    const blob = await put(`settings/${kind}-${Date.now()}.${ext}`, file, { access: "public" });
    return { success: true, url: blob.url };
  } catch (err) {
    console.error("[settings] branding upload failed:", err);
    return { success: false, error: "Gagal mengunggah gambar." };
  }
}
