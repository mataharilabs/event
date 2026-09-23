import { z } from "zod";

export const createRegistrationSchema = z.object({
  eventId: z.string(),
  ticketId: z.string(),
  name: z.string().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().email("Format email tidak valid"),
  phone: z
    .string()
    .min(10, "Nomor WhatsApp minimal 10 digit")
    .max(15)
    .regex(/^(\+62|62|0)[0-9]{8,13}$/, "Format nomor WhatsApp tidak valid"),
  answers: z.array(
    z.object({
      fieldId: z.string(),
      value: z.string().optional(),
    })
  ).optional(),
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationSchema>;
