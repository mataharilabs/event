import { redirect } from "next/navigation";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pembayaran Berhasil — AsiaCommerce Event",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ registrationId: string }>;
}

export default async function PaymentSuccessPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { registrationId } = await params;

  const reg = await db.query.registrations.findFirst({
    where: eq(registrations.id, registrationId),
    with: { event: true },
  }).catch(() => null);

  if (!reg || reg.userId !== session.user.id) redirect("/my-events");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center space-y-5">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">Pembayaran Berhasil!</h1>
        <p className="text-muted-foreground">
          Terima kasih! Pembayaran kamu sedang diproses. Kamu akan mendapat konfirmasi via email dan WhatsApp.
        </p>

        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Kode Registrasi</p>
          <p className="font-mono font-bold text-xl text-primary mt-1">{reg.registrationCode}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">{reg.event.title}</p>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <Button asChild>
            <Link href="/my-events">Lihat My Events</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Ke Beranda</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
