import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { PaymentOptions } from "./payment-options";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pembayaran — AsiaCommerce Event",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{ status?: string }>;
}

export default async function PaymentPage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    const { registrationId } = await params;
    redirect(`/login?callbackUrl=/payment/${registrationId}`);
  }

  const { registrationId } = await params;
  const { status } = await searchParams;

  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
    with: { event: true, ticket: true },
  }).catch(() => null);

  if (!reg) notFound();
  if (reg.userId !== session.user.id) notFound();

  // Already confirmed
  if (reg.status === "confirmed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-xl font-bold">Pembayaran Dikonfirmasi</h1>
          <p className="text-muted-foreground">Registrasi kamu sudah dikonfirmasi.</p>
          <p className="font-mono font-bold text-lg text-primary">{reg.registrationCode}</p>
          <Link href="/my-events" className="block mt-4 underline text-primary text-sm">Lihat My Events</Link>
        </div>
      </div>
    );
  }

  // Free ticket somehow ended up here
  if (reg.ticket.price === 0) {
    redirect("/my-events");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Selesaikan Pembayaran</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Pilih metode pembayaran untuk melanjutkan pendaftaran
          </p>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">Ringkasan Pesanan</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">{reg.event.title}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tiket: {reg.ticket.name}</span>
              <span>{formatCurrency(reg.ticket.price)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(reg.ticket.price)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Badge variant={reg.status === "payment_verification" ? "warning" : "outline"} className="text-xs">
              {reg.status === "payment_verification" ? "Menunggu Verifikasi" : "Menunggu Pembayaran"}
            </Badge>
          </div>
        </div>

        {status === "failed" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            Pembayaran gagal atau dibatalkan. Silakan coba lagi.
          </div>
        )}

        <PaymentOptions
          registrationId={registrationId}
          amount={reg.ticket.price}
          currentStatus={reg.status}
        />
      </div>
    </div>
  );
}
