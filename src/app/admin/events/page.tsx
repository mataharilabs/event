import Link from "next/link";
import { getAdminEvents } from "@/lib/admin/queries";
import { getEventDisplayStatus } from "@/lib/events/display-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminEventsFilter } from "./events-filter";
import { formatDate } from "@/lib/format";
import { Plus, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import type { EventLifecycleStatus } from "@/types";

export const metadata: Metadata = {
  title: "Events — Admin",
  robots: { index: false, follow: false },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" | "outline" | "warning" }> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  archived: { label: "Archived", variant: "outline" },
};

const DISPLAY_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" | "outline" | "warning" }> = {
  upcoming: { label: "Upcoming", variant: "outline" },
  ongoing: { label: "On Going", variant: "success" },
  past: { label: "Past", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const status = (params.status as EventLifecycleStatus) || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { rows, total, pageSize } = await getAdminEvents({ search, status, page }).catch(() => ({
    rows: [],
    total: 0,
    page: 1,
    pageSize: 20,
  }));

  const totalPages = Math.ceil(total / pageSize);
  const now = new Date();

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total event</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/events/create">
            <Plus className="h-4 w-4 mr-1" /> Buat Event
          </Link>
        </Button>
      </div>

      <AdminEventsFilter />

      <div className="bg-white rounded-xl border">
        {rows.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {search || status ? (
              <p>Tidak ada event yang cocok dengan filter.</p>
            ) : (
              <p>Belum ada event. <Link href="/admin/events/create" className="text-primary hover:underline">Buat event pertama</Link></p>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Peserta</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((event) => {
                const displayStatus = getEventDisplayStatus(
                  { lifecycleStatus: event.lifecycleStatus, startDatetime: event.startDatetime, endDatetime: event.endDatetime },
                  now
                );
                const sc = STATUS_CONFIG[event.lifecycleStatus] ?? STATUS_CONFIG.draft;
                const ds = DISPLAY_STATUS_CONFIG[displayStatus] ?? DISPLAY_STATUS_CONFIG.upcoming;
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium leading-snug max-w-[220px] truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{event.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(event.startDatetime)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                        {event.lifecycleStatus === "published" && (
                          <Badge variant={ds.variant}>{ds.label}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize text-sm text-muted-foreground">
                      {event.attendanceMode}
                    </TableCell>
                    <TableCell className="text-right">{event.registrationCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 justify-end">
                        {event.lifecycleStatus === "published" && (
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <Link href={`/${event.slug}`} target="_blank">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/events/${event.id}`}>Kelola</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/events?page=${page - 1}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}>
                  Sebelumnya
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/events?page=${page + 1}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}>
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
