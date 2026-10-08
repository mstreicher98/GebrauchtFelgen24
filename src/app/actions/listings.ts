"use server";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { listing, listingFitment, listingImage } from "@/db/schema";
import { env } from "@/lib/env";
import { listingUrl, parsePcd } from "@/lib/format";
import { deleteStoredImage } from "@/lib/images";
import { fieldErrors, listingSchema } from "@/lib/listing-schema";
import { rateLimit } from "@/lib/rate-limit";
import { lookupPostalCode } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

export type SaveResult = { ok: true; url: string } | { ok: false; errors: Record<string, string> };

export async function saveListing(id: number | null, input: unknown): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, errors: { _: "Bitte melde dich an." } };
  if (!user.emailVerified) return { ok: false, errors: { _: "Bitte bestätige zuerst deine E-Mail-Adresse." } };
  if (!id && !rateLimit(`listing:${user.id}`, 20, 60 * 60 * 1000)) {
    return { ok: false, errors: { _: "Zu viele neue Inserate in kurzer Zeit – bitte später erneut versuchen." } };
  }

  const parsed = listingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;

  let existing: typeof listing.$inferSelect | undefined;
  if (id) {
    [existing] = await db.select().from(listing).where(eq(listing.id, id)).limit(1);
    if (!existing || (existing.userId !== user.id && user.role !== "admin")) {
      return { ok: false, errors: { _: "Inserat nicht gefunden." } };
    }
    if (existing.status === "gesperrt" && user.role !== "admin") {
      return { ok: false, errors: { _: "Dieses Inserat wurde gesperrt." } };
    }
  }
  const ownerId = existing?.userId ?? user.id;

  // Bilder müssen dem Nutzer gehören und frei bzw. diesem Inserat zugeordnet sein
  const imgs = await db
    .select({ key: listingImage.key })
    .from(listingImage)
    .where(
      and(
        inArray(listingImage.key, d.imageKeys),
        eq(listingImage.userId, ownerId),
        id ? or(isNull(listingImage.listingId), eq(listingImage.listingId, id)) : isNull(listingImage.listingId),
      ),
    );
  if (imgs.length !== d.imageKeys.length) return { ok: false, errors: { imageKeys: "Mindestens ein Foto ist ungültig – bitte erneut hochladen." } };

  const pc = await lookupPostalCode(d.zip, d.country);
  if (!pc) return { ok: false, errors: { zip: "Postleitzahl nicht gefunden" } };

  const pcd = d.vehicleType === "auto" ? parsePcd(d.pcd) : null;
  const isKomplett = d.kind === "komplettrad";
  const values = {
    vehicleType: d.vehicleType,
    kind: d.kind,
    title: d.title,
    description: d.description,
    material: d.material,
    rimBrand: d.rimBrand,
    rimModel: d.rimModel || null,
    diameter: d.diameter,
    width: d.width,
    boltCount: pcd?.boltCount ?? null,
    boltCircle: pcd?.boltCircle ?? null,
    et: d.vehicleType === "auto" ? (d.et ?? null) : null,
    centerBore: d.vehicleType === "auto" ? (d.centerBore ?? null) : null,
    quantity: d.quantity,
    wheelPosition: d.vehicleType === "motorrad" ? d.wheelPosition : ("alle" as const),
    condition: d.condition,
    hasCertificate: d.hasCertificate,
    tireSize: isKomplett ? d.tireSize || null : null,
    tireBrand: isKomplett ? d.tireBrand || null : null,
    season: isKomplett && d.season ? d.season : null,
    treadDepth: isKomplett ? (d.treadDepth ?? null) : null,
    dot: isKomplett ? d.dot || null : null,
    tpms: isKomplett ? d.tpms : null,
    priceCents: Math.round(d.price * 100),
    priceType: d.priceType,
    shipping: d.shipping,
    pickup: d.pickup,
    shippingCostCents: d.shipping && d.shippingCost != null ? Math.round(d.shippingCost * 100) : null,
    zip: d.zip,
    city: pc.place,
    country: d.country,
    lat: pc.lat,
    lng: pc.lng,
    showPhone: d.showPhone,
    updatedAt: new Date(),
  };

  const listingId = await db.transaction(async (tx) => {
    let lid: number;
    if (existing) {
      await tx.update(listing).set(values).where(eq(listing.id, existing.id));
      lid = existing.id;
      // entfernte Bilder lösen
      const old = await tx.select({ key: listingImage.key }).from(listingImage).where(eq(listingImage.listingId, lid));
      const removed = old.map((o) => o.key).filter((k) => !d.imageKeys.includes(k));
      if (removed.length) await tx.delete(listingImage).where(inArray(listingImage.key, removed));
      for (const k of removed) void deleteStoredImage(k);
    } else {
      const now = new Date();
      const [row] = await tx
        .insert(listing)
        .values({
          ...values,
          userId: user.id,
          publishedAt: now,
          expiresAt: new Date(now.getTime() + env.listingLifetimeDays * 86400_000),
        })
        .returning({ id: listing.id });
      lid = row.id;
    }
    for (const [i, key] of d.imageKeys.entries()) {
      await tx.update(listingImage).set({ listingId: lid, position: i }).where(eq(listingImage.key, key));
    }
    await tx.delete(listingFitment).where(eq(listingFitment.listingId, lid));
    if (d.fitments.length) {
      await tx
        .insert(listingFitment)
        .values([...new Set(d.fitments)].map((g) => ({ listingId: lid, generationId: g })))
        .onConflictDoNothing();
    }
    return lid;
  });

  revalidatePath("/");
  revalidatePath("/konto/inserate");
  return { ok: true, url: listingUrl({ id: listingId, title: d.title }) };
}

