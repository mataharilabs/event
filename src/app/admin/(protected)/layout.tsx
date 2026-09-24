import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getAdminSession } from "@/lib/auth/admin";
import { getSSOLoginUrl } from "@/lib/auth/sso";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.email) {
    // Check if SSO cookie exists but cannot be decoded (AUTH_SECRET mismatch)
    const cookieStore = await cookies();
    const hasSSOCookie =
      cookieStore.has("__Secure-authjs.session-token") ||
      cookieStore.has("authjs.session-token");

    if (hasSSOCookie) {
      // Cookie present but auth() returned null → AUTH_SECRET tidak cocok dengan SSO
      return (
        <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
          <div className="w-full max-w-sm bg-white rounded-lg shadow p-8 text-center space-y-3">
            <h1 className="text-xl font-bold">Konfigurasi Error</h1>
            <p className="text-sm text-muted-foreground">
              Session SSO tidak dapat dibaca. Pastikan{" "}
              <code className="bg-gray-100 px-1 rounded">AUTH_SECRET</code> di
              aplikasi ini identik dengan SSO.
            </p>
          </div>
        </main>
      );
    }

    // Belum ada session sama sekali → redirect ke SSO login
    redirect(getSSOLoginUrl());
  }

  // Session ada, tapi belum tentu punya akses EVENT
  const admin = await getAdminSession();

  if (!admin) {
    // Authenticated via SSO tapi tidak punya role di app EVENT
    // Tampilkan error — JANGAN redirect ke SSO (akan menyebabkan loop)
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-lg shadow p-8 text-center space-y-3">
          <h1 className="text-xl font-bold">Akses Ditolak</h1>
          <p className="text-sm text-muted-foreground">
            Akun <strong>{session.user.email}</strong> tidak memiliki akses ke
            Event Admin Panel.
          </p>
          <p className="text-xs text-muted-foreground">
            Minta administrator SSO untuk menambahkan role{" "}
            <code className="bg-gray-100 px-1 rounded">EVENT</code> ke akun
            Anda.
          </p>
          <a
            href={`${process.env.SSO_URL ?? "https://sso.asiacommerce.net"}/logout`}
            className="inline-block mt-2 text-sm text-primary underline"
          >
            Logout
          </a>
        </div>
      </main>
    );
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
