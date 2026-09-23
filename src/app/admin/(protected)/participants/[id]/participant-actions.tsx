"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { changeRegistrationStatus, verifyManualPayment, rejectManualPayment } from "@/lib/admin/participant-actions";
import type { RegistrationStatus } from "@/types";
import { CheckCircle, XCircle } from "lucide-react";

interface ParticipantActionsProps {
  registrationId: string;
  status: RegistrationStatus;
  paymentStatus: string;
  hasPayment: boolean;
  paymentProvider: string | null;
}

export function ParticipantActions({
  registrationId,
  status,
  paymentStatus,
  hasPayment,
  paymentProvider,
}: ParticipantActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ success: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        alert(result.error ?? "Terjadi kesalahan.");
        return;
      }
      router.refresh();
    });
  };

  const isManualPayment = paymentProvider === "manual" || paymentProvider === "qris";
  const canVerify = hasPayment && isManualPayment && (paymentStatus === "pending" || status === "payment_verification");

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Status changer */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status registrasi:</span>
        <Select
          value={status}
          disabled={isPending}
          onValueChange={(v) => {
            if (confirm(`Ubah status menjadi "${v}"?`)) {
              run(() => changeRegistrationStatus(registrationId, v as RegistrationStatus));
            }
          }}
        >
          <SelectTrigger className="w-[190px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending_payment">Menunggu Bayar</SelectItem>
            <SelectItem value="payment_verification">Verifikasi</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="waitlisted">Waitlist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Manual payment verification */}
      {canVerify && (
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => {
              if (confirm("Verifikasi pembayaran ini? Status akan berubah menjadi Confirmed.")) {
                run(() => verifyManualPayment(registrationId));
              }
            }}
          >
            <CheckCircle className="h-4 w-4 mr-1.5" /> Verifikasi Bayar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            disabled={isPending}
            onClick={() => {
              if (confirm("Tolak pembayaran ini? Status registrasi akan kembali ke pending.")) {
                run(() => rejectManualPayment(registrationId));
              }
            }}
          >
            <XCircle className="h-4 w-4 mr-1.5" /> Tolak
          </Button>
        </div>
      )}
    </div>
  );
}
