"use server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { savedSearch } from "@/db/schema";
import { describeFilters, filtersToParams, parseFilters } from "@/lib/filters";
import { getCurrentUser } from "@/lib/session";
import { getGeneration } from "@/lib/vehicles";

export async function saveSearch(query: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "login" };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(savedSearch).where(eq(savedSearch.userId, user.id));
  if (n >= 30) return { error: "Maximal 30 Suchaufträge möglich." };
  const f = parseFilters(new URLSearchParams(query));
  const gen = f.fahrzeug ? await getGeneration(f.fahrzeug) : null;
  const params = filtersToParams({ ...f, seite: 1, sort: "neu" });
  await db.insert(savedSearch).values({
    userId: user.id,
    name: describeFilters(f, gen?.fullName).slice(0, 120),
    query: Object.fromEntries(params.entries()),
  });
  revalidatePath("/konto/suchauftraege");
  return {};
}

export async function deleteSavedSearch(id: number) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.delete(savedSearch).where(and(eq(savedSearch.id, id), eq(savedSearch.userId, user.id)));
  revalidatePath("/konto/suchauftraege");
}

export async function setSavedSearchNotify(id: number, notify: boolean) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.update(savedSearch).set({ notify }).where(and(eq(savedSearch.id, id), eq(savedSearch.userId, user.id)));
  revalidatePath("/konto/suchauftraege");
}
