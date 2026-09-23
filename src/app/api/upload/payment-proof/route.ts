import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const registrationId = formData.get("registrationId");

  if (!(file instanceof File) || typeof registrationId !== "string") {
    return NextResponse.json({ error: "Missing file or registrationId" }, { status: 400 });
  }

  // Validate MIME
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Tipe file tidak diizinkan." }, { status: 400 });
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file melebihi 5MB." }, { status: 400 });
  }

  // Verify ownership
  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
  });

  if (!reg || reg.userId !== session.user.id) {
    return NextResponse.json({ error: "Registrasi tidak ditemukan." }, { status: 403 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `payment-proof/${registrationId}-${Date.now()}.${ext}`;

  try {
    const blob = await put(filename, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Blob upload error:", err);
    return NextResponse.json({ error: "Gagal mengunggah file." }, { status: 500 });
  }
}
