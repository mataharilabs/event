import { getOrganizersWithCounts } from "@/lib/admin/organizer-actions";
import { OrganizersManager } from "@/components/admin/organizers-manager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Penyelenggara — Admin",
  robots: { index: false, follow: false },
};

export default async function OrganizersPage() {
  const organizers = await getOrganizersWithCounts().catch(() => []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Penyelenggara</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola penyelenggara event. Setiap event bisa memilih salah satu penyelenggara.
        </p>
      </div>
      <OrganizersManager organizers={organizers} />
    </div>
  );
}
