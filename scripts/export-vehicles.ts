/**
 * Exportiert den Start-Datensatz der Fahrzeugdatenbank als CSV (Excel-kompatibel, Semikolon, UTF-8 mit BOM).
 *   npx tsx scripts/export-vehicles.ts > data/vehicles/fahrzeugliste.csv
 */
import { cars } from "../data/vehicles/cars";
import { motorcycles } from "../data/vehicles/motorcycles";
import { parseSpec } from "../data/vehicles/types";

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const num = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

const rows: string[][] = [
  ["Typ", "Marke", "Modell", "Baureihe", "Baujahr von", "Baujahr bis", "Lochkreis", "Mittenloch (mm)", "Befestigung", "ET min", "ET max", "Achse", "Felge (Breite x Zoll)", "ET", "Reifengröße", "Hinweis"],
];
for (const make of [...cars, ...motorcycles]) {
  for (const [model, gens] of Object.entries(make.models)) {
    for (const g of gens) {
      for (const s of g.specs.flatMap(parseSpec)) {
        rows.push([
          make.type === "auto" ? "Auto" : "Motorrad",
          make.name,
          model,
          g.name,
          g.from?.toString() ?? "",
          g.to?.toString() ?? "aktuell",
          g.pcd ?? "",
          num(g.centerBore),
          g.thread ?? "",
          num(g.et?.[0]),
          num(g.et?.[1]),
          s.position === "vorne" ? "vorne" : s.position === "hinten" ? "hinten" : "vorne + hinten",
          s.width != null ? `${num(s.width)}${make.type === "auto" ? "J" : ""}x${num(s.diameter)}` : `${num(s.diameter)} Zoll`,
          num(s.et),
          s.tireSize ?? "",
          g.notes ?? "",
        ]);
      }
    }
  }
}
process.stdout.write("﻿" + rows.map((r) => r.map(esc).join(";")).join("\r\n") + "\r\n");
