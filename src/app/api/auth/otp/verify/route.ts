import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/otp";

const verifyOtpSchema = z.object({
  phone: z.string().min(8).max(20),
  otp: z.string().length(6).regex(/^\d+$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown;
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Input tidak valid." },
        { status: 400 }
      );
    }

    const result = await verifyOtp(parsed.data.phone, parsed.data.otp);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ token: result.token, userId: result.userId });
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
