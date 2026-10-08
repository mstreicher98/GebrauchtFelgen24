"use server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { hsnTsn, listing, report, session, user, vehicleGeneration, vehicleMake, vehicleModel, vehicleWheelSpec } from "@/db/schema";
import { slugify } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { parseSpec } from "../../../data/vehicles/types";

async function admin() {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") throw new Error("Keine Berechtigung");
  return me;
}

export async function resolveReport(id: number) {
  await admin();
  await db.update(report).set({ status: "erledigt", handledAt: new Date() }).where(eq(report.id, id));
  revalidatePath("/admin", "layout");
}

export async function adminSetListingStatus(id: number, status: "aktiv" | "gesperrt" | "deaktiviert") {
  await admin();
  await db.update(listing).set({ status, updatedAt: new Date() }).where(eq(listing.id, id));
  revalidatePath("/admin/inserate");
}

export async function adminFeatureListing(id: number, days: number) {
  await admin();
  await db
    .update(listing)
    .set({ featuredUntil: days > 0 ? new Date(Date.now() + days * 86400_000) : null })
    .where(eq(listing.id, id));
  revalidatePath("/admin/inserate");
  revalidatePath("/");
}

export async function adminSetBanned(userId: string, banned: boolean) {
  const me = await admin();
  if (userId === me.id) throw new Error("Du kannst dich nicht selbst sperren.");
  await db.update(user).set({ banned }).where(eq(user.id, userId));
  if (banned) {
    await db.delete(session).where(eq(session.userId, userId));
    await db.update(listing).set({ status: "gesperrt" }).where(and(eq(listing.userId, userId), eq(listing.status, "aktiv")));
  }
  revalidatePath("/admin/nutzer");
}

export async function adminSetRole(userId: string, role: "user" | "admin") {
  const me = await admin();
  if (userId === me.id) throw new Error("Eigene Rolle kann nicht geändert werden.");
  await db.update(user).set({ role }).where(eq(user.id, userId));
  revalidatePath("/admin/nutzer");
}

/* ---------------- Fahrzeugdatenbank ---------------- */

export async function adminCreateMake(type: "auto" | "motorrad", name: string) {
  await admin();
  const n = name.trim();
  if (!n) return { error: "Name fehlt" };
  await db.insert(vehicleMake).values({ type, name: n, slug: slugify(n) }).onConflictDoNothing();
  revalidatePath("/admin/fahrzeuge");
  return {};
}

export async function adminCreateModel(makeId: number, name: string) {
  await admin();
  const n = name.trim();
  if (!n) return { error: "Name fehlt" };
  await db.insert(vehicleModel).values({ makeId, name: n, slug: slugify(n) }).onConflictDoNothing();
  revalidatePath(`/admin/fahrzeuge/${makeId}`);
  return {};
}

export async function adminDeleteModel(makeId: number, modelId: number) {
  await admin();
  await db.delete(vehicleModel).where(and(eq(vehicleModel.id, modelId), eq(vehicleModel.makeId, makeId)));
  revalidatePath(`/admin/fahrzeuge/${makeId}`);
}

export type GenerationInput = {
  id?: number;
  modelId: number;
  name: string;
  yearFrom: string;
  yearTo: string;
  pcd: string;
  centerBore: string;
  thread: string;
  fastener: string;
  etMin: string;
  etMax: string;
  specs: string;
  notes: string;
};

