import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { listing, vehicleMake } from "@/db/schema";
import { env } from "@/lib/env";
import { listingUrl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, makes] = await Promise.all([
    db
      .select({ id: listing.id, title: listing.title, updatedAt: listing.updatedAt })
      .from(listing)
      .where(eq(listing.status, "aktiv"))
      .orderBy(desc(listing.publishedAt))
      .limit(20000),
    db.select({ slug: vehicleMake.slug, type: vehicleMake.type }).from(vehicleMake),
  ]);
  const base = env.appUrl;
  return [
    { url: `${base}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/suche`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/fahrzeuge`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/ratgeber`, changeFrequency: "monthly", priority: 0.5 },
    ...makes.map((m) => ({ url: `${base}/fahrzeuge/${m.type}/${m.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...listings.map((l) => ({ url: `${base}${listingUrl(l)}`, lastModified: l.updatedAt, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
