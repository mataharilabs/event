import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { db } from "@/db";
import { registrations, events, eventTickets } from "@/db/schema";
import { eq, and } from "drizzle-orm";

function escapeCsv(val: unknown): string {
  const str = val == null ? "" : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields: unknown[]): string {
  return fields.map(escapeCsv).join(",");
}

export async function GET(request: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const eventId = searchParams.get("eventId");
  const status = searchParams.get("status");

  const conditions = [];
  if (eventId) conditions.push(eq(registrations.eventId, eventId));
  if (status) conditions.push(eq(registrations.status, status as "confirmed"));

  const rows = await db
    .select({
      registrationCode: registrations.registrationCode,
      name: registrations.name,
      email: registrations.email,
      phone: registrations.phone,
      status: registrations.status,
      paymentStatus: registrations.paymentStatus,
      registeredAt: registrations.registeredAt,
      confirmedAt: registrations.confirmedAt,
      eventTitle: events.title,
      ticketName: eventTickets.name,
      ticketPrice: eventTickets.price,
    })
    .from(registrations)
    .innerJoin(events, eq(registrations.eventId, events.id))
    .innerJoin(eventTickets, eq(registrations.ticketId, eventTickets.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(registrations.registeredAt);

  const headers = [
    "Kode Registrasi",
    "Nama",
    "Email",
    "WhatsApp",
    "Status Registrasi",
    "Status Pembayaran",
    "Tanggal Daftar",
    "Tanggal Konfirmasi",
    "Event",
    "Tiket",
    "Harga Tiket",
  ];

  const lines = [
    toCsvRow(headers),
    ...rows.map((r) =>
      toCsvRow([
        r.registrationCode,
        r.name,
        r.email,
        r.phone,
        r.status,
        r.paymentStatus,
        r.registeredAt?.toISOString() ?? "",
        r.confirmedAt?.toISOString() ?? "",
        r.eventTitle,
        r.ticketName,
        r.ticketPrice,
      ])
    ),
  ];

  const csv = lines.join("\n");
  const filename = eventId
    ? `peserta-${eventId}-${new Date().toISOString().slice(0, 10)}.csv`
    : `peserta-all-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
