import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/konto", "/nachrichten", "/admin", "/api", "/inserat/neu"] }],
    sitemap: `${env.appUrl}/sitemap.xml`,
  };
}
