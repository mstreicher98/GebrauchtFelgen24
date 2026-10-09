import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { postalCode } from "@/db/schema";
import { getSetting, setSetting } from "@/lib/settings";

/** v2: Ortsnamen bereinigt („Graz,09.Bez.:Waltendorf“ → „Graz“) */
const PLZ_VERSION = "2";

/**
 * Importiert PLZ-Koordinaten (GeoNames, CC BY 4.0) für AT/DE/CH – beim ersten Start oder wenn
 * eine neuere Version der Daten mitgeliefert wird. Bereinigt dabei auch gespeicherte Ortsnamen.
 */
export async function seedPostalCodes() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(postalCode);
  if (n > 0 && (await getSetting("plz_version")) === PLZ_VERSION) return false;

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
  await db.transaction(async (tx) => {
    if (n > 0) await tx.delete(postalCode);
    for (let i = 0; i < rows.length; i += 2000) {
      await tx.insert(postalCode).values(rows.slice(i, i + 2000));
    }
    // Ortsnamen aus der alten Datenversion in Inseraten und Profilen bereinigen
    await tx.execute(sql`update listing set city = split_part(city, ',', 1) where city like '%,%'`);
    await tx.execute(sql`update "user" set city = split_part(city, ',', 1) where city like '%,%'`);
  });
  await setSetting("plz_version", PLZ_VERSION);
  console.info(`[seed] ${rows.length} Postleitzahlen importiert (Version ${PLZ_VERSION})`);
  return true;
}