const num = (s: string) => {
  const v = s.trim().replace(",", ".");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function adminSaveGeneration(makeId: number, g: GenerationInput): Promise<{ error?: string }> {
  await admin();
  if (!g.name.trim()) return { error: "Name fehlt" };
  let parsed;
  try {
    parsed = g.specs
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .flatMap(parseSpec);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const pcd = g.pcd.trim().replace(",", ".").match(/^(\d+)x([\d.]+)$/);
  if (g.pcd.trim() && !pcd) return { error: "Lochkreis im Format 5x112 angeben" };
  const diameters = parsed.map((s) => s.diameter);
  const widths = parsed.map((s) => s.width).filter((w): w is number => w != null);
  const values = {
    modelId: g.modelId,
    name: g.name.trim(),
    yearFrom: num(g.yearFrom),
    yearTo: num(g.yearTo),
    boltCount: pcd ? Number(pcd[1]) : null,
    boltCircle: pcd ? Number(pcd[2]) : null,
    centerBore: num(g.centerBore),
    thread: g.thread.trim() || null,
    fastener: g.fastener.trim() || null,
    etMin: num(g.etMin),
    etMax: num(g.etMax),
    diameterMin: diameters.length ? Math.floor(Math.min(...diameters)) : null,
    diameterMax: diameters.length ? Math.ceil(Math.max(...diameters)) : null,
    widthMin: widths.length ? Math.min(...widths) - 0.5 : null,
    widthMax: widths.length ? Math.max(...widths) + 0.5 : null,
    notes: g.notes.trim() || null,
  };
  await db.transaction(async (tx) => {
    let id = g.id;
    if (id) await tx.update(vehicleGeneration).set(values).where(eq(vehicleGeneration.id, id));
    else [{ id }] = await tx.insert(vehicleGeneration).values(values).returning({ id: vehicleGeneration.id });
    await tx.delete(vehicleWheelSpec).where(eq(vehicleWheelSpec.generationId, id!));
    if (parsed.length) await tx.insert(vehicleWheelSpec).values(parsed.map((s) => ({ ...s, generationId: id! })));
  });
  revalidatePath(`/admin/fahrzeuge/${makeId}`);
  return {};
}

export async function adminDeleteGeneration(makeId: number, id: number) {
  await admin();
  await db.delete(vehicleGeneration).where(eq(vehicleGeneration.id, id));
  revalidatePath(`/admin/fahrzeuge/${makeId}`);
}

/** CSV-Import: HSN;TSN;Generation-ID;Beschreibung (eine Zeile pro Eintrag) */
export async function adminImportHsnTsn(csv: string): Promise<{ imported: number; errors: string[] }> {
  await admin();
  const errors: string[] = [];
  const rows: { hsn: string; tsn: string; generationId: number; description: string | null }[] = [];
  for (const [i, line] of csv.split(/\r?\n/).entries()) {
    const l = line.trim();
    if (!l || l.startsWith("#") || /^hsn/i.test(l)) continue;
    const [hsn, tsn, gid, ...desc] = l.split(/[;,\t]/).map((x) => x.trim());
    if (!/^\d{1,4}$/.test(hsn ?? "") || !/^[A-Z0-9]{3}$/i.test(tsn ?? "") || !Number(gid)) {
      errors.push(`Zeile ${i + 1}: ungültig („${l}")`);
      continue;
    }
    rows.push({ hsn: hsn.padStart(4, "0"), tsn: tsn.toUpperCase(), generationId: Number(gid), description: desc.join(" ") || null });
  }
  const ids = [...new Set(rows.map((r) => r.generationId))];
  const existing = ids.length ? await db.select({ id: vehicleGeneration.id }).from(vehicleGeneration).where(inArray(vehicleGeneration.id, ids)) : [];
  const ok = new Set(existing.map((e) => e.id));
  const valid = rows.filter((r) => {
    if (!ok.has(r.generationId)) errors.push(`${r.hsn}/${r.tsn}: Generation ${r.generationId} existiert nicht`);
    return ok.has(r.generationId);
  });
  for (let i = 0; i < valid.length; i += 500) {
    const chunk = valid.slice(i, i + 500);
    for (const r of chunk) {
      await db
        .insert(hsnTsn)
        .values(r)
        .onConflictDoUpdate({ target: [hsnTsn.hsn, hsnTsn.tsn], set: { generationId: r.generationId, description: r.description } });
    }
  }
  revalidatePath("/admin/hsn-tsn");
  return { imported: valid.length, errors: errors.slice(0, 50) };
}
