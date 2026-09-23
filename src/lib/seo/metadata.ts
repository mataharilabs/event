import type { Metadata } from "next";
import { APP_URL } from "@/config";

interface EventSEOData {
  title: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  primaryImageUrl?: string | null;
  ogImageUrl?: string | null;
  slug: string;
}

export function buildEventMetadata(event: EventSEOData): Metadata {
  const title = event.seoTitle ?? event.title;
  const description = event.seoDescription ?? event.description ?? `Daftar sekarang untuk ${event.title}`;
  const image = event.ogImageUrl ?? event.primaryImageUrl;
  const url = `${APP_URL}/${event.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(image && {
        images: [{ url: image, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export function buildEventStructuredData(event: {
  title: string;
  description?: string | null;
  startDatetime: Date;
  endDatetime: Date;
  attendanceMode: string;
  venueName?: string | null;
  venueAddress?: string | null;
  meetingUrl?: string | null;
  primaryImageUrl?: string | null;
  slug: string;
  price?: number | null;
  currency?: string;
}) {
  const url = `${APP_URL}/${event.slug}`;

  const location =
    event.attendanceMode === "online"
      ? { "@type": "VirtualLocation", url: event.meetingUrl ?? url }
      : {
          "@type": "Place",
          name: event.venueName ?? "TBA",
          address: event.venueAddress ?? "",
        };

  const attendanceMode =
    event.attendanceMode === "online"
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode";

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    startDate: event.startDatetime.toISOString(),
    endDate: event.endDatetime.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: attendanceMode,
    location,
    organizer: {
      "@type": "Organization",
      name: "AsiaCommerce",
      url: "https://asiacommerce.net",
    },
    url,
    ...(event.primaryImageUrl && { image: event.primaryImageUrl }),
    ...(event.price !== null && event.price !== undefined && event.price > 0 && {
      offers: {
        "@type": "Offer",
        price: event.price,
        priceCurrency: event.currency ?? "IDR",
        url,
      },
    }),
  };
}
