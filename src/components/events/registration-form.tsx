"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createRegistration } from "@/lib/participant/registration-actions";
import { formatCurrency } from "@/lib/format";
import { CheckCircle2, Ticket } from "lucide-react";
import type { EventTicket } from "@/db/schema";

interface RegistrationFormProps {
  eventId: string;
  eventTitle: string;
  tickets: EventTicket[];
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
}

interface SuccessState {
  registrationCode: string;
  isFree: boolean;
}

export function RegistrationForm({
  eventId,
  eventTitle,
  tickets,
  defaultName,
  defaultEmail,
  defaultPhone,
}: RegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id ?? "");
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTicketId) { setError("Pilih tiket terlebih dahulu."); return; }
    if (!name.trim()) { setError("Nama wajib diisi."); return; }
    if (!email.trim()) { setError("Email wajib diisi."); return; }
    if (!phone.trim()) { setError("Nomor WhatsApp wajib diisi."); return; }

    setError(null);
    startTransition(async () => {
      const result = await createRegistration({
        eventId,
        ticketId: selectedTicketId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess({ registrationCode: result.registrationCode, isFree: result.isFree });
    });
  }

  if (success) {
    return (
      <div className="rounded-xl border bg-card p-6 space-y-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
        <div>
          <h2 className="text-xl font-bold">Registrasi Berhasil!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {success.isFree
              ? "Kamu sudah terdaftar di event ini."
              : "Silakan lanjutkan ke pembayaran untuk mengkonfirmasi tiket."}
          </p>
        </div>
        <div className="bg-muted rounded-lg px-4 py-3">
          <p className="text-xs text-muted-foreground">Kode Registrasi</p>
          <p className="text-lg font-mono font-bold tracking-wider">{success.registrationCode}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Detail registrasi dikirim ke <strong>{email}</strong>
        </p>
        <Button className="w-full" onClick={() => router.push("/my-events")}>
          Lihat Event Saya
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold">Daftar ke Event</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{eventTitle}</p>
      </div>

      {/* Ticket selection */}
      {tickets.length > 1 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Pilih Tiket</Label>
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                  selectedTicketId === ticket.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{ticket.name}</p>
                    {ticket.description && (
                      <p className="text-xs text-muted-foreground">{ticket.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-primary">
                    {ticket.price === 0 ? "GRATIS" : formatCurrency(ticket.price)}
                  </p>
                  {ticket.quota !== null && (
                    <p className="text-xs text-muted-foreground">Kuota: {ticket.quota}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single ticket display */}
      {tickets.length === 1 && selectedTicket && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{selectedTicket.name}</span>
          </div>
          <Badge variant={selectedTicket.price === 0 ? "success" : "default"}>
            {selectedTicket.price === 0 ? "GRATIS" : formatCurrency(selectedTicket.price)}
          </Badge>
        </div>
      )}

      {tickets.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          Belum ada tiket tersedia untuk event ini.
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="reg-name">Nama Lengkap <span className="text-destructive">*</span></Label>
          <Input
            id="reg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama lengkap sesuai KTP"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Email <span className="text-destructive">*</span></Label>
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@contoh.com"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-phone">Nomor WhatsApp <span className="text-destructive">*</span></Label>
          <Input
            id="reg-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            required
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isPending || tickets.length === 0}
      >
        {isPending
          ? "Mendaftar..."
          : selectedTicket?.price === 0
          ? "Daftar Gratis"
          : `Daftar — ${selectedTicket ? formatCurrency(selectedTicket.price) : ""}`}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Dengan mendaftar, kamu menyetujui ketentuan event ini.
      </p>
    </form>
  );
}
