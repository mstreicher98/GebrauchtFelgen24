import { sql } from "drizzle-orm";
import { Bike, Car, Database } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { MakeFilter } from "@/components/make-filter";

export const metadata: Metadata = {
  title: "Fahrzeug-Datenbank: Lochkreis, Einpresstiefe & Reifengrößen",
  description: "Felgen- und Reifendaten für Autos und Motorräder: Lochkreis, Mittenloch, Einpresstiefe, Gewinde und Serien-Radgrößen.",
};

export default async function VehiclesPage() {
  const rows = await db.execute<{ id: number; type: "auto" | "motorrad"; name: string; slug: string; models: number; gens: number }>(sql`
    select mk.id, mk.type, mk.name, mk.slug, count(distinct m.id)::int as models, count(g.id)::int as gens
    from vehicle_make mk left join vehicle_model m on m.make_id = mk.id left join vehicle_generation g on g.model_id = m.id
    group by mk.id order by mk.name`);
  const cars = rows.filter((r) => r.type === "auto");
  const motos = rows.filter((r) => r.type === "motorrad");
  const total = rows.reduce((s, r) => s + r.gens, 0);

  return (
    <div className="container-page py-10">
      <div className="max-w-3xl">
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gold">
          <Database className="h-4 w-4" /> Fahrzeug-Datenbank
        </p>
        <h1 className="font-display mt-2 text-4xl font-bold uppercase sm:text-5xl">Welche Felge passt?</h1>
        <p className="mt-3 text-muted">
          {total} Modelle und Baureihen von {rows.length} Marken mit Lochkreis, Mittenloch, Einpresstiefe, Befestigung und Serien-Rad-/Reifengrößen. Klicke dich
          zu deinem Fahrzeug und lass dir direkt passende Felgen anzeigen.
        </p>
        <p className="mt-2 text-xs text-faint">Alle Angaben ohne Gewähr. Maßgeblich sind Fahrzeugschein/COC und Felgengutachten.</p>
      </div>
      <MakeFilter>
        <Section title="Autos" icon={<Car className="h-5 w-5" />} items={cars} />
        <Section title="Motorräder" icon={<Bike className="h-5 w-5" />} items={motos} />
      </MakeFilter>
    </div>
  );
}

function Section({ title, icon, items }: { title: string; icon: React.ReactNode; items: { id: number; type: string; name: string; slug: string; models: number; gens: number }[] }) {
  return (
    <section className="mt-10">
      <h2 className="font-display mb-4 flex items-center gap-2 text-2xl font-bold uppercase">
        <span className="text-gold">{icon}</span> {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((m, i) => (
          <Link
            key={m.id}
            href={`/fahrzeuge/${m.type}/${m.slug}`}
            data-make={m.name.toLowerCase()}
            className="card reveal group p-4 transition-all hover:-translate-y-0.5 hover:border-gold"
            style={{ ["--reveal-delay" as string]: `${(i % 5) * 40}ms` }}
          >
            <p className="font-semibold group-hover:text-gold">{m.name}</p>
            <p className="mt-0.5 text-xs text-faint">
              {m.models} Modelle · {m.gens} Baureihen
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
