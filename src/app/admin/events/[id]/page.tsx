import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { getAdminEventDetail } from "@/lib/admin/queries";
import { getEventDisplayStatus } from "@/lib/events/display-status";
import { EventForm } from "@/components/admin/event-form";
import { TicketBuilder } from "@/components/admin/ticket-builder";
import { EventActionButtons } from "@/components/admin/event-actions";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kelola Event — Admin",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  cancelled: "Cancelled",
  archived: "Archived",
};

const STATUS_VARIANT: Record<string, "default" | "success" | "secondary" | "destructive" | "outline" | "warning"> = {
  draft: "secondary",
  published: "default",
  cancelled: "destructive",
  archived: "outline",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getAdminEventDetail(id).catch(() => null);

  if (!event) notFound();

  const now = new Date();
  const displayStatus = getEventDisplayStatus(
    { lifecycleStatus: event.lifecycleStatus, startDatetime: event.startDatetime, endDatetime: event.endDatetime },
    now
  );

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          href="/admin/events"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Kembali ke Events
        </Link>

        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold truncate">{event.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
              <span>/{event.slug}</span>
              <span>·</span>
              <span>{formatDate(event.startDatetime, event.timezone)}</span>
              <span>{formatTime(event.startDatetime, event.timezone)}</span>
              {event.lifecycleStatus === "published" && (
                <Link href={`/${event.slug}`} target="_blank" className="flex items-center gap-1 text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> Lihat publik
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={STATUS_VARIANT[event.lifecycleStatus] ?? "secondary"}>
              {STATUS_LABEL[event.lifecycleStatus]}
            </Badge>
            {event.lifecycleStatus === "published" && (
              <Badge variant="outline" className="capitalize">{displayStatus}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-sm font-medium mb-3">Aksi Event</p>
        <EventActionButtons eventId={event.id} lifecycleStatus={event.lifecycleStatus} />
      </div>

      {/* Ticket builder */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-4">Tiket</h2>
        <TicketBuilder eventId={event.id} tickets={event.eventTickets} />
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-6">Detail Event</h2>
        <EventForm event={event} />
      </div>

      {/* Meta info */}
      <div className="text-xs text-muted-foreground pb-8">
        <p>Short code: <code className="bg-muted px-1 py-0.5 rounded">{event.shortCode}</code></p>
        <p className="mt-1">ID: <code className="bg-muted px-1 py-0.5 rounded">{event.id}</code></p>
        <p className="mt-1">Dibuat: {formatDate(event.createdAt)}</p>
      </div>
    </div>
  );
}
