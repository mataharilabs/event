import { z } from "zod";

export const createTicketSchema = z.object({
  eventId: z.string(),
  name: z.string().min(1, "Nama tiket wajib diisi").max(100),
  description: z.string().optional(),
  price: z.number().int().min(0, "Harga tidak boleh negatif"),
  currency: z.string().default("IDR"),
  quota: z.number().int().positive().optional().nullable(),
  salesStart: z.coerce.date().optional().nullable(),
  salesEnd: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateTicketSchema = createTicketSchema.partial().omit({ eventId: true });

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
