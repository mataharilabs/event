import { createHash, randomInt } from "crypto";
import { db } from "@/db";
import { otpAttempts, users } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { createId } from "@/lib/id";
import { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS } from "@/config";

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

export interface OtpSendResult {
  success: boolean;
  error?: string;
  otp?: string; // only returned in dev for testing
}

export async function sendOtp(phone: string): Promise<OtpSendResult> {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return { success: false, error: "Format nomor telepon tidak valid." };
  }

  // Rate limit: max 3 OTP per 5 minutes
  const recentAttempts = await db
    .select({ id: otpAttempts.id })
    .from(otpAttempts)
    .where(
      and(
        eq(otpAttempts.phone, normalizedPhone),
        gt(otpAttempts.expiresAt, new Date())
      )
    );

  if (recentAttempts.length >= 3) {
    return { success: false, error: "Terlalu banyak permintaan OTP. Tunggu beberapa menit." };
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(otpAttempts).values({
    id: createId(),
    phone: normalizedPhone,
    otpHash,
    expiresAt,
    attempts: 0,
    used: false,
  });

  // Send via WhatsApp provider
  try {
    await sendWhatsAppOtp(normalizedPhone, otp);
  } catch (err) {
    console.error("Failed to send WhatsApp OTP:", err);
    // In production, return error. In dev, continue for testing.
    if (process.env.NODE_ENV === "production") {
      return { success: false, error: "Gagal mengirim OTP. Coba lagi." };
    }
    return { success: true, otp }; // dev only
  }

  return { success: true };
}

export interface OtpVerifyResult {
  success: boolean;
  error?: string;
  token?: string;
  userId?: string;
}

export async function verifyOtp(phone: string, otp: string): Promise<OtpVerifyResult> {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return { success: false, error: "Format nomor telepon tidak valid." };
  }

  const attempt = await db.query.otpAttempts.findFirst({
    where: and(
      eq(otpAttempts.phone, normalizedPhone),
      eq(otpAttempts.used, false),
      gt(otpAttempts.expiresAt, new Date())
    ),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  if (!attempt) {
    return { success: false, error: "OTP tidak ditemukan atau sudah kadaluarsa." };
  }

  if (attempt.attempts >= OTP_MAX_ATTEMPTS) {
    return { success: false, error: "Terlalu banyak percobaan. Minta OTP baru." };
  }

  const inputHash = hashOtp(otp);

  if (inputHash !== attempt.otpHash) {
    await db
      .update(otpAttempts)
      .set({ attempts: attempt.attempts + 1 })
      .where(eq(otpAttempts.id, attempt.id));

    const remaining = OTP_MAX_ATTEMPTS - attempt.attempts - 1;
    return {
      success: false,
      error: `OTP salah. ${remaining} percobaan tersisa.`,
    };
  }

  // Mark as used
  await db.update(otpAttempts).set({ used: true }).where(eq(otpAttempts.id, attempt.id));

  // Find or create user
  let user = await db.query.users.findFirst({
    where: eq(users.phone, normalizedPhone),
  });

  if (!user) {
    const [newUser] = await db
      .insert(users)
      .values({
        name: normalizedPhone,
        email: `${normalizedPhone}@whatsapp.local`,
        phone: normalizedPhone,
        authProvider: "whatsapp",
        authProviderId: normalizedPhone,
      })
      .returning();
    user = newUser;
  }

  if (!user) {
    return { success: false, error: "Gagal membuat akun." };
  }

  const token = createOtpSessionToken(user.id, normalizedPhone);
  return { success: true, token, userId: user.id };
}

function createOtpSessionToken(userId: string, phone: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ userId, phone, iat: Date.now(), type: "otp" })
  ).toString("base64url");
  return `${header}.${payload}.unsigned`;
}

export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) return `+${digits}`;
  if (digits.startsWith("0")) return `+62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `+62${digits}`;
  return null;
}

async function sendWhatsAppOtp(phone: string, otp: string): Promise<void> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error("WhatsApp API not configured");
  }

  const message = `Kode OTP AsiaCommerce Event kamu adalah: *${otp}*\n\nBerlaku 5 menit. Jangan bagikan ke siapapun.`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ phone, message }),
  });

  if (!res.ok) {
    throw new Error(`WhatsApp API error: ${res.status}`);
  }
}
