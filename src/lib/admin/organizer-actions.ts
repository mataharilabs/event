"use server";

import { db } from "@/db";
import { organizers, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidatePath } from "next/cache";
import { createId } from "@/lib/id";
import { generateSlug, generateUniqueSlug } from "@/lib/events/slug";
import { z } from "zod";

const organizerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(120),
  logoUrl: z.string().optional(),
  website: z.string().max(300).optional(),
  description: z.string().max(1000).optional(),
});

export type OrganizerInput = z.infer<typeof organizerSchema>;

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = generateSlug(name);
  const rows = await db.select({ slug: organizers.slug, id: organizers.id }).from(organizers);
  const taken = rows.filter((r) => r.id !== excludeId).map((r) => r.slug);
  return generateUniqueSlug(base, taken);
}

export async function createOrganizer(input: OrganizerInput) {
  await requireAdmin();
  const parsed = organizerSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid." };
  const d = parsed.data;

  const slug = await uniqueSlug(d.name);
  const [org] = await db
    .insert(organizers)
    .values({
      id: createId(),
      name: d.name,
      slug,
      logoUrl: d.logoUrl || null,
      website: d.website || null,
      description: d.description || null,
    })
    .returning();

  revalidatePath("/admin/organizers");
  return { success: true as const, organizerId: org?.id };
}

export async function updateOrganizer(id: string, input: OrganizerInput) {
  await requireAdmin();
  const parsed = organizerSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Input tidak valid." };
  const d = parsed.data;

  const existing = await db.query.organizers.findFirst({ where: eq(organizers.id, id) });
  if (!existing) return { success: false as const, error: "Penyelenggara tidak ditemukan." };

  const slug = existing.name === d.name ? existing.slug : await uniqueSlug(d.name, id);

  await db
    .update(organizers)
    .set({
      name: d.name,
      slug,
      logoUrl: d.logoUrl || null,
      website: d.website || null,
      description: d.description || null,
      updatedAt: new Date(),
    })
    .where(eq(organizers.id, id));

  revalidatePath("/admin/organizers");
  return { success: true as const };
}

export async function deleteOrganizer(id: string) {
  await requireAdmin();
  // events.organizer_id has ON DELETE SET NULL, so events are detached, not removed.
  await db.delete(organizers).where(eq(organizers.id, id));
  revalidatePath("/admin/organizers");
  revalidatePath("/admin/events");
  return { success: true as const };
}

export async function getOrganizersWithCounts() {
  const rows = await db
    .select({
      id: organizers.id,
      name: organizers.name,
      slug: organizers.slug,
      logoUrl: organizers.logoUrl,
      website: organizers.website,
      description: organizers.description,
    })
    .from(organizers)
    .orderBy(organizers.name);

  const counts = await db
    .select({ organizerId: events.organizerId })
    .from(events);
  const countMap = new Map<string, number>();
  for (const e of counts) {
    if (e.organizerId) countMap.set(e.organizerId, (countMap.get(e.organizerId) ?? 0) + 1);
  }

  return rows.map((o) => ({ ...o, eventCount: countMap.get(o.id) ?? 0 }));
}

export async function getOrganizersForSelect() {
  return db.select({ id: organizers.id, name: organizers.name }).from(organizers).orderBy(organizers.name);
}
