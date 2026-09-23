"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { publishEvent, cancelEvent, archiveEvent, duplicateEvent } from "@/lib/admin/event-actions";
import type { EventLifecycleStatus } from "@/types";
import { Globe, XCircle, Archive, Copy, AlertTriangle } from "lucide-react";

interface EventActionButtonsProps {
  eventId: string;
  lifecycleStatus: EventLifecycleStatus;
}

export function EventActionButtons({ eventId, lifecycleStatus }: EventActionButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ success: boolean; error?: string; eventId?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        alert(result.error ?? "Terjadi kesalahan.");
        return;
      }
      if ("eventId" in result && result.eventId) {
        router.push(`/admin/events/${result.eventId}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {lifecycleStatus === "draft" && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (confirm("Publish event ini? Event akan terlihat secara publik.")) {
              run(() => publishEvent(eventId));
            }
          }}
        >
          <Globe className="h-4 w-4 mr-1.5" /> Publish
        </Button>
      )}

      {(lifecycleStatus === "published" || lifecycleStatus === "draft") && (
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
          disabled={isPending}
          onClick={() => {
            if (confirm("Batalkan event ini? Peserta yang sudah daftar perlu diinformasikan secara manual.")) {
              run(() => cancelEvent(eventId));
            }
          }}
        >
          <XCircle className="h-4 w-4 mr-1.5" /> Cancel
        </Button>
      )}

      {lifecycleStatus === "cancelled" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            if (confirm("Arsipkan event ini?")) {
              run(() => archiveEvent(eventId));
            }
          }}
        >
          <Archive className="h-4 w-4 mr-1.5" /> Arsipkan
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          if (confirm("Duplikat event ini sebagai draft baru?")) {
            run(() => duplicateEvent(eventId));
          }
        }}
      >
        <Copy className="h-4 w-4 mr-1.5" /> Duplikat
      </Button>

      {lifecycleStatus === "published" && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Event aktif — perubahan form akan langsung terlihat publik
        </div>
      )}
    </div>
  );
}
