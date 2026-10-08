import "server-only";
import { and, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { listingImage } from "@/db/schema";
import { deleteStoredImage } from "@/lib/images";

/** Löscht hochgeladene Bilder, die nach 24 h keinem Inserat zugeordnet wurden. */
export async function runCleanupJob() {
  const orphans = await db
    .delete(listingImage)
    .where(and(isNull(listingImage.listingId), lt(listingImage.createdAt, new Date(Date.now() - 86400_000))))
    .returning({ key: listingImage.key });
  for (const o of orphans) await deleteStoredImage(o.key);
}
