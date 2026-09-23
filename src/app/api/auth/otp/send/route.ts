import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/otp";

const sendOtpSchema = z.object({
  phone: z.string().min(8).max(20),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    const parsed = sendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Format nomor telepon tidak valid." },
        { status: 400 }
      );
    }

    const result = await sendOtp(parsed.data.phone);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 429 });
    }

    const response: { message: string; otp?: string } = {
      message: "OTP berhasil dikirim.",
    };

    // Only include OTP in dev environment for testing
    if (process.env.NODE_ENV !== "production" && result.otp) {
      response.otp = result.otp;
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
