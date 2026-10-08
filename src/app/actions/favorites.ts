"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { favorite } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";

export async function toggleFavorite(listingId: number, on: boolean): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "login" };
  if (!Number.isInteger(listingId)) return { error: "Ungültiges Inserat" };
  try {
    if (on) await db.insert(favorite).values({ userId: user.id, listingId }).onConflictDoNothing();
    else await db.delete(favorite).where(and(eq(favorite.userId, user.id), eq(favorite.listingId, listingId)));
  } catch {
    return { error: "Konnte Merkliste nicht aktualisieren" };
  }
  revalidatePath("/konto/merkliste");
  return {};
}