async function ownListing(id: number) {
  const user = await getCurrentUser();
  if (!user) return null;
  const [l] = await db.select().from(listing).where(eq(listing.id, id)).limit(1);
  if (!l || (l.userId !== user.id && user.role !== "admin")) return null;
  return { user, l };
}

export async function setListingStatus(id: number, status: "aktiv" | "verkauft" | "deaktiviert"): Promise<{ error?: string }> {
  const r = await ownListing(id);
  if (!r) return { error: "Inserat nicht gefunden" };
  if (r.l.status === "gesperrt" && r.user.role !== "admin") return { error: "Dieses Inserat wurde gesperrt." };
  const patch: Partial<typeof listing.$inferInsert> = { status, updatedAt: new Date() };
  if (status === "verkauft") patch.soldAt = new Date();
  if (status === "aktiv" && r.l.expiresAt < new Date()) {
    patch.expiresAt = new Date(Date.now() + env.listingLifetimeDays * 86400_000);
    patch.expiryReminderSentAt = null;
  }
  await db.update(listing).set(patch).where(eq(listing.id, id));
  revalidatePath("/konto/inserate");
  revalidatePath(listingUrl(r.l));
  return {};
}

export async function extendListing(id: number): Promise<{ error?: string }> {
  const r = await ownListing(id);
  if (!r) return { error: "Inserat nicht gefunden" };
  if (r.l.status === "gesperrt" || r.l.status === "verkauft") return { error: "Dieses Inserat kann nicht verlängert werden." };
  await db
    .update(listing)
    .set({
      status: "aktiv",
      expiresAt: new Date(Date.now() + env.listingLifetimeDays * 86400_000),
      expiryReminderSentAt: null,
      updatedAt: new Date(),
    })
    .where(eq(listing.id, id));
  revalidatePath("/konto/inserate");
  return {};
}

export async function deleteListing(id: number): Promise<{ error?: string }> {
  const r = await ownListing(id);
  if (!r) return { error: "Inserat nicht gefunden" };
  const imgs = await db.select({ key: listingImage.key }).from(listingImage).where(eq(listingImage.listingId, id));
  await db.delete(listing).where(eq(listing.id, id));
  for (const i of imgs) void deleteStoredImage(i.key);
  revalidatePath("/konto/inserate");
  revalidatePath("/");
  return {};
}
