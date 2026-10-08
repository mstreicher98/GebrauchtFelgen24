import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { favorite } from "@/db/schema";

export async function getFavoriteIds(userId: string | undefined, listingIds: number[]) {
  if (!userId || listingIds.length === 0) return new Set<number>();
  const rows = await db
    .select({ id: favorite.listingId })
    .from(favorite)
    .where(and(eq(favorite.userId, userId), inArray(favorite.listingId, listingIds)));
  return new Set(rows.map((r) => r.id));
}
