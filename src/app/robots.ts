import type { MetadataRoute } from "next";
import { APP_URL } from "@/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/events/"],
        disallow: ["/admin/", "/api/", "/login", "/register/", "/payment/", "/my-events"],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
