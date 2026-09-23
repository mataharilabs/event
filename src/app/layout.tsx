import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "AsiaCommerce Event",
    template: "%s | AsiaCommerce Event",
  },
  description: "Discover and join AsiaCommerce events, workshops, webinars, and community activities.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://event.asiacommerce.net"),
  openGraph: {
    type: "website",
    siteName: "AsiaCommerce Event",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
