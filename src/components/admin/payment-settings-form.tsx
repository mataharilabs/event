"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  updatePaymentSettings,
  uploadQrisImage,
} from "@/lib/admin/settings-actions";
import type { AdminPaymentSettings } from "@/lib/settings/payment";
import { CreditCard, Building2, QrCode, Zap, Loader2, CheckCircle2, Upload } from "lucide-react";

interface Props {
  settings: AdminPaymentSettings;
}

export function PaymentSettingsForm({ settings }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const qrisInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [qrisUploading, setQrisUploading] = useState(false);

  // Toggles & plain fields
  const [xenditEnabled, setXenditEnabled] = useState(settings.xenditEnabled);
  const [midtransEnabled, setMidtransEnabled] = useState(settings.midtransEnabled);
  const [midtransIsProduction, setMidtransIsProduction] = useState(settings.midtransIsProduction);
  const [bankTransferEnabled, setBankTransferEnabled] = useState(settings.bankTransferEnabled);
  const [qrisEnabled, setQrisEnabled] = useState(settings.qrisEnabled);

  const [bankName, setBankName] = useState(settings.bankName);
  const [bankAccountNumber, setBankAccountNumber] = useState(settings.bankAccountNumber);
  const [bankAccountHolder, setBankAccountHolder] = useState(settings.bankAccountHolder);
  const [bankInstructions, setBankInstructions] = useState(settings.bankInstructions);
  const [qrisImageUrl, setQrisImageUrl] = useState<string | null>(settings.qrisImageUrl);

  // Secret inputs — empty means "keep stored value"
  const [xenditSecretKey, setXenditSecretKey] = useState("");
  const [xenditWebhookToken, setXenditWebhookToken] = useState("");
  const [midtransServerKey, setMidtransServerKey] = useState("");
  const [midtransClientKey, setMidtransClientKey] = useState("");

  function secretPlaceholder(stored: boolean) {
    return stored ? "•••••••••• (tersimpan — isi untuk mengganti)" : "Belum diisi";
  }

  function handleQrisUpload(file: File) {
    setError(null);
    setQrisUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    uploadQrisImage(formData)
      .then((res) => {
        if (res.success) {
          setQrisImageUrl(res.url);
          setQrisEnabled(true);
        } else {
          setError(res.error);
        }
      })
      .finally(() => {
        setQrisUploading(false);
        if (qrisInputRef.current) qrisInputRef.current.value = "";
      });
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updatePaymentSettings({
        xenditEnabled,
        xenditSecretKey: xenditSecretKey || undefined,
        xenditWebhookToken: xenditWebhookToken || undefined,
        midtransEnabled,
        midtransServerKey: midtransServerKey || undefined,
        midtransClientKey: midtransClientKey || undefined,
        midtransIsProduction,
        bankTransferEnabled,
        bankName,
        bankAccountNumber,
        bankAccountHolder,
        bankInstructions,
        qrisEnabled,
        qrisImageUrl: qrisImageUrl ?? undefined,
      });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setSaved(true);
      setXenditSecretKey("");
      setXenditWebhookToken("");
      setMidtransServerKey("");
      setMidtransClientKey("");
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="bg-white rounded-xl border divide-y">
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm">Metode Pembayaran</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aktifkan dan konfigurasi metode pembayaran untuk tiket berbayar.
          </p>
        </div>
      </div>

      {/* Xendit */}
      <Section
        icon={<Zap className="h-4 w-4 text-primary" />}
        title="Xendit (Otomatis)"
        subtitle="Konfirmasi otomatis via webhook — kartu, VA, e-wallet, QRIS"
        enabled={xenditEnabled}
        onToggle={setXenditEnabled}
      >
        <Field label="Secret Key">
          <Input
            type="password"
            autoComplete="off"
            value={xenditSecretKey}
            onChange={(e) => setXenditSecretKey(e.target.value)}
            placeholder={secretPlaceholder(settings.hasXenditSecretKey)}
          />
        </Field>
        <Field label="Webhook Verification Token">
          <Input
            type="password"
            autoComplete="off"
            value={xenditWebhookToken}
            onChange={(e) => setXenditWebhookToken(e.target.value)}
            placeholder={secretPlaceholder(settings.hasXenditWebhookToken)}
          />
        </Field>
      </Section>

      {/* Midtrans */}
      <Section
        icon={<CreditCard className="h-4 w-4 text-indigo-600" />}
        title="Midtrans (Otomatis)"
        subtitle="Konfirmasi otomatis via Snap + webhook"
        enabled={midtransEnabled}
        onToggle={setMidtransEnabled}
      >
        <Field label="Server Key">
          <Input
            type="password"
            autoComplete="off"
            value={midtransServerKey}
            onChange={(e) => setMidtransServerKey(e.target.value)}
            placeholder={secretPlaceholder(settings.hasMidtransServerKey)}
          />
        </Field>
        <Field label="Client Key">
          <Input
            type="password"
            autoComplete="off"
            value={midtransClientKey}
            onChange={(e) => setMidtransClientKey(e.target.value)}
            placeholder={secretPlaceholder(settings.hasMidtransClientKey)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={midtransIsProduction}
            onChange={(e) => setMidtransIsProduction(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Mode Production (nonaktif = Sandbox)
        </label>
      </Section>

      {/* Bank Transfer */}
      <Section
        icon={<Building2 className="h-4 w-4 text-blue-600" />}
        title="Transfer Bank (Manual)"
        subtitle="Peserta transfer lalu upload bukti — diverifikasi admin"
        enabled={bankTransferEnabled}
        onToggle={setBankTransferEnabled}
      >
        <Field label="Nama Bank">
          <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="BCA" />
        </Field>
        <Field label="Nomor Rekening">
          <Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="1234567890" />
        </Field>
        <Field label="Atas Nama">
          <Input value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} placeholder="PT AsiaCommerce" />
        </Field>
        <Field label="Instruksi Tambahan (opsional)">
          <Textarea
            value={bankInstructions}
            onChange={(e) => setBankInstructions(e.target.value)}
            placeholder="Transfer tepat sesuai nominal untuk mempermudah verifikasi."
            rows={2}
          />
        </Field>
      </Section>

      {/* QRIS */}
      <Section
        icon={<QrCode className="h-4 w-4 text-green-600" />}
        title="QRIS Statis (Manual)"
        subtitle="Peserta scan QR lalu upload bukti — diverifikasi admin"
        enabled={qrisEnabled}
        onToggle={setQrisEnabled}
      >
        <div className="flex items-start gap-4">
          <div className="relative w-32 h-32 shrink-0 rounded-lg border bg-muted overflow-hidden flex items-center justify-center">
            {qrisImageUrl ? (
              <Image src={qrisImageUrl} alt="QRIS" fill className="object-contain" sizes="128px" />
            ) : (
              <QrCode className="h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={qrisInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleQrisUpload(f);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={qrisUploading}
              onClick={() => qrisInputRef.current?.click()}
            >
              {qrisUploading ? (
                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Mengupload...</>
              ) : (
                <><Upload className="h-4 w-4 mr-1.5" /> Upload Gambar QRIS</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">JPG, PNG, WebP — maks. 5 MB</p>
          </div>
        </div>
      </Section>

      {/* Save */}
      <div className="px-5 py-4 flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...</>
          ) : (
            "Simpan Pengaturan"
          )}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> Tersimpan
          </span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  enabled,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 space-y-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-4 w-4 mt-0.5 rounded border-input"
        />
        <span className="flex items-center gap-2 font-medium text-sm">
          {icon} {title}
        </span>
      </label>
      <p className="text-xs text-muted-foreground -mt-1 ml-7">{subtitle}</p>
      {enabled && <div className="ml-7 space-y-3 pt-1">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
