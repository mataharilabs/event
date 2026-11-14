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
  uploadBrandingImage,
} from "@/lib/admin/settings-actions";
import type { AdminPaymentSettings } from "@/lib/settings/payment";
import { CreditCard, Building2, QrCode, Zap, Loader2, CheckCircle2, Upload, Mail, MessageCircle } from "lucide-react";

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

  const [emailEnabled, setEmailEnabled] = useState(settings.emailEnabled);
  const [resendFromEmail, setResendFromEmail] = useState(settings.resendFromEmail);
  const [whatsappEnabled, setWhatsappEnabled] = useState(settings.whatsappEnabled);
  const [whatsappApiUrl, setWhatsappApiUrl] = useState(settings.whatsappApiUrl);

  const [logoUrl, setLogoUrl] = useState<string | null>(settings.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(settings.faviconUrl);
  const [siteOgImageUrl, setSiteOgImageUrl] = useState<string | null>(settings.siteOgImageUrl);
  const [siteSeoTitle, setSiteSeoTitle] = useState(settings.siteSeoTitle);
  const [siteSeoDescription, setSiteSeoDescription] = useState(settings.siteSeoDescription);
  const [brandingUploading, setBrandingUploading] = useState<string | null>(null);

  // Secret inputs — empty means "keep stored value"
  const [xenditSecretKey, setXenditSecretKey] = useState("");
  const [xenditWebhookToken, setXenditWebhookToken] = useState("");
  const [midtransServerKey, setMidtransServerKey] = useState("");
  const [midtransClientKey, setMidtransClientKey] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [whatsappApiKey, setWhatsappApiKey] = useState("");

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

  function handleBrandingUpload(kind: "logo" | "favicon" | "og", file: File, set: (url: string) => void) {
    setError(null);
    setBrandingUploading(kind);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    uploadBrandingImage(fd)
      .then((res) => {
        if (res.success) set(res.url);
        else setError(res.error);
      })
      .finally(() => setBrandingUploading(null));
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
        emailEnabled,
        resendApiKey: resendApiKey || undefined,
        resendFromEmail,
        whatsappEnabled,
        whatsappApiUrl,
        whatsappApiKey: whatsappApiKey || undefined,
        logoUrl: logoUrl ?? "",
        faviconUrl: faviconUrl ?? "",
        siteOgImageUrl: siteOgImageUrl ?? "",
        siteSeoTitle,
        siteSeoDescription,
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
      setResendApiKey("");
      setWhatsappApiKey("");
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div className="bg-white rounded-xl border divide-y">
      {/* Branding & SEO */}
      <div className="px-5 py-4 space-y-4">
        <div>
          <h2 className="font-semibold text-sm">Branding & SEO Situs</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Logo, favicon, dan metadata default website utama.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <BrandingUploader label="Logo" url={logoUrl} uploading={brandingUploading === "logo"} onFile={(f) => handleBrandingUpload("logo", f, setLogoUrl)} />
          <BrandingUploader label="Favicon" url={faviconUrl} uploading={brandingUploading === "favicon"} onFile={(f) => handleBrandingUpload("favicon", f, setFaviconUrl)} />
          <BrandingUploader label="OG Image" url={siteOgImageUrl} uploading={brandingUploading === "og"} onFile={(f) => handleBrandingUpload("og", f, setSiteOgImageUrl)} />
        </div>
        <Field label="SEO Title Situs">
          <Input value={siteSeoTitle} onChange={(e) => setSiteSeoTitle(e.target.value)} placeholder="AsiaCommerce Event — Discover Our Events" />
        </Field>
        <Field label="SEO Description Situs">
          <Textarea value={siteSeoDescription} onChange={(e) => setSiteSeoDescription(e.target.value)} rows={2} placeholder="Temukan dan ikuti event, workshop, dan webinar AsiaCommerce." />
        </Field>
      </div>

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

      {/* Email (Resend) */}
      <Section
        icon={<Mail className="h-4 w-4 text-rose-600" />}
        title="Notifikasi Email (Resend)"
        subtitle="Kirim konfirmasi & link pembayaran via email"
        enabled={emailEnabled}
        onToggle={setEmailEnabled}
      >
        <Field label="Resend API Key">
          <Input
            type="password"
            autoComplete="off"
            value={resendApiKey}
            onChange={(e) => setResendApiKey(e.target.value)}
            placeholder={secretPlaceholder(settings.hasResendApiKey)}
          />
        </Field>
        <Field label="Email Pengirim (From)">
          <Input
            value={resendFromEmail}
            onChange={(e) => setResendFromEmail(e.target.value)}
            placeholder="AsiaCommerce Event <noreply@event.asiacommerce.net>"
          />
        </Field>
      </Section>

      {/* WhatsApp (wa-gateway) */}
      <Section
        icon={<MessageCircle className="h-4 w-4 text-green-600" />}
        title="Notifikasi WhatsApp (wa-gateway)"
        subtitle="Kirim konfirmasi & link pembayaran via WhatsApp internal"
        enabled={whatsappEnabled}
        onToggle={setWhatsappEnabled}
      >
        <Field label="Gateway URL">
          <Input
            value={whatsappApiUrl}
            onChange={(e) => setWhatsappApiUrl(e.target.value)}
            placeholder="https://wa-gateway.example.com"
          />
        </Field>
        <Field label="Gateway API Key">
          <Input
            type="password"
            autoComplete="off"
            value={whatsappApiKey}
            onChange={(e) => setWhatsappApiKey(e.target.value)}
            placeholder={secretPlaceholder(settings.hasWhatsappApiKey)}
          />
        </Field>
        {whatsappApiUrl.trim() && (
          <div className="pt-1">
            <Button asChild type="button" variant="outline" size="sm">
              <a href={`${whatsappApiUrl.replace(/\/$/, "")}/qr`} target="_blank" rel="noopener noreferrer">
                <QrCode className="h-4 w-4 mr-1.5" /> Scan QR untuk Hubungkan WhatsApp
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-1">
              Membuka halaman QR gateway. Scan dari aplikasi WhatsApp untuk menyambungkan nomor.
            </p>
          </div>
        )}
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

function BrandingUploader({
  label,
  url,
  uploading,
  onFile,
}: {
  label: string;
  url: string | null;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <label className="relative flex items-center justify-center h-20 rounded-lg border border-dashed bg-muted/40 cursor-pointer overflow-hidden hover:border-primary/50">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="max-h-16 max-w-full object-contain p-1" />
        ) : (
          <span className="flex flex-col items-center text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span className="text-[10px] mt-0.5">Upload</span>
          </span>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,image/x-icon"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
