import Link from "next/link";
import { ChevronLeft, ImagePlus } from "lucide-react";
import { EventForm } from "@/components/admin/event-form";
import { getOrganizersForSelect } from "@/lib/admin/organizer-actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat Event — Admin",
  robots: { index: false, follow: false },
};

export default async function CreateEventPage() {
  const organizers = await getOrganizersForSelect().catch(() => []);
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/admin/events"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="h-4 w-4" /> Kembali ke Events
        </Link>
        <h1 className="text-2xl font-bold">Buat Event Baru</h1>
        <p className="text-sm text-muted-foreground mt-1">Event baru akan dibuat sebagai draft, bisa di-publish kapan saja.</p>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <EventForm organizers={organizers} />
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        <ImagePlus className="h-4 w-4 mt-0.5 shrink-0" />
        <p>Gambar event, tiket, dan short link bisa ditambahkan setelah event dibuat — Anda akan diarahkan ke halaman kelola event.</p>
      </div>
    </div>
  );
}
