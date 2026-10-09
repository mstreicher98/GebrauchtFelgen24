import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { listing, user } from "@/db/schema";
import { parseFilters } from "@/lib/filters";
import { buildConditions } from "@/lib/search";

/**
 * Live-Trefferzahl für die Suchmaske der Startseite.
 * Nimmt dieselben URL-Parameter wie /suche entgegen und liefert `{ total }`.
 */
export async function GET(req: Request) {
  const f = parseFilters(new URL(req.url).searchParams);
  const { conds } = await buildConditions(f);
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(listing)
    .innerJoin(user, eq(user.id, listing.userId))
    .where(and(...conds));
  return Response.json({ total }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
}
