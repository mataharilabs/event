"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createEvent, updateEvent, createTicket } from "@/lib/admin/event-actions";
import type { Event } from "@/db/schema";

const formSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(200),
  description: z.string().optional(),
  startDatetime: z.string().min(1, "Waktu mulai wajib diisi"),
  endDatetime: z.string().min(1, "Waktu selesai wajib diisi"),
  timezone: z.string().default("Asia/Jakarta"),
  attendanceMode: z.enum(["online", "offline", "hybrid"]).default("offline"),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  onlinePlatform: z.enum(["google_meet", "zoom", "microsoft_teams", "other"]).optional(),
  meetingUrl: z.string().optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
}).refine((data) => new Date(data.endDatetime) > new Date(data.startDatetime), {
  message: "Waktu selesai harus setelah waktu mulai",
  path: ["endDatetime"],
});

type FormValues = z.infer<typeof formSchema>;

interface TicketDraft {
  name: string;
  price: number;
  quota: number | null;
  description: string;
}

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface EventFormProps {
  event?: Event;
}

const emptyTicket = (): TicketDraft => ({ name: "", price: 0, quota: null, description: "" });

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: event
      ? {
          title: event.title,
          description: event.description ?? "",
          startDatetime: toLocalDatetimeString(event.startDatetime),
          endDatetime: toLocalDatetimeString(event.endDatetime),
          timezone: event.timezone,
          attendanceMode: event.attendanceMode,
          venueName: event.venueName ?? "",
          venueAddress: event.venueAddress ?? "",
          googleMapsUrl: event.googleMapsUrl ?? "",
          onlinePlatform: event.onlinePlatform ?? undefined,
          meetingUrl: event.meetingUrl ?? "",
          seoTitle: event.seoTitle ?? "",
          seoDescription: event.seoDescription ?? "",
        }
      : {
          timezone: "Asia/Jakarta",
          attendanceMode: "offline",
        },
  });

  const attendanceMode = watch("attendanceMode");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Ticket state (only shown on create)
  const [tickets, setTickets] = useState<TicketDraft[]>([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState<TicketDraft>(emptyTicket());
  const [ticketError, setTicketError] = useState<string | null>(null);

  function addTicket() {
    if (!newTicket.name.trim()) {
      setTicketError("Nama tiket wajib diisi.");
      return;
    }
    setTickets((prev) => [...prev, { ...newTicket }]);
    setNewTicket(emptyTicket());
    setShowTicketForm(false);
    setTicketError(null);
  }

  function removeTicket(index: number) {
    setTickets((prev) => prev.filter((_, i) => i !== index));
  }

  const onSubmit = (data: FormValues) => {
    setSubmitError(null);
    startTransition(async () => {
      const input = {
        ...data,
        startDatetime: new Date(data.startDatetime),
        endDatetime: new Date(data.endDatetime),
        googleMapsUrl: data.googleMapsUrl || undefined,
        meetingUrl: data.meetingUrl || undefined,
        onlinePlatform: data.onlinePlatform || undefined,
        seoTitle: data.seoTitle || undefined,
        seoDescription: data.seoDescription || undefined,
      };

      if (event) {
        const result = await updateEvent(event.id, input);
        if (!result.success) { setSubmitError(result.error ?? "Terjadi kesalahan."); return; }
        router.refresh();
        return;
      }

      const result = await createEvent(input);
      if (!result.success) { setSubmitError(result.error ?? "Terjadi kesalahan."); return; }

      for (const t of tickets) {
        await createTicket({
          eventId: result.eventId,
          name: t.name,
          price: t.price,
          quota: t.quota ?? undefined,
          description: t.description || undefined,
          currency: "IDR",
          isActive: true,
        });
      }
      router.push(`/admin/events/${result.eventId}`);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="font-semibold text-base border-b pb-2">Informasi Dasar</h2>

        <div className="space-y-1.5">
          <Label htmlFor="title">Judul Event <span className="text-destructive">*</span></Label>
          <Input id="title" {...register("title")} placeholder="Nama event..." />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea id="description" {...register("description")} rows={5} placeholder="Deskripsi event..." />
        </div>
      </section>

      {/* Schedule */}
      <section className="space-y-4">
        <h2 className="font-semibold text-base border-b pb-2">Jadwal</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startDatetime">Waktu Mulai <span className="text-destructive">*</span></Label>
            <Input id="startDatetime" type="datetime-local" {...register("startDatetime")} />
            {errors.startDatetime && <p className="text-sm text-destructive">{errors.startDatetime.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="endDatetime">Waktu Selesai <span className="text-destructive">*</span></Label>
            <Input id="endDatetime" type="datetime-local" {...register("endDatetime")} />
            {errors.endDatetime && <p className="text-sm text-destructive">{errors.endDatetime.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" {...register("timezone")} placeholder="Asia/Jakarta" />
        </div>
      </section>

      {/* Location */}
      <section className="space-y-4">
        <h2 className="font-semibold text-base border-b pb-2">Lokasi</h2>

        <div className="space-y-1.5">
          <Label>Mode Kehadiran</Label>
          <Select
            value={attendanceMode}
            onValueChange={(v) => setValue("attendanceMode", v as "online" | "offline" | "hybrid")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(attendanceMode === "offline" || attendanceMode === "hybrid") && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="venueName">Nama Venue</Label>
              <Input id="venueName" {...register("venueName")} placeholder="Nama tempat..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venueAddress">Alamat</Label>
              <Textarea id="venueAddress" {...register("venueAddress")} rows={2} placeholder="Alamat lengkap..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="googleMapsUrl">Google Maps URL</Label>
              <Input id="googleMapsUrl" {...register("googleMapsUrl")} placeholder="https://maps.google.com/..." />
            </div>
          </>
        )}

        {(attendanceMode === "online" || attendanceMode === "hybrid") && (
          <>
            <div className="space-y-1.5">
              <Label>Platform Online</Label>
              <Select
                value={watch("onlinePlatform") ?? ""}
                onValueChange={(v) => setValue("onlinePlatform", v as "google_meet" | "zoom" | "microsoft_teams" | "other")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih platform..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_meet">Google Meet</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="microsoft_teams">Microsoft Teams</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meetingUrl">Meeting URL</Label>
              <Input id="meetingUrl" {...register("meetingUrl")} placeholder="https://..." />
            </div>
          </>
        )}
      </section>

      {/* Tickets — only on create form */}
      {!event && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-semibold text-base">Tiket</h2>
            {!showTicketForm && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setShowTicketForm(true); setTicketError(null); }}
              >
                + Tambah Tiket
              </Button>
            )}
          </div>

          {/* Existing tickets list */}
          {tickets.length > 0 && (
            <div className="space-y-2">
              {tickets.map((t, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border px-4 py-3 bg-muted/40">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.price === 0 ? "Gratis" : `Rp ${t.price.toLocaleString("id-ID")}`}
                      {t.quota !== null ? ` · Kuota: ${t.quota}` : " · Kuota: Tidak terbatas"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeTicket(i)}
                  >
                    Hapus
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* New ticket mini-form */}
          {showTicketForm && (
            <div className="rounded-md border p-4 space-y-3 bg-muted/20">
              <div className="space-y-1.5">
                <Label>Nama Tiket <span className="text-destructive">*</span></Label>
                <Input
                  value={newTicket.name}
                  onChange={(e) => setNewTicket((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Contoh: Early Bird, VIP, Regular..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Harga (Rp) <span className="text-xs text-muted-foreground">— 0 = Gratis</span></Label>
                  <Input
                    type="number"
                    min={0}
                    value={newTicket.price}
                    onChange={(e) => setNewTicket((p) => ({ ...p, price: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Kuota <span className="text-xs text-muted-foreground">— kosong = tidak terbatas</span></Label>
                  <Input
                    type="number"
                    min={1}
                    value={newTicket.quota ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewTicket((p) => ({ ...p, quota: v ? parseInt(v) : null }));
                    }}
                    placeholder="Tidak terbatas"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Deskripsi Tiket <span className="text-xs text-muted-foreground">(opsional)</span></Label>
                <Input
                  value={newTicket.description}
                  onChange={(e) => setNewTicket((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Keterangan tiket..."
                />
              </div>
              {ticketError && <p className="text-sm text-destructive">{ticketError}</p>}
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={addTicket}>Simpan Tiket</Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowTicketForm(false); setNewTicket(emptyTicket()); setTicketError(null); }}
                >
                  Batal
                </Button>
              </div>
            </div>
          )}

          {tickets.length === 0 && !showTicketForm && (
            <p className="text-sm text-muted-foreground">
              Belum ada tiket. Klik <strong>+ Tambah Tiket</strong> untuk menambah tiket gratis atau berbayar.
            </p>
          )}
        </section>
      )}

      {/* SEO */}
      <section className="space-y-4">
        <h2 className="font-semibold text-base border-b pb-2">SEO (Opsional)</h2>

        <div className="space-y-1.5">
          <Label htmlFor="seoTitle">SEO Title <span className="text-xs text-muted-foreground">(max 70)</span></Label>
          <Input id="seoTitle" {...register("seoTitle")} maxLength={70} />
          {errors.seoTitle && <p className="text-sm text-destructive">{errors.seoTitle.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="seoDescription">SEO Description <span className="text-xs text-muted-foreground">(max 160)</span></Label>
          <Textarea id="seoDescription" {...register("seoDescription")} rows={2} maxLength={160} />
          {errors.seoDescription && <p className="text-sm text-destructive">{errors.seoDescription.message}</p>}
        </div>
      </section>

      {submitError && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{submitError}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan..." : event ? "Simpan Perubahan" : "Buat Event"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Batal
        </Button>
      </div>
    </form>
  );
}
