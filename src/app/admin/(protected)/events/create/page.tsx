import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EventForm } from "@/components/admin/event-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat Event — Admin",
  robots: { index: false, follow: false },
};

export default function CreateEventPage() {
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
        <EventForm />
      </div>
    </div>
  );
}
