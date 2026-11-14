import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { EventDetailModal } from "@/components/events/event-detail-modal";
import { getSiteSettings } from "@/lib/settings/payment";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteSettings().catch(() => null);
  return (
    <div className="flex min-h-screen flex-col">
      <Header logoUrl={site?.logoUrl} />
      <main className="flex-1">{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <EventDetailModal />
      </Suspense>
    </div>
  );
}
