import { sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { NewMakeForm } from "@/components/admin-vehicle-forms";

export default async function AdminVehiclesPage() {
  const rows = await db.execute<{ id: number; type: string; name: string; gens: number }>(sql`
    select mk.id, mk.type, mk.name, count(g.id)::int as gens from vehicle_make mk
    left join vehicle_model m on m.make_id = mk.id left join vehicle_generation g on g.model_id = m.id
    group by mk.id order by mk.type, mk.name`);
  return (
    <div className="space-y-6">
      <NewMakeForm />
      {(["auto", "motorrad"] as const).map((t) => (
        <section key={t}>
          <h2 className="font-display mb-3 text-xl uppercase">{t === "auto" ? "Autos" : "Motorräder"}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {rows
              .filter((r) => r.type === t)
              .map((r) => (
                <Link key={r.id} href={`/admin/fahrzeuge/${r.id}`} className="card p-3 text-sm hover:border-gold">
                  <span className="font-semibold">{r.name}</span>
                  <span className="block text-xs text-faint">{r.gens} Baureihen</span>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
