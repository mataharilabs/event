import { auth } from "@/lib/auth";
import { getAdminSession } from "@/lib/auth/admin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pengaturan — Admin",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const [session, admin] = await Promise.all([auth(), getAdminSession()]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-1">Informasi akun dan konfigurasi platform.</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border divide-y">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-sm">Profil Admin</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          <Row label="Nama" value={admin?.name ?? session?.user?.name ?? "—"} />
          <Row label="Email" value={admin?.email ?? session?.user?.email ?? "—"} />
          <Row label="Role" value={admin?.role ?? "—"} />
        </div>
      </div>

      {/* SSO info */}
      <div className="bg-white rounded-xl border divide-y">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-sm">Autentikasi</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          <Row label="Provider" value="AsiaCommerce SSO" />
          <Row label="SSO URL" value={process.env.SSO_URL ?? "https://sso.asiacommerce.net"} />
          <div className="pt-2">
            <a
              href={`${process.env.SSO_URL ?? "https://sso.asiacommerce.net"}/logout`}
              className="text-sm text-destructive hover:underline"
            >
              Logout dari semua aplikasi
            </a>
          </div>
        </div>
      </div>

      {/* Platform info */}
      <div className="bg-white rounded-xl border divide-y">
        <div className="px-5 py-4">
          <h2 className="font-semibold text-sm">Platform</h2>
        </div>
        <div className="px-5 py-4 space-y-3">
          <Row label="App URL" value={process.env.NEXT_PUBLIC_APP_URL ?? "—"} />
          <Row label="Environment" value={process.env.NODE_ENV ?? "—"} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="text-sm font-medium break-all">{value}</span>
    </div>
  );
}
