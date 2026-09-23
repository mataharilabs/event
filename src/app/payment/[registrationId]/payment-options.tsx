"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { initiateXenditPayment, initiateManualPayment } from "@/lib/payment/actions";
import { formatCurrency } from "@/lib/format";
import { CreditCard, Building2, QrCode, Upload, Loader2 } from "lucide-react";
import { UploadProofForm } from "./upload-proof-form";

interface PaymentOptionsProps {
  registrationId: string;
  amount: number;
  currentStatus: string;
}

type Method = "xendit" | "manual" | "qris" | null;

export function PaymentOptions({ registrationId, amount, currentStatus }: PaymentOptionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Method>(null);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(currentStatus === "payment_verification");

  const handleXendit = () => {
    setError(null);
    startTransition(async () => {
      const result = await initiateXenditPayment(registrationId);
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

  if (showUpload && (selected === "manual" || selected === "qris" || currentStatus === "payment_verification")) {
    return (
      <div className="space-y-4">
        {selected === "qris" && (
          <div className="bg-white rounded-xl border p-6 text-center space-y-4">
            <h3 className="font-semibold">Scan QRIS</h3>
            <div className="flex items-center justify-center">
              {/* Static QRIS placeholder — replace with actual QRIS image from env/config */}
              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <QrCode className="h-16 w-16 text-gray-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Scan QR di atas dan bayar <strong>{formatCurrency(amount)}</strong>
            </p>
          </div>
        )}

        {selected === "manual" && (
          <div className="bg-white rounded-xl border p-6 space-y-3">
            <h3 className="font-semibold">Transfer Bank</h3>
            <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-semibold">BCA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. Rekening</span>
                <span className="font-mono font-semibold">1234567890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atas Nama</span>
                <span className="font-semibold">PT AsiaCommerce</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah</span>
                <span className="font-bold text-primary">{formatCurrency(amount)}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Transfer tepat sesuai jumlah di atas untuk mempermudah verifikasi.
            </p>
          </div>
        )}

        <UploadProofForm
          registrationId={registrationId}
          onSuccess={() => router.push("/my-events")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Metode Pembayaran</h2>

      {/* Xendit */}
      <button
        className={`w-full text-left bg-white rounded-xl border p-5 transition-colors hover:border-primary/50 ${selected === "xendit" ? "border-primary ring-1 ring-primary/30" : ""}`}
        onClick={() => setSelected("xendit")}
      >
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-primary shrink-0" />
          <div>
            <p className="font-medium">Kartu Kredit / Debit / VA / QRIS</p>
            <p className="text-xs text-muted-foreground mt-0.5">Bayar via Xendit — kartu, virtual account, e-wallet, QRIS</p>
          </div>
        </div>
      </button>

      {/* Manual transfer */}
      <button
        className={`w-full text-left bg-white rounded-xl border p-5 transition-colors hover:border-primary/50 ${selected === "manual" ? "border-primary ring-1 ring-primary/30" : ""}`}
        onClick={() => setSelected("manual")}
      >
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <p className="font-medium">Transfer Bank Manual</p>
            <p className="text-xs text-muted-foreground mt-0.5">Transfer ke rekening kami, lalu upload bukti bayar</p>
          </div>
        </div>
      </button>

      {/* Static QRIS */}
      <button
        className={`w-full text-left bg-white rounded-xl border p-5 transition-colors hover:border-primary/50 ${selected === "qris" ? "border-primary ring-1 ring-primary/30" : ""}`}
        onClick={() => setSelected("qris")}
      >
        <div className="flex items-center gap-3">
          <QrCode className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-medium">QRIS Statis</p>
            <p className="text-xs text-muted-foreground mt-0.5">Scan QR code kami, lalu upload bukti bayar</p>
          </div>
        </div>
      </button>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!selected || isPending}
        onClick={() => {
          if (selected === "xendit") handleXendit();
          else if (selected === "manual") handleManual("manual");
          else if (selected === "qris") handleManual("qris");
        }}
      >
        {isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Memproses...</>
        ) : selected === "xendit" ? (
          <><CreditCard className="h-4 w-4 mr-2" /> Bayar {formatCurrency(amount)}</>
        ) : selected ? (
          <><Upload className="h-4 w-4 mr-2" /> Lanjut Upload Bukti</>
        ) : (
          "Pilih Metode Pembayaran"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Pembayaran dijamin aman. Konfirmasi registrasi setelah pembayaran terverifikasi.
      </p>
    </div>
  );
}
