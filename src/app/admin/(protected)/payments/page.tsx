import { db } from "@/db";
import { payments, registrations, events } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pembayaran — Admin",
  robots: { index: false, follow: false },
};

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" | "outline" | "warning" }> = {
  pending: { label: "Menunggu", variant: "secondary" },
  paid: { label: "Lunas", variant: "success" },
  expired: { label: "Kadaluarsa", variant: "outline" },
  failed: { label: "Gagal", variant: "destructive" },
  cancelled: { label: "Dibatalkan", variant: "outline" },
};

const methodLabel: Record<string, string> = {
  xendit: "Xendit",
  manual: "Transfer Manual",
  qris: "QRIS",
};

export default async function PaymentsPage() {
  const rows = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      provider: payments.provider,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      registrationCode: registrations.registrationCode,
      participantName: registrations.name,
      eventTitle: events.title,
    })
    .from(payments)
    .leftJoin(registrations, eq(payments.registrationId, registrations.id))
    .leftJoin(events, eq(registrations.eventId, events.id))
    .orderBy(desc(payments.createdAt))
    .limit(200);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Pembayaran</h1>
        <p className="text-sm text-muted-foreground mt-1">Semua transaksi pembayaran peserta.</p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-muted-foreground">
          Belum ada data pembayaran.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peserta</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const sc = statusConfig[row.status] ?? statusConfig.pending;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{row.participantName ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{row.registrationCode ?? row.id}</p>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="text-sm truncate">{row.eventTitle ?? "—"}</p>
                    </TableCell>
                    <TableCell className="text-sm">{methodLabel[row.provider ?? ""] ?? row.provider ?? "—"}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatCurrency(row.amount ?? 0, row.currency ?? "IDR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.paidAt ? formatDate(row.paidAt) : formatDate(row.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
