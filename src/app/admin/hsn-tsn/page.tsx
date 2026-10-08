import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { hsnTsn, vehicleGeneration, vehicleMake, vehicleModel } from "@/db/schema";
import { HsnImportForm } from "@/components/admin-vehicle-forms";

export default async function HsnPage() {
  const [[{ n }], latest] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(hsnTsn),
    db
      .select({ hsn: hsnTsn.hsn, tsn: hsnTsn.tsn, description: hsnTsn.description, gen: vehicleGeneration.name, model: vehicleModel.name, make: vehicleMake.name })
      .from(hsnTsn)
      .innerJoin(vehicleGeneration, eq(vehicleGeneration.id, hsnTsn.generationId))
      .innerJoin(vehicleModel, eq(vehicleModel.id, vehicleGeneration.modelId))
      .innerJoin(vehicleMake, eq(vehicleMake.id, vehicleModel.makeId))
      .orderBy(desc(hsnTsn.hsn))
      .limit(50),
  ]);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-xl uppercase">HSN/TSN-Zuordnung</h2>
        <p className="mt-1 text-sm text-muted">
          Schlüsselnummern aus dem deutschen Fahrzeugschein (Feld 2.1/2.2) einer Baureihe zuordnen. Die Baureihen-ID steht im Bereich „Fahrzeuge“ bei jeder Baureihe.
          Aktuell: <strong>{n}</strong> Einträge.
        </p>
        <div className="mt-4">
          <HsnImportForm />
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-faint">
            <tr>
              <th className="p-3">HSN</th>
              <th className="p-3">TSN</th>
              <th className="p-3">Fahrzeug</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((r) => (
              <tr key={`${r.hsn}${r.tsn}`} className="border-t border-line">
                <td className="p-3 font-mono">{r.hsn}</td>
                <td className="p-3 font-mono">{r.tsn}</td>
                <td className="p-3">
                  {r.make} {r.gen} <span className="text-faint">{r.description}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
