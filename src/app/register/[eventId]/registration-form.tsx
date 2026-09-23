"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle } from "lucide-react";
import { createRegistrationSchema, type CreateRegistrationInput } from "@/validations/registration";
import { createRegistration } from "@/lib/registration/actions";
import { formatCurrency } from "@/lib/format";
import type { Event, EventTicket, RegistrationField } from "@/db/schema";

interface RegistrationFormProps {
  event: Event;
  tickets: EventTicket[];
  customFields: RegistrationField[];
  userId: string;
  userEmail: string;
  userName: string;
}

export function RegistrationForm({
  event,
  tickets,
  customFields,
  userId,
  userEmail,
  userName,
}: RegistrationFormProps) {
  const router = useRouter();
  const [selectedTicketId, setSelectedTicketId] = useState(tickets[0]?.id ?? "");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [registrationCode, setRegistrationCode] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateRegistrationInput>({
    resolver: zodResolver(createRegistrationSchema),
    defaultValues: {
      eventId: event.id,
      ticketId: selectedTicketId,
      name: userName,
      email: userEmail,
      phone: "",
      answers: customFields.map((f) => ({ fieldId: f.id, value: "" })),
    },
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  async function onSubmit(data: CreateRegistrationInput) {
    setSubmitError("");
    const result = await createRegistration(userId, { ...data, ticketId: selectedTicketId });

    if (!result.success) {
      setSubmitError(result.error ?? "Gagal mendaftar.");
      return;
    }

    setRegistrationCode(result.registrationCode ?? "");
    setSubmitted(true);

    if (selectedTicket && selectedTicket.price > 0) {
      router.push(`/payment/${result.registrationId}`);
    }
  }

  if (submitted && selectedTicket?.price === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold">Pendaftaran Berhasil!</h2>
        <p className="text-muted-foreground">Kode registrasi kamu:</p>
        <p className="text-2xl font-mono font-bold text-primary">{registrationCode}</p>
        <p className="text-sm text-muted-foreground">
          Konfirmasi telah dikirim ke email dan WhatsApp kamu.
        </p>
        <Button asChild className="mt-4">
          <Link href="/my-events">Lihat My Events</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Ticket selection */}
      {tickets.length > 1 && (
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-semibold">Pilih Tiket</h2>
          {tickets.map((ticket) => (
            <label
              key={ticket.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedTicketId === ticket.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="ticket"
                  value={ticket.id}
                  checked={selectedTicketId === ticket.id}
                  onChange={() => setSelectedTicketId(ticket.id)}
                  className="accent-primary"
                />
                <div>
                  <p className="font-medium">{ticket.name}</p>
                  {ticket.description && (
                    <p className="text-xs text-muted-foreground">{ticket.description}</p>
                  )}
                </div>
              </div>
              <Badge variant={ticket.price === 0 ? "success" : "default"}>
                {ticket.price === 0 ? "GRATIS" : formatCurrency(ticket.price)}
              </Badge>
            </label>
          ))}
        </div>
      )}

      {/* Data diri */}
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <h2 className="font-semibold">Data Diri</h2>

        <input type="hidden" {...register("eventId")} />
        <input type="hidden" {...register("ticketId")} value={selectedTicketId} />

        <div>
          <Label htmlFor="name">Nama Lengkap *</Label>
          <Input id="name" {...register("name")} className="mt-1" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" {...register("email")} className="mt-1" />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Nomor WhatsApp *</Label>
          <Input id="phone" type="tel" placeholder="08xxxxxxxxxx" {...register("phone")} className="mt-1" />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>

        {/* Custom fields */}
        {customFields.map((field, idx) => (
          <div key={field.id}>
            <Label htmlFor={`field-${field.id}`}>
              {field.label} {field.required && "*"}
            </Label>
            {field.type === "textarea" ? (
              <textarea
                id={`field-${field.id}`}
                placeholder={field.placeholder ?? ""}
                {...register(`answers.${idx}.value`)}
                className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <Input
                id={`field-${field.id}`}
                type={field.type === "number" ? "number" : "text"}
                placeholder={field.placeholder ?? ""}
                {...register(`answers.${idx}.value`)}
                className="mt-1"
              />
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      {selectedTicket && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-3">Ringkasan</h2>
          <div className="flex items-center justify-between text-sm">
            <span>{selectedTicket.name}</span>
            <span className="font-semibold">
              {selectedTicket.price === 0 ? "GRATIS" : formatCurrency(selectedTicket.price)}
            </span>
          </div>
        </div>
      )}

      {submitError && (
        <p className="text-sm text-red-600 text-center">{submitError}</p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {selectedTicket?.price === 0 ? "Daftar Sekarang" : "Lanjut ke Pembayaran"}
      </Button>
    </form>
  );
}
