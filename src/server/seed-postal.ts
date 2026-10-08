import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { postalCode } from "@/db/schema";

/** Importiert PLZ-Koordinaten (GeoNames, CC BY 4.0) für AT/DE/CH, wenn die Tabelle leer ist. */
export async function seedPostalCodes() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(postalCode);
  if (n > 0) return false;
  const file = path.join(process.cwd(), "data", "plz.tsv");
  const raw = await readFile(file, "utf8").catch(() => null);
  if (!raw) {
    console.warn(`[seed] ${file} nicht gefunden – Umkreissuche deaktiviert`);
    return false;
  }
  const rows = raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [country, zip, place, lat, lng] = line.split("\t");
      return { country, zip, place, lat: Number(lat), lng: Number(lng) };
    });
  for (let i = 0; i < rows.length; i += 2000) {
    await db.insert(postalCode).values(rows.slice(i, i + 2000));
  }
  console.info(`[seed] ${rows.length} Postleitzahlen importiert`);
  return true;
}
