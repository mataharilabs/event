import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { registrations, events, eventTickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { Calendar, Ticket } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Events",
  robots: { index: false },
};

const registrationStatusLabel: Record<string, { label: string; variant: "default" | "success" | "secondary" | "warning" | "destructive" | "outline" }> = {
  pending_payment: { label: "Menunggu Pembayaran", variant: "warning" },
  payment_verification: { label: "Verifikasi Pembayaran", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  cancelled: { label: "Dibatalkan", variant: "destructive" },
  waitlisted: { label: "Waitlist", variant: "secondary" },
};

const paymentStatusLabel: Record<string, { label: string; variant: "default" | "success" | "secondary" | "warning" | "destructive" | "outline" }> = {
  pending: { label: "Belum Bayar", variant: "warning" },
  paid: { label: "Lunas", variant: "success" },
  expired: { label: "Kadaluarsa", variant: "destructive" },
  failed: { label: "Gagal", variant: "destructive" },
  cancelled: { label: "Dibatalkan", variant: "secondary" },
};

export default async function MyEventsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my-events");
  }

  const myRegistrations = await db
    .select({
      id: registrations.id,
      registrationCode: registrations.registrationCode,
      status: registrations.status,
      paymentStatus: registrations.paymentStatus,
      registeredAt: registrations.registeredAt,
      eventId: events.id,
      eventTitle: events.title,
      eventSlug: events.slug,
      eventStartDatetime: events.startDatetime,
      eventTimezone: events.timezone,
      ticketName: eventTickets.name,
      ticketPrice: eventTickets.price,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(eventTickets, eq(registrations.ticketId, eventTickets.id))
    .where(eq(registrations.userId, session.user.id))
    .orderBy(registrations.registeredAt);

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">My Events</h1>

      {myRegistrations.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-muted/30">
          <Ticket className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Kamu belum mendaftar event apapun.</p>
          <Button asChild>
            <Link href="/events">Explore Events</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {myRegistrations.map((reg) => {
            const regStatus = registrationStatusLabel[reg.status] ?? registrationStatusLabel.pending_payment;
            const payStatus = paymentStatusLabel[reg.paymentStatus] ?? paymentStatusLabel.pending;

            return (
              <div key={reg.id} className="rounded-xl border bg-white p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold">{reg.eventTitle}</h2>
                  <Badge variant={regStatus.variant} className="shrink-0">{regStatus.label}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(reg.eventStartDatetime, reg.eventTimezone)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5" />
                    {reg.ticketName}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Kode Registrasi</p>
                    <p className="font-mono font-medium">{reg.registrationCode}</p>
                  </div>
                  {reg.ticketPrice > 0 && (
                    <div className="text-right space-y-0.5">
                      <p className="text-xs text-muted-foreground">Status Pembayaran</p>
                      <Badge variant={payStatus.variant}>{payStatus.label}</Badge>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${reg.eventSlug}`}>Lihat Event</Link>
                  </Button>
                  {reg.status === "pending_payment" && (
                    <Button asChild size="sm">
                      <Link href={`/payment/${reg.id}`}>Bayar Sekarang</Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
