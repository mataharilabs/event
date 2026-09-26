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
    // Log ke server untuk diagnosa
    console.log("[AdminLayout] access denied", {
      email: session.user.email,
      apps: session.user.apps,
      isSuperAdmin: session.user.isSuperAdmin,
    });

    // Authenticated via SSO tapi tidak punya role di app EVENT
    // Tampilkan error — JANGAN redirect ke SSO (akan menyebabkan loop)
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-lg shadow p-8 text-center space-y-4">
          <h1 className="text-xl font-bold">Akses Ditolak</h1>
          <p className="text-sm text-muted-foreground">
            Akun <strong>{session.user.email}</strong> tidak memiliki role{" "}
            <code className="bg-gray-100 px-1 rounded">EVENT</code> di SSO.
          </p>
          {/* Debug: tampilkan apps dari JWT untuk diagnosa */}
          <div className="bg-gray-50 rounded p-3 text-left text-xs font-mono break-all">
            <p className="text-gray-500 mb-1">session.user.apps:</p>
            <p>{JSON.stringify(session.user.apps ?? null)}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Assign role EVENT di SSO lalu <strong>logout → login ulang</strong>{" "}
            agar JWT di-refresh.
          </p>
          <a
            href={`${process.env.SSO_URL ?? "https://sso.asiacommerce.net"}/logout`}
            className="inline-block mt-2 text-sm text-primary underline"
          >
            Logout dari SSO
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
