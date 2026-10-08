import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { vehicleGeneration, vehicleMake, vehicleModel, vehicleWheelSpec } from "@/db/schema";
import { slugify } from "@/lib/format";
import { cars } from "../../data/vehicles/cars";
import { motorcycles } from "../../data/vehicles/motorcycles";
import { parseSpec, type GenDef } from "../../data/vehicles/types";

function deriveRanges(g: GenDef) {
  const specs = g.specs.flatMap(parseSpec);
  const diameters = specs.map((s) => s.diameter);
  const widths = specs.map((s) => s.width).filter((w): w is number => w != null);
  const ets = specs.map((s) => s.et).filter((e): e is number => e != null);
  let etMin = g.et?.[0] ?? null;
  let etMax = g.et?.[1] ?? null;
  if (!g.et && ets.length) {
    etMin = Math.min(...ets) - 5;
    etMax = Math.max(...ets) + 5;
  }
  return {
    specs,
    diameterMin: diameters.length ? Math.floor(Math.min(...diameters)) : null,
    diameterMax: diameters.length ? Math.ceil(Math.max(...diameters)) : null,
    widthMin: widths.length ? Math.min(...widths) - 0.5 : null,
    widthMax: widths.length ? Math.max(...widths) + 0.5 : null,
    etMin,
    etMax,
  };
}

/** Importiert den Start-Datensatz, wenn die Fahrzeugtabellen leer sind. */
export async function seedVehicles() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(vehicleMake);
  if (n > 0) return false;

  let gens = 0;
  for (const m of [...cars, ...motorcycles]) {
    const [mk] = await db
      .insert(vehicleMake)
      .values({ type: m.type, name: m.name, slug: slugify(m.name) })
      .returning({ id: vehicleMake.id });
    for (const [modelName, defs] of Object.entries(m.models)) {
      const [md] = await db
        .insert(vehicleModel)
        .values({ makeId: mk.id, name: modelName, slug: slugify(modelName) })
        .returning({ id: vehicleModel.id });
      for (const g of defs) {
        const r = deriveRanges(g);
        const pcd = g.pcd?.match(/^(\d+)x([\d.]+)$/);
        const [thread, fastener] = g.thread ? [g.thread.split(" ")[0], g.thread.split(" ")[1] ?? null] : [null, null];
        const [gr] = await db
          .insert(vehicleGeneration)
          .values({
            modelId: md.id,
            name: g.name,
            yearFrom: g.from,
            yearTo: g.to,
            boltCount: pcd ? Number(pcd[1]) : null,
            boltCircle: pcd ? Number(pcd[2]) : null,
            centerBore: g.centerBore,
            thread,
            fastener,
            etMin: r.etMin,
            etMax: r.etMax,
            widthMin: r.widthMin,
            widthMax: r.widthMax,
            diameterMin: r.diameterMin,
            diameterMax: r.diameterMax,
            notes: g.notes ?? null,
          })
          .returning({ id: vehicleGeneration.id });
        if (r.specs.length) {
          await db.insert(vehicleWheelSpec).values(r.specs.map((s) => ({ ...s, generationId: gr.id })));
        }
        gens++;
      }
    }
  }
  console.info(`[seed] Fahrzeugdatenbank importiert (${gens} Generationen/Modelle)`);
  return true;
}
