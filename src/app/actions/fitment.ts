"use server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { listing, listingFitment } from "@/db/schema";
import { checkFitment, type FitResult } from "@/lib/fitment";
import { getGeneration, toFitGeneration } from "@/lib/vehicles";

export async function checkListingFit(listingId: number, generationId: number): Promise<FitResult | null> {
  const [l] = await db.select().from(listing).where(eq(listing.id, listingId)).limit(1);
  const gen = await getGeneration(generationId);
  if (!l || !gen) return null;
  if (gen.type !== l.vehicleType) return { level: "nein", hints: [gen.type === "auto" ? "Das ist eine Motorradfelge." : "Das ist eine Autofelge."] };
  const [explicit] = await db
    .select()
    .from(listingFitment)
    .where(and(eq(listingFitment.listingId, listingId), eq(listingFitment.generationId, generationId)))
    .limit(1);
  return checkFitment(toFitGeneration(gen), { ...l, explicitFit: !!explicit });
}
