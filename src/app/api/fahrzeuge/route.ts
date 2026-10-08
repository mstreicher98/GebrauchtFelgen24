import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { hsnTsn } from "@/db/schema";
import { getGeneration, getGenerations, getMakes, getModels } from "@/lib/vehicles";

/**
 * Daten für die Fahrzeugauswahl:
 *   ?typ=auto|motorrad → Marken
 *   ?marke=ID          → Modelle
 *   ?modell=ID         → Generationen
 *   ?generation=ID     → Details
 *   ?hsn=0603&tsn=BQR  → Generation zu Schlüsselnummer
 */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const headers = { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" };
  const typ = p.get("typ");
  if (typ === "auto" || typ === "motorrad") {
    const makes = await getMakes(typ);
    return Response.json(makes.map((m) => ({ id: m.id, name: m.name })), { headers });
  }
  const marke = Number(p.get("marke"));
  if (marke) {
    const models = await getModels(marke);
    return Response.json(models.map((m) => ({ id: m.id, name: m.name })), { headers });
  }
  const modell = Number(p.get("modell"));
  if (modell) {
    const gens = await getGenerations(modell);
    return Response.json(gens.map((g) => ({ id: g.id, name: g.label })), { headers });
  }
  const generation = Number(p.get("generation"));
  if (generation) {
    const g = await getGeneration(generation);
    return g ? Response.json(g, { headers }) : Response.json(null, { status: 404 });
  }
  const hsn = p.get("hsn")?.trim();
  const tsn = p.get("tsn")?.trim().toUpperCase();
  if (hsn && tsn) {
    const [row] = await db
      .select()
      .from(hsnTsn)
      .where(and(eq(hsnTsn.hsn, hsn.padStart(4, "0")), eq(hsnTsn.tsn, tsn.slice(0, 3))))
      .limit(1);
    if (!row) return Response.json({ error: "Schlüsselnummer nicht gefunden" }, { status: 404 });
    const g = await getGeneration(row.generationId);
    return Response.json(g);
  }
  return Response.json({ error: "Parameter fehlt" }, { status: 400 });
}
