import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { vehicleGeneration, vehicleMake, vehicleModel, vehicleWheelSpec } from "@/db/schema";
import type { FitGeneration } from "./fitment";
import { yearRange } from "./format";

export type GenerationWithContext = Awaited<ReturnType<typeof getGeneration>>;

export const getGeneration = cache(async (id: number) => {
  const rows = await db
    .select({
      gen: vehicleGeneration,
      modelName: vehicleModel.name,
      modelSlug: vehicleModel.slug,
      makeName: vehicleMake.name,
      makeSlug: vehicleMake.slug,
      type: vehicleMake.type,
    })
    .from(vehicleGeneration)
    .innerJoin(vehicleModel, eq(vehicleModel.id, vehicleGeneration.modelId))
    .innerJoin(vehicleMake, eq(vehicleMake.id, vehicleModel.makeId))
    .where(eq(vehicleGeneration.id, id))
    .limit(1);
  const r = rows[0];
  if (!r) return null;
  const specs = await db
    .select()
    .from(vehicleWheelSpec)
    .where(eq(vehicleWheelSpec.generationId, id))
    .orderBy(asc(vehicleWheelSpec.diameter), asc(vehicleWheelSpec.width));
  return {
    ...r.gen,
    modelName: r.modelName,
    modelSlug: r.modelSlug,
    makeName: r.makeName,
    makeSlug: r.makeSlug,
    type: r.type,
    specs,
    fullName: `${r.makeName} ${generationLabel(r.modelName, r.gen.name)}`,
  };
});

/** „Golf" + „Golf VII (5G)" → „Golf VII (5G)", „3er" + „G20" → „3er G20" */
export function generationLabel(modelName: string, genName: string) {
  return genName.toLowerCase().startsWith(modelName.toLowerCase()) ? genName : `${modelName} ${genName}`;
}

export function toFitGeneration(g: NonNullable<GenerationWithContext>): FitGeneration {
  return {
    boltCount: g.boltCount,
    boltCircle: g.boltCircle,
    centerBore: g.centerBore,
    etMin: g.etMin,
    etMax: g.etMax,
    widthMin: g.widthMin,
    widthMax: g.widthMax,
    diameterMin: g.diameterMin,
    diameterMax: g.diameterMax,
    specs: g.specs.map((s) => ({
      position: s.position,
      diameter: s.diameter,
      width: s.width,
      et: s.et,
      tireSize: s.tireSize,
    })),
  };
}

export const getMakes = cache(async (type: "auto" | "motorrad") =>
  db.select().from(vehicleMake).where(eq(vehicleMake.type, type)).orderBy(asc(vehicleMake.name)),
);

export async function getModels(makeId: number) {
  return db.select().from(vehicleModel).where(eq(vehicleModel.makeId, makeId)).orderBy(asc(vehicleModel.name));
}

export async function getGenerations(modelId: number) {
  const gens = await db
    .select()
    .from(vehicleGeneration)
    .where(eq(vehicleGeneration.modelId, modelId))
    .orderBy(asc(vehicleGeneration.yearFrom));
  return gens.map((g) => ({ ...g, label: `${g.name}${g.yearFrom ? ` (${yearRange(g.yearFrom, g.yearTo)})` : ""}` }));
}

/** Kurznamen für mehrere Generationen auf einmal (z. B. für „Passend für"). */
export async function getGenerationNames(ids: number[]) {
  if (ids.length === 0) return [];
  return db
    .select({
      id: vehicleGeneration.id,
      name: vehicleGeneration.name,
      yearFrom: vehicleGeneration.yearFrom,
      yearTo: vehicleGeneration.yearTo,
      modelName: vehicleModel.name,
      makeName: vehicleMake.name,
    })
    .from(vehicleGeneration)
    .innerJoin(vehicleModel, eq(vehicleModel.id, vehicleGeneration.modelId))
    .innerJoin(vehicleMake, eq(vehicleMake.id, vehicleModel.makeId))
    .where(inArray(vehicleGeneration.id, ids));
}
