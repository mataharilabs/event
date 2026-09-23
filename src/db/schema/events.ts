import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createId } from "@/lib/id";
import { users } from "./users";

export const lifecycleStatusEnum = pgEnum("lifecycle_status", [
  "draft",
  "published",
  "cancelled",
  "archived",
]);

export const attendanceModeEnum = pgEnum("attendance_mode", [
  "online",
  "offline",
  "hybrid",
]);

export const onlinePlatformEnum = pgEnum("online_platform", [
  "google_meet",
  "zoom",
  "microsoft_teams",
  "other",
]);

export const events = pgTable(
  "events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    shortCode: text("short_code").notNull(),
    description: text("description"),
    primaryImageUrl: text("primary_image_url"),

    startDatetime: timestamp("start_datetime", { withTimezone: true }).notNull(),
    endDatetime: timestamp("end_datetime", { withTimezone: true }).notNull(),
    timezone: text("timezone").notNull().default("Asia/Jakarta"),

    attendanceMode: attendanceModeEnum("attendance_mode").notNull().default("offline"),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    latitude: text("latitude"),
    longitude: text("longitude"),
    googleMapsUrl: text("google_maps_url"),

    onlinePlatform: onlinePlatformEnum("online_platform"),
    meetingUrl: text("meeting_url"),
    meetingUrlHidden: text("meeting_url_hidden").default("false"),

    lifecycleStatus: lifecycleStatusEnum("lifecycle_status").notNull().default("draft"),

    theme: text("theme").default("clean"),
    themeConfig: jsonb("theme_config"),

    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ogImageUrl: text("og_image_url"),

    analyticsConfig: jsonb("analytics_config"),

    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("events_slug_idx").on(table.slug),
    uniqueIndex("events_short_code_idx").on(table.shortCode),
    index("events_lifecycle_status_idx").on(table.lifecycleStatus),
    index("events_start_datetime_idx").on(table.startDatetime),
  ]
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
