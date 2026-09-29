import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { eventImages, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@/lib/id";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function requireAdminSession() {
  const session = await auth();
  const eventRole = session?.user?.apps?.["EVENT"];
  if (!eventRole) return null;
  return session;
}

// POST /api/admin/event-images — upload new image
export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const file = formData.get("file");
  const eventId = formData.get("eventId");

  if (!(file instanceof File) || typeof eventId !== "string" || !eventId) {
    return NextResponse.json({ error: "file and eventId are required" }, { status: 400 });
  }

  if (!ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: "Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimum 5 MB." }, { status: 400 });
  }

  // Verify event exists
  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) {
    return NextResponse.json({ error: "Event tidak ditemukan." }, { status: 404 });
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const filename = `events/${eventId}/${createId()}.${ext}`;

  const blob = await put(filename, file, { access: "public" });

  // Save to DB
  const [img] = await db
    .insert(eventImages)
    .values({
      id: createId(),
      eventId,
      imageUrl: blob.url,
      sortOrder: 0,
    })
    .returning();

  return NextResponse.json({ id: img?.id, url: blob.url });
}

// DELETE /api/admin/event-images?imageId=xxx — delete an image
export async function DELETE(request: Request) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return NextResponse.json({ error: "imageId required" }, { status: 400 });
  }

  const img = await db.query.eventImages.findFirst({ where: eq(eventImages.id, imageId) });
  if (!img) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  // Delete from Blob
  try {
    await del(img.imageUrl);
  } catch {
    // If blob delete fails, still remove from DB
  }

  await db.delete(eventImages).where(eq(eventImages.id, imageId));

  return NextResponse.json({ ok: true });
}
