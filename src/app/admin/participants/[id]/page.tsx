import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAdminRegistrationDetail } from "@/lib/admin/queries";
import { Badge } from "@/components/ui/badge";
import { ParticipantActions } from "./participant-actions";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Detail Peserta — Admin",
  robots: { index: false, follow: false },
};

const REG_STATUS: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" | "outline" | "warning" }> = {
  pending_payment: { label: "Menunggu Pembayaran", variant: "warning" },
  payment_verification: { label: "Verifikasi Pembayaran", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  waitlisted: { label: "Waitlist", variant: "secondary" },
};

const PAY_STATUS: Record<string, { label: string; variant: "default" | "success" | "secondary" | "destructive" | "outline" | "warning" }> = {
  pending: { label: "Pending", variant: "outline" },
  paid: { label: "Paid", variant: "success" },
  expired: { label: "Expired", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5 border-b last:border-0">
      <p className="w-40 shrink-0 text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium flex-1">{value}</p>
    </div>
  );
}

export default async function ParticipantDetailPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getAdminRegistrationDetail(id).catch(() => null);

  if (!data) notFound();

  const rs = REG_STATUS[data.status] ?? REG_STATUS.pending_payment;
  const ps = data.payment ? (PAY_STATUS[data.payment.status] ?? PAY_STATUS.pending) : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin/participants"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Kembali ke Peserta
        </Link>

        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold">{data.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">{data.registrationCode}</p>
          </div>
          <div className="flex gap-2 ml-auto">
            <Badge variant={rs.variant}>{rs.label}</Badge>
            {ps && <Badge variant={ps.variant}>{ps.label}</Badge>}
          </div>
        </div>
      </div>

      {/* Aksi */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-sm font-medium mb-3">Aksi</p>
        <ParticipantActions
          registrationId={data.id}
          status={data.status}
          paymentStatus={data.paymentStatus}
          hasPayment={!!data.payment}
          paymentProvider={data.payment?.provider ?? null}
        />
      </div>

      {/* Info peserta */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Informasi Peserta</h2>
        <div>
          <InfoRow label="Nama" value={data.name} />
          <InfoRow label="Email" value={data.email} />
          <InfoRow label="WhatsApp" value={data.phone} />
          <InfoRow label="Kode Registrasi" value={<code className="bg-muted px-1.5 py-0.5 rounded">{data.registrationCode}</code>} />
          <InfoRow label="Tanggal Daftar" value={`${formatDate(data.registeredAt)} ${formatTime(data.registeredAt)}`} />
          {data.confirmedAt && (
            <InfoRow label="Dikonfirmasi" value={`${formatDate(data.confirmedAt)} ${formatTime(data.confirmedAt)}`} />
          )}
        </div>
      </div>

      {/* Info event */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold mb-3">Event & Tiket</h2>
        <div>
          <InfoRow label="Event" value={
            <Link href={`/admin/events/${data.event.id}`} className="text-primary hover:underline">
              {data.event.title}
            </Link>
          } />
          <InfoRow label="Tiket" value={data.ticket.name} />
          <InfoRow label="Harga" value={formatCurrency(data.ticket.price)} />
          <InfoRow label="Waktu Mulai" value={`${formatDate(data.event.startDatetime, data.event.timezone)} ${formatTime(data.event.startDatetime, data.event.timezone)}`} />
        </div>
      </div>

      {/* Info pembayaran */}
      {data.payment && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-3">Pembayaran</h2>
          <div>
            <InfoRow label="Provider" value={<span className="capitalize">{data.payment.provider}</span>} />
            <InfoRow label="Jumlah" value={formatCurrency(data.payment.amount)} />
            <InfoRow label="Status" value={ps ? <Badge variant={ps.variant}>{ps.label}</Badge> : "-"} />
            {data.payment.externalPaymentId && (
              <InfoRow label="ID Eksternal" value={<code className="bg-muted px-1.5 py-0.5 rounded text-xs">{data.payment.externalPaymentId}</code>} />
            )}
            {data.payment.paidAt && (
              <InfoRow label="Dibayar" value={`${formatDate(data.payment.paidAt)} ${formatTime(data.payment.paidAt)}`} />
            )}
            {data.payment.paymentProofUrl && (
              <InfoRow label="Bukti Bayar" value={
                <a href={data.payment.paymentProofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">
                  Lihat bukti
                </a>
              } />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
