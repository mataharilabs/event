import { db } from "@/db";
import { eventAnalytics } from "@/db/schema";

/**
 * Record a single page_view for an event. Best-effort — analytics must never
 * break the page it is measuring, so failures are swallowed.
 */
export async function recordEventView(eventId: string): Promise<void> {
  try {
    await db.insert(eventAnalytics).values({ eventId, eventType: "page_view" });
  } catch (err) {
    console.error("[analytics] recordEventView failed:", err);
  }
}
