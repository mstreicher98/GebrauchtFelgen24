import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { vehicleGeneration, vehicleMake, vehicleModel, vehicleWheelSpec } from "@/db/schema";
import { slugify } from "./format";
import { specRanges, type VEHICLE_COLUMNS, type VehicleRow } from "./vehicle-csv";

type Column = (typeof VEHICLE_COLUMNS)[number];

/** Alle Marken, Modelle und Baureihen (optional nur Autos oder Motorräder) als Zeilen für den CSV-Export. */
export async function loadVehicleRows(type?: "auto" | "motorrad"): Promise<VehicleRow[]> {
  const rows = await db
    .select({ make: vehicleMake, model: vehicleModel, gen: vehicleGeneration })
    .from(vehicleMake)
    .leftJoin(vehicleModel, eq(vehicleModel.makeId, vehicleMake.id))
    .leftJoin(vehicleGeneration, eq(vehicleGeneration.modelId, vehicleModel.id))
    .where(type ? eq(vehicleMake.type, type) : undefined)
    .orderBy(asc(vehicleMake.type), asc(vehicleMake.name), asc(vehicleModel.name), asc(vehicleGeneration.yearFrom), asc(vehicleGeneration.name));
  const genIds = rows.flatMap((r) => (r.gen ? [r.gen.id] : []));
  const specs = genIds.length ? await db.select().from(vehicleWheelSpec).where(inArray(vehicleWheelSpec.generationId, genIds)).orderBy(asc(vehicleWheelSpec.id)) : [];

  return rows.map(({ make, model, gen }) => ({
    type: make.type,
    make: make.name,
    model: model?.name ?? "",
    generation: gen?.name ?? null,
    yearFrom: gen?.yearFrom ?? null,
    yearTo: gen?.yearTo ?? null,
    boltCount: gen?.boltCount ?? null,
    boltCircle: gen?.boltCircle ?? null,
    centerBore: gen?.centerBore ?? null,
    thread: gen?.thread ?? null,
    fastener: gen?.fastener ?? null,
    etMin: gen?.etMin ?? null,
    etMax: gen?.etMax ?? null,
    specs: gen ? specs.filter((s) => s.generationId === gen.id).map(({ position, diameter, width, et, tireSize }) => ({ position, diameter, width, et, tireSize })) : [],
    notes: gen?.notes ?? null,
  }));
}

export type ImportSummary = { makes: number; models: number; generationsNew: number; generationsUpdated: number; rows: number };

/**
 * Übernimmt Zeilen aus dem CSV-Import: legt fehlende Marken/Modelle/Baureihen an und aktualisiert vorhandene Baureihen
 * (Zuordnung über Namen). Es wird nichts gelöscht. Spalten, die in der Datei fehlen, bleiben unverändert;
 * leere Radgrößen lassen die vorhandenen Radgrößen stehen. Mit apply=false wird nur gezählt (Vorschau).
 */
export async function importVehicleRows(rows: VehicleRow[], columns: Column[], apply: boolean): Promise<ImportSummary> {
  const has = (c: Column) => columns.includes(c);
  const summary: ImportSummary = { makes: 0, models: 0, generationsNew: 0, generationsUpdated: 0, rows: rows.length };

  // Doppelte Baureihen: die letzte Zeile gewinnt
  const byKey = new Map<string, VehicleRow>();
  for (const r of rows) byKey.set([r.type, slugify(r.make), slugify(r.model), r.generation?.toLowerCase() ?? ""].join("\u0000"), r);

  await db.transaction(async (tx) => {
    const makes = new Map((await tx.select().from(vehicleMake)).map((m) => [`${m.type}:${m.slug}`, m.id]));
    const models = new Map((await tx.select().from(vehicleModel)).map((m) => [`${m.makeId}:${m.slug}`, m.id]));
    const gens = new Map((await tx.select({ id: vehicleGeneration.id, modelId: vehicleGeneration.modelId, name: vehicleGeneration.name }).from(vehicleGeneration)).map((g) => [`${g.modelId}:${g.name.trim().toLowerCase()}`, g.id]));
    let tempId = -1;

    for (const r of byKey.values()) {
      const makeKey = `${r.type}:${slugify(r.make)}`;
      let makeId = makes.get(makeKey);
      if (makeId == null) {
        summary.makes++;
        makeId = apply ? (await tx.insert(vehicleMake).values({ type: r.type, name: r.make, slug: slugify(r.make) }).returning({ id: vehicleMake.id }))[0].id : tempId--;
        makes.set(makeKey, makeId);
      }
      if (!r.model) continue;
      const modelKey = `${makeId}:${slugify(r.model)}`;
      let modelId = models.get(modelKey);
      if (modelId == null) {
        summary.models++;
        modelId = apply ? (await tx.insert(vehicleModel).values({ makeId, name: r.model, slug: slugify(r.model) }).returning({ id: vehicleModel.id }))[0].id : tempId--;
        models.set(modelKey, modelId);
      }
      if (!r.generation) continue;

      const values: Partial<typeof vehicleGeneration.$inferInsert> = {};
      if (has("Baujahr von")) values.yearFrom = r.yearFrom;
      if (has("Baujahr bis")) values.yearTo = r.yearTo;
      if (has("Lochkreis")) Object.assign(values, { boltCount: r.boltCount, boltCircle: r.boltCircle });
      if (has("Mittenloch (mm)")) values.centerBore = r.centerBore;
      if (has("Gewinde")) values.thread = r.thread;
      if (has("Befestigung")) values.fastener = r.fastener;
      if (has("ET min")) values.etMin = r.etMin;
      if (has("ET max")) values.etMax = r.etMax;
      if (has("Hinweis")) values.notes = r.notes;
      const replaceSpecs = has("Radgrößen") && r.specs.length > 0;
      if (replaceSpecs) Object.assign(values, specRanges(r.specs));

      const genKey = `${modelId}:${r.generation.trim().toLowerCase()}`;
      let genId = gens.get(genKey);
      if (genId == null) {
        summary.generationsNew++;
        genId = apply ? (await tx.insert(vehicleGeneration).values({ ...values, modelId, name: r.generation }).returning({ id: vehicleGeneration.id }))[0].id : tempId--;
        gens.set(genKey, genId);
      } else {
        summary.generationsUpdated++;
        if (apply && Object.keys(values).length) await tx.update(vehicleGeneration).set(values).where(eq(vehicleGeneration.id, genId));
      }
      if (apply && replaceSpecs) {
        await tx.delete(vehicleWheelSpec).where(eq(vehicleWheelSpec.generationId, genId));
        await tx.insert(vehicleWheelSpec).values(r.specs.map((s) => ({ ...s, generationId: genId! })));
      }
    }
  });
  return summary;
}
