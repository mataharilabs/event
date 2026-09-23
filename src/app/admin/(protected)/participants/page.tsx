import Link from "next/link";
import { getAdminParticipants, getAdminEventsForSelect } from "@/lib/admin/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ParticipantsFilter } from "./participants-filter";
import { formatCurrency } from "@/lib/format";
import { Download } from "lucide-react";
import type { Metadata } from "next";
import type { RegistrationStatus } from "@/types";

export const metadata: Metadata = {
  title: "Peserta — Admin",
  robots: { index: false, follow: false },
};

const REG_STATUS: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" | "outline" | "warning" }> = {
  pending_payment: { label: "Menunggu Bayar", variant: "warning" },
  payment_verification: { label: "Verifikasi", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  waitlisted: { label: "Waitlist", variant: "secondary" },
};

const PAY_STATUS: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" | "outline" | "warning" }> = {
  pending: { label: "Pending", variant: "outline" },
  paid: { label: "Paid", variant: "success" },
  expired: { label: "Expired", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

interface PageProps {
  searchParams: Promise<{ search?: string; eventId?: string; status?: string; page?: string }>;
}

export default async function AdminParticipantsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const eventId = params.eventId || undefined;
  const status = (params.status as RegistrationStatus) || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ rows, total, pageSize }, allEvents] = await Promise.all([
    getAdminParticipants({ search, eventId, status, page }).catch(() => ({ rows: [], total: 0, page: 1, pageSize: 25 })),
    getAdminEventsForSelect().catch(() => []),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Peserta</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total peserta</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/api/admin/export/participants${eventId ? `?eventId=${eventId}` : ""}${status ? `&status=${status}` : ""}`} download>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </a>
        </Button>
      </div>

      <ParticipantsFilter events={allEvents} />

      <div className="bg-white rounded-xl border">
        {rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {search || eventId || status ? (
              <p>Tidak ada peserta yang cocok dengan filter.</p>
            ) : (
              <p>Belum ada peserta terdaftar.</p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peserta</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Tiket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((reg) => {
                const rs = REG_STATUS[reg.status] ?? REG_STATUS.pending_payment;
                const ps = PAY_STATUS[reg.paymentStatus] ?? PAY_STATUS.pending;
                return (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{reg.name}</p>
                        <p className="text-xs text-muted-foreground">{reg.email}</p>
                        <p className="text-xs text-muted-foreground font-mono">{reg.registrationCode}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[160px]">
                      <p className="truncate">{reg.eventTitle}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>
                        <p>{reg.ticketName}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(reg.ticketPrice)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={rs.variant}>{rs.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ps.variant}>{ps.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/participants/${reg.id}`}>Detail</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/participants?page=${page - 1}${search ? `&search=${search}` : ""}${eventId ? `&eventId=${eventId}` : ""}${status ? `&status=${status}` : ""}`}>
                  Sebelumnya
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/participants?page=${page + 1}${search ? `&search=${search}` : ""}${eventId ? `&eventId=${eventId}` : ""}${status ? `&status=${status}` : ""}`}>
                  Selanjutnya
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
