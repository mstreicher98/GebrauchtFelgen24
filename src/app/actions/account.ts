"use server";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { listingImage, user } from "@/db/schema";
import { deleteStoredImage } from "@/lib/images";
import { lookupPostalCode } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Bitte Namen angeben").max(80),
  accountType: z.enum(["privat", "haendler"]),
  companyName: z.string().trim().max(120).optional(),
  companyUid: z.string().trim().max(40).optional(),
  companyWebsite: z
    .string()
    .trim()
    .max(200)
    .refine((v) => !v || /^https?:\/\//.test(v), "Bitte mit https:// angeben")
    .optional(),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => !v || /^\+?[\d\s/()-]{6,}$/.test(v), "Ungültige Telefonnummer")
    .optional(),
  zip: z.string().trim().max(10).optional(),
  country: z.enum(["AT", "DE", "CH"]).default("AT"),
  bio: z.string().trim().max(1000).optional(),
});

export async function updateProfile(input: unknown): Promise<{ error?: string; errors?: Record<string, string> }> {
  const me = await getCurrentUser();
  if (!me) return { error: "Nicht angemeldet" };
  const r = profileSchema.safeParse(input);
  if (!r.success) {
    return { errors: Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  const d = r.data;
  if (d.accountType === "haendler" && !d.companyName) return { errors: { companyName: "Bitte Firmennamen angeben" } };
  let city: string | null = null;
  if (d.zip) {
    const pc = await lookupPostalCode(d.zip, d.country);
    if (!pc) return { errors: { zip: "Postleitzahl nicht gefunden" } };
    city = pc.place;
  }
  await db
    .update(user)
    .set({
      name: d.name,
      accountType: d.accountType,
      companyName: d.accountType === "haendler" ? d.companyName : null,
      companyUid: d.accountType === "haendler" ? d.companyUid || null : null,
      companyWebsite: d.accountType === "haendler" ? d.companyWebsite || null : null,
      companyLogoKey: d.accountType === "haendler" ? me.companyLogoKey : null,
      phone: d.phone || null,
      zip: d.zip || null,
      city,
      country: d.country,
      bio: d.bio || null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, me.id));
  if (d.accountType !== "haendler" && me.companyLogoKey) void deleteStoredImage(me.companyLogoKey);
  revalidatePath("/konto", "layout");
  return {};
}

/** Händler-Logo setzen (Bild-Schlüssel aus /api/upload) oder entfernen (null). */
export async function updateCompanyLogo(key: string | null): Promise<{ error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { error: "Nicht angemeldet" };
  if (me.accountType !== "haendler") return { error: "Ein Logo ist nur mit Händlerkonto möglich." };
  if (key) {
    // Nur eigene, noch freie Uploads übernehmen. Der Eintrag entfällt, damit die Aufräum-Routine das Bild nicht löscht.
    const claimed = await db
      .delete(listingImage)
      .where(and(eq(listingImage.key, key), eq(listingImage.userId, me.id), isNull(listingImage.listingId)))
      .returning({ key: listingImage.key });
    if (!claimed.length) return { error: "Bild nicht gefunden – bitte erneut hochladen." };
  }
  await db.update(user).set({ companyLogoKey: key, updatedAt: new Date() }).where(eq(user.id, me.id));
  if (me.companyLogoKey && me.companyLogoKey !== key) void deleteStoredImage(me.companyLogoKey);
  revalidatePath("/konto", "layout");
  return {};
}

export async function updateNotifications(notifyEmail: boolean, notifyPush: boolean) {
  const me = await getCurrentUser();
  if (!me) return;
  await db.update(user).set({ notifyEmail, notifyPush }).where(eq(user.id, me.id));
  revalidatePath("/konto/einstellungen");
}
