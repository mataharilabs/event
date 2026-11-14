import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSiteSettings } from "@/lib/settings/payment";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSettings().catch(() => null);
  const title = site?.seoTitle || "AsiaCommerce Event";
  const description =
    site?.seoDescription ||
    "Discover and join AsiaCommerce events, workshops, webinars, and community activities.";
  const ogImage = site?.ogImageUrl || undefined;

  return {
    title: { default: title, template: `%s | ${title}` },
    description,
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://event.asiacommerce.net"),
    openGraph: {
      type: "website",
      siteName: title,
      ...(ogImage && { images: [ogImage] }),
    },
    twitter: {
      card: "summary_large_image",
      ...(ogImage && { images: [ogImage] }),
    },
    ...(site?.faviconUrl && { icons: { icon: site.faviconUrl } }),
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
