"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteRegistration, verifyManualPayment } from "@/lib/admin/participant-actions";
import { deleteEvent } from "@/lib/admin/event-actions";
import { Trash2, CheckCircle, Loader2 } from "lucide-react";

export function DeleteParticipantButton({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:bg-destructive/10"
      title="Hapus peserta"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Hapus peserta ini? Data registrasi & pembayarannya akan dihapus permanen.")) return;
        startTransition(async () => {
          const res = await deleteRegistration(registrationId);
          if (!res.success) alert(res.error ?? "Gagal menghapus.");
          else router.refresh();
        });
      }}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </Button>
  );
}

export function DeleteEventButton({
  eventId,
  registrationCount,
}: {
  eventId: string;
  registrationCount: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:bg-destructive/10"
      title="Hapus event"
      disabled={isPending}
      onClick={() => {
        const warning =
          registrationCount > 0
            ? `Event ini punya ${registrationCount} peserta. Menghapus akan menghapus SEMUA registrasi, pembayaran, dan datanya secara permanen. Pertimbangkan Arsipkan. Lanjut hapus?`
            : "Hapus event ini secara permanen?";
        if (!confirm(warning)) return;
        startTransition(async () => {
          const res = await deleteEvent(eventId);
          if (!res.success) alert(res.error ?? "Gagal menghapus.");
          else router.refresh();
        });
      }}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </Button>
  );
}

export function ConfirmPaymentButton({ registrationId }: { registrationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Konfirmasi pembayaran ini sebagai LUNAS? Registrasi akan menjadi Confirmed.")) return;
        startTransition(async () => {
          const res = await verifyManualPayment(registrationId);
          if (!res.success) alert(res.error ?? "Gagal mengonfirmasi.");
          else router.refresh();
        });
      }}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <><CheckCircle className="h-3.5 w-3.5 mr-1" /> Konfirmasi</>
      )}
    </Button>
  );
}
