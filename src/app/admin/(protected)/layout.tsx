import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/admin";
import { getSSOLoginUrl } from "@/lib/auth/sso";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminSession();

  if (!admin) {
    redirect(getSSOLoginUrl());
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-white px-6 flex items-center justify-between shrink-0">
          <div />
          <div className="text-sm text-muted-foreground">
            {admin.name} · <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{admin.role}</span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
