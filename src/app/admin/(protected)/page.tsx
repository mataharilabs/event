import Link from "next/link";
import { getDashboardMetrics, getRecentEvents } from "@/lib/admin/queries";
import { getEventDisplayStatus } from "@/lib/events/display-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Admin",
  robots: { index: false, follow: false },
};

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" | "outline" | "warning" }> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  archived: { label: "Archived", variant: "outline" },
};

export default async function AdminDashboardPage() {
  const [metrics, recentEvents] = await Promise.all([
    getDashboardMetrics().catch(() => null),
    getRecentEvents().catch(() => []),
  ]);

  const now = new Date();

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild size="sm">
          <Link href="/admin/events/create">
            <Plus className="h-4 w-4 mr-1" /> Buat Event
          </Link>
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Events", value: metrics?.totalEvents ?? 0 },
          { label: "Upcoming", value: metrics?.upcomingCount ?? 0 },
          { label: "On Going", value: metrics?.ongoingCount ?? 0 },
          { label: "Total Registrasi", value: metrics?.totalRegistrations ?? 0 },
          { label: "Confirmed", value: metrics?.confirmedCount ?? 0 },
          { label: "Menunggu Bayar", value: metrics?.pendingPaymentCount ?? 0 },
          { label: "Total Revenue", value: formatCurrency(metrics?.totalRevenue ?? 0), isText: true },
          { label: "Published", value: metrics?.publishedEvents ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent events table */}
      <div className="bg-white rounded-xl border">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold">Event Terbaru</h2>
          <Link href="/admin/events" className="text-sm text-primary hover:underline">
            Lihat Semua
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Belum ada event. <Link href="/admin/events/create" className="text-primary hover:underline">Buat sekarang</Link></p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Peserta</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEvents.map((event) => {
                const displayStatus = getEventDisplayStatus(
                  { lifecycleStatus: event.lifecycleStatus, startDatetime: event.startDatetime, endDatetime: event.endDatetime },
                  now
                );
                const sc = statusConfig[event.lifecycleStatus] ?? statusConfig.draft;
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{event.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(event.startDatetime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                        {event.lifecycleStatus === "published" && (
                          <Badge variant="outline" className="text-xs capitalize">{displayStatus}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{event.registrationCount}</TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/events/${event.id}`}>Kelola</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
