import type { MetadataRoute } from "next";
import { APP_URL } from "@/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${APP_URL}/events`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  try {
    const { db } = await import("@/db");
    const { events } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const publishedEvents = await db
      .select({ slug: events.slug, updatedAt: events.updatedAt })
      .from(events)
      .where(eq(events.lifecycleStatus, "published"));

    const eventUrls: MetadataRoute.Sitemap = publishedEvents.map((e) => ({
      url: `${APP_URL}/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    return [...base, ...eventUrls];
  } catch {
    return base;
  }
}
