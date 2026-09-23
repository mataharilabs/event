import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  void searchParams;

  const ssoUrl = process.env.SSO_ISSUER_URL;
  const clientId = process.env.SSO_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const authUrl = ssoUrl && clientId && appUrl
    ? `${ssoUrl}/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(`${appUrl}/admin/auth/callback`)}&response_type=code&scope=openid+email+profile`
    : null;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Admin</h1>
        <p className="text-center text-muted-foreground mb-8">
          AsiaCommerce Event Platform
        </p>
        {authUrl ? (
          <a
            href={authUrl}
            className="flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Login dengan AsiaCommerce SSO
          </a>
        ) : (
          <p className="text-center text-sm text-red-500">
            Konfigurasi SSO belum lengkap.
          </p>
        )}
      </div>
    </main>
  );
}
