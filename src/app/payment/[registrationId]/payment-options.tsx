"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  initiateXenditPayment,
  initiateMidtransPayment,
  initiateManualPayment,
} from "@/lib/payment/actions";
import { formatCurrency } from "@/lib/format";
import { CreditCard, Building2, QrCode, Upload, Loader2, Zap } from "lucide-react";
import { UploadProofForm } from "./upload-proof-form";
import type { EnabledPaymentMethods } from "@/lib/settings/payment";

interface PaymentOptionsProps {
  registrationId: string;
  amount: number;
  currentStatus: string;
  methods: EnabledPaymentMethods;
}

type Method = "xendit" | "midtrans" | "manual" | "qris" | null;

export function PaymentOptions({ registrationId, amount, currentStatus, methods }: PaymentOptionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Method>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(currentStatus === "payment_verification");

  const anyEnabled =
    methods.xendit || methods.midtrans || methods.bankTransfer.enabled || methods.qris.enabled;

  const handleGateway = (fn: (id: string) => Promise<{ success: true; invoiceUrl: string } | { success: false; error: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn(registrationId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      window.location.href = result.invoiceUrl;
    });
  };

  const handleManual = (provider: "manual" | "qris") => {
    setError(null);
    startTransition(async () => {
      const result = await initiateManualPayment(registrationId, provider);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setShowUpload(true);
      router.refresh();
    });
  };

  // Manual methods: show instructions + proof upload
  if (showUpload && (selected === "manual" || selected === "qris" || currentStatus === "payment_verification")) {
    return (
      <div className="space-y-4">
        {selected === "qris" && methods.qris.imageUrl && (
          <div className="bg-white rounded-xl border p-6 text-center space-y-4">
            <h3 className="font-semibold">Scan QRIS</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-56 h-56 rounded-lg border bg-white overflow-hidden">
                <Image src={methods.qris.imageUrl} alt="QRIS" fill className="object-contain" sizes="224px" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Scan QR di atas dan bayar <strong>{formatCurrency(amount)}</strong>
            </p>
          </div>
        )}

        {selected === "manual" && methods.bankTransfer.enabled && (
          <div className="bg-white rounded-xl border p-6 space-y-3">
            <h3 className="font-semibold">Transfer Bank</h3>
            <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
              <Row label="Bank" value={methods.bankTransfer.bankName || "—"} />
              <Row label="No. Rekening" value={methods.bankTransfer.accountNumber} mono />
              <Row label="Atas Nama" value={methods.bankTransfer.accountHolder || "—"} />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-bold text-primary">{formatCurrency(amount)}</span>
              </div>
            </div>
            {methods.bankTransfer.instructions && (
              <p className="text-xs text-muted-foreground">{methods.bankTransfer.instructions}</p>
            )}
          </div>
        )}

        <UploadProofForm
          registrationId={registrationId}
          onSuccess={() => router.push("/my-events")}
        />
      </div>
    );
  }

  if (!anyEnabled) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
        Belum ada metode pembayaran yang aktif. Silakan hubungi penyelenggara.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Metode Pembayaran</h2>

      {methods.xendit && (
        <MethodButton
          selected={selected === "xendit"}
          onClick={() => setSelected("xendit")}
          icon={<Zap className="h-5 w-5 text-primary shrink-0" />}
          title="Pembayaran Instan (Xendit)"
          desc="Kartu, virtual account, e-wallet, QRIS — konfirmasi otomatis"
        />
      )}

      {methods.midtrans && (
        <MethodButton
          selected={selected === "midtrans"}
          onClick={() => setSelected("midtrans")}
          icon={<CreditCard className="h-5 w-5 text-indigo-600 shrink-0" />}
          title="Pembayaran Instan (Midtrans)"
          desc="Kartu, VA, e-wallet, QRIS — konfirmasi otomatis"
        />
      )}

      {methods.bankTransfer.enabled && (
        <MethodButton
          selected={selected === "manual"}
          onClick={() => setSelected("manual")}
          icon={<Building2 className="h-5 w-5 text-blue-600 shrink-0" />}
          title="Transfer Bank Manual"
          desc="Transfer ke rekening kami, lalu upload bukti bayar"
        />
      )}

      {methods.qris.enabled && (
        <MethodButton
          selected={selected === "qris"}
          onClick={() => setSelected("qris")}
          icon={<QrCode className="h-5 w-5 text-green-600 shrink-0" />}
          title="QRIS Statis"
          desc="Scan QR code kami, lalu upload bukti bayar"
        />
      )}

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>}

      <Button
        className="w-full"
        size="lg"
        disabled={!selected || isPending}
        onClick={() => {
          if (selected === "xendit") handleGateway(initiateXenditPayment);
          else if (selected === "midtrans") handleGateway(initiateMidtransPayment);
          else if (selected === "manual") handleManual("manual");
          else if (selected === "qris") handleManual("qris");
        }}
      >
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Memproses...</>
        ) : selected === "xendit" || selected === "midtrans" ? (
          <><CreditCard className="h-4 w-4 mr-2" /> Bayar {formatCurrency(amount)}</>
        ) : selected ? (
          <><Upload className="h-4 w-4 mr-2" /> Lanjut Upload Bukti</>
        ) : (
          "Pilih Metode Pembayaran"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Konfirmasi registrasi setelah pembayaran terverifikasi.
      </p>
    </div>
  );
}

function MethodButton({
  selected,
  onClick,
  icon,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      className={`w-full text-left bg-white rounded-xl border p-5 transition-colors hover:border-primary/50 ${selected ? "border-primary ring-1 ring-primary/30" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
    </button>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
