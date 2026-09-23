import { z } from "zod";

const eventBaseSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(200),
  description: z.string().optional(),
  startDatetime: z.coerce.date(),
  endDatetime: z.coerce.date(),
  timezone: z.string().default("Asia/Jakarta"),
  attendanceMode: z.enum(["online", "offline", "hybrid"]).default("offline"),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
  onlinePlatform: z.enum(["google_meet", "zoom", "microsoft_teams", "other"]).optional(),
  meetingUrl: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
});

export const createEventSchema = eventBaseSchema.refine(
  (data) => data.endDatetime > data.startDatetime,
  {
    message: "Waktu selesai harus setelah waktu mulai",
    path: ["endDatetime"],
  }
);

export const updateEventSchema = eventBaseSchema.partial();

export const publishEventSchema = z.object({
  eventId: z.string(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
