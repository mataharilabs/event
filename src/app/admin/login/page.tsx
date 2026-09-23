import { redirect } from "next/navigation";
import { getSSOLoginUrl } from "@/lib/auth/sso";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const target = callbackUrl ?? `${appUrl}/admin`;

  // If SSO_URL is configured, redirect immediately — no click needed
  if (process.env.SSO_URL) {
    redirect(getSSOLoginUrl(target));
  }

  // Fallback: SSO not configured yet
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Admin</h1>
        <p className="text-center text-muted-foreground mb-8">
          AsiaCommerce Event Platform
        </p>
        <p className="text-center text-sm text-red-500">
          Konfigurasi SSO belum lengkap. Set environment variable{" "}
          <code className="bg-gray-100 px-1 rounded">SSO_URL</code>.
        </p>
      </div>
    </main>
  );
}
