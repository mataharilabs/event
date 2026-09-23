"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createTicket, updateTicket } from "@/lib/admin/event-actions";
import { formatCurrency } from "@/lib/format";
import { Plus, Pencil, X, Check } from "lucide-react";
import type { EventTicket } from "@/db/schema";

const ticketFormSchema = z.object({
  name: z.string().min(1, "Nama tiket wajib diisi").max(100),
  description: z.string().optional(),
  price: z.coerce.number().int().min(0, "Harga tidak boleh negatif"),
  quota: z.coerce.number().int().positive().optional().nullable(),
  salesStart: z.string().optional(),
  salesEnd: z.string().optional(),
  isActive: z.boolean().default(true),
});

type TicketFormValues = z.infer<typeof ticketFormSchema>;

function toLocalDatetimeString(date: Date | null | undefined): string {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface TicketFormProps {
  eventId: string;
  ticket?: EventTicket;
  onDone: () => void;
}

function TicketForm({ eventId, ticket, onDone }: TicketFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: ticket
      ? {
          name: ticket.name,
          description: ticket.description ?? "",
          price: ticket.price,
          quota: ticket.quota ?? undefined,
          salesStart: toLocalDatetimeString(ticket.salesStart),
          salesEnd: toLocalDatetimeString(ticket.salesEnd),
          isActive: ticket.isActive,
        }
      : { price: 0, isActive: true },
  });

  const onSubmit = (data: TicketFormValues) => {
    setError(null);
    startTransition(async () => {
      const input = {
        ...data,
        ...(ticket ? {} : { eventId }),
        quota: data.quota ?? null,
        salesStart: data.salesStart ? new Date(data.salesStart) : null,
        salesEnd: data.salesEnd ? new Date(data.salesEnd) : null,
      };

      const result = ticket
        ? await updateTicket(ticket.id, input)
        : await createTicket(input as Parameters<typeof createTicket>[0]);

      if (!result.success) {
        setError(result.error ?? "Terjadi kesalahan.");
        return;
      }
      router.refresh();
      onDone();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="border rounded-lg p-4 space-y-3 bg-muted/30">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nama Tiket *</Label>
          <Input size={undefined} {...register("name")} placeholder="Reguler, VIP, ..." className="h-8 text-sm" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Harga (IDR)</Label>
          <Input size={undefined} type="number" min={0} {...register("price")} placeholder="0" className="h-8 text-sm" />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Kuota <span className="text-muted-foreground">(kosongkan = unlimited)</span></Label>
          <Input size={undefined} type="number" min={1} {...register("quota")} placeholder="Unlimited" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Deskripsi</Label>
          <Input size={undefined} {...register("description")} placeholder="Opsional..." className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Penjualan Mulai</Label>
          <Input size={undefined} type="datetime-local" {...register("salesStart")} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Penjualan Berakhir</Label>
          <Input size={undefined} type="datetime-local" {...register("salesEnd")} className="h-8 text-sm" />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending}>
          <Check className="h-3.5 w-3.5 mr-1" />
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDone} disabled={isPending}>
          <X className="h-3.5 w-3.5 mr-1" /> Batal
        </Button>
      </div>
    </form>
  );
}

interface TicketBuilderProps {
  eventId: string;
  tickets: EventTicket[];
}

export function TicketBuilder({ eventId, tickets }: TicketBuilderProps) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {tickets.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
          Belum ada tiket. Klik tombol di bawah untuk menambahkan.
        </p>
      )}

      {tickets.map((ticket) =>
        editingId === ticket.id ? (
          <TicketForm key={ticket.id} eventId={eventId} ticket={ticket} onDone={() => setEditingId(null)} />
        ) : (
          <div key={ticket.id} className="flex items-center gap-3 border rounded-lg px-4 py-3 bg-white">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{ticket.name}</p>
                {!ticket.isActive && <Badge variant="secondary" className="text-xs">Nonaktif</Badge>}
              </div>
              <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                <span>{formatCurrency(ticket.price)}</span>
                <span>Kuota: {ticket.quota ?? "Unlimited"}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setEditingId(ticket.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      )}

      {adding && (
        <TicketForm eventId={eventId} onDone={() => setAdding(false)} />
      )}

      {!adding && editingId === null && (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4 mr-1" /> Tambah Tiket
        </Button>
      )}
    </div>
  );
}
