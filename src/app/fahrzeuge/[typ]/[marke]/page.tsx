import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { ArrowRight, Bike, Car, ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { vehicleGeneration, vehicleMake, vehicleModel, vehicleWheelSpec } from "@/db/schema";
import { formatNumber, formatPcd, yearRange } from "@/lib/format";
import { generationLabel } from "@/lib/vehicles";

const getMake = cache(async (typ: string, slug: string) => {
  if (typ !== "auto" && typ !== "motorrad") return null;
  const [mk] = await db
    .select()
    .from(vehicleMake)
    .where(and(eq(vehicleMake.type, typ), eq(vehicleMake.slug, slug)))
    .limit(1);
  return mk ?? null;
});

export async function generateMetadata(props: PageProps<"/fahrzeuge/[typ]/[marke]">): Promise<Metadata> {
  const { typ, marke } = await props.params;
  const mk = await getMake(typ, marke);
  if (!mk) return { title: "Nicht gefunden" };
  return {
    title: `${mk.name} Felgen: Lochkreis, ET & Reifengrößen`,
    description: `Felgendaten für alle ${mk.name} Modelle: Lochkreis, Mittenloch, Einpresstiefe und Serien-Rad-/Reifengrößen – mit passenden gebrauchten Felgen.`,
  };
}

export default async function MakePage(props: PageProps<"/fahrzeuge/[typ]/[marke]">) {
  const { typ, marke } = await props.params;
  const mk = await getMake(typ, marke);
  if (!mk) notFound();
  const models = await db.select().from(vehicleModel).where(eq(vehicleModel.makeId, mk.id)).orderBy(asc(vehicleModel.name));
  const gens = models.length
    ? await db
        .select()
        .from(vehicleGeneration)
        .where(inArray(vehicleGeneration.modelId, models.map((m) => m.id)))
        .orderBy(asc(vehicleGeneration.yearFrom))
    : [];
  const specs = gens.length
    ? await db
        .select()
        .from(vehicleWheelSpec)
        .where(inArray(vehicleWheelSpec.generationId, gens.map((g) => g.id)))
        .orderBy(asc(vehicleWheelSpec.diameter), asc(vehicleWheelSpec.id))
    : [];
  const counts = gens.length
    ? await db.execute<{ generation_id: number; n: number }>(sql`
        select lf.generation_id, count(*)::int as n from listing_fitment lf join listing l on l.id = lf.listing_id
        where l.status = 'aktiv' group by lf.generation_id`)
    : [];
  const countMap = new Map(counts.map((c) => [c.generation_id, c.n]));
  const isCar = mk.type === "auto";

  return (
    <div className="container-page py-10">
      <Link href="/fahrzeuge" className="inline-flex items-center gap-1 text-sm text-muted hover:text-gold">
        <ChevronLeft className="h-4 w-4" /> Alle Marken
      </Link>
      <h1 className="font-display mt-3 flex items-center gap-3 text-4xl font-bold uppercase sm:text-5xl">
        <span className="text-gold">{isCar ? <Car className="h-9 w-9" /> : <Bike className="h-9 w-9" />}</span>
        {mk.name}
      </h1>
      <p className="mt-2 text-muted">
        {models.length} Modelle · {gens.length} Baureihen
      </p>

      {/* Sprungmarken */}
      <nav className="scrollbar-none sticky top-16 z-20 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-bg/85 px-4 py-3 backdrop-blur" aria-label="Modelle">
        {models.map((m) => (
          <a key={m.id} href={`#${m.slug}`} className="chip shrink-0">
            {m.name}
          </a>
        ))}
      </nav>

      <div className="mt-6 space-y-10">
        {models.map((m) => (
          <section key={m.id} id={m.slug} className="scroll-mt-32">
            <h2 className="font-display mb-4 text-2xl font-bold uppercase">
              {mk.name} {m.name}
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {gens
                .filter((g) => g.modelId === m.id)
                .map((g) => {
                  const gs = specs.filter((s) => s.generationId === g.id);
                  const n = countMap.get(g.id) ?? 0;
                  return (
                    <article key={g.id} className="card reveal overflow-hidden">
                      <div className="flex items-start justify-between gap-3 border-b border-line p-4">
                        <div>
                          <h3 className="font-semibold">{generationLabel(m.name, g.name)}</h3>
                          <p className="text-sm text-muted">{yearRange(g.yearFrom, g.yearTo)}</p>
                        </div>
                        <Link href={`/suche?fahrzeug=${g.id}`} className="btn btn-gold btn-sm group shrink-0">
                          Felgen{n > 0 ? ` (${n})` : ""}
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </div>
                      {isCar && (
                        <dl className="grid grid-cols-2 gap-px bg-line text-sm sm:grid-cols-4">
                          {[
                            ["Lochkreis", formatPcd(g.boltCount, g.boltCircle)],
                            ["Mittenloch", g.centerBore ? `${formatNumber(g.centerBore)} mm` : "–"],
                            ["ET-Bereich", g.etMin != null ? `${g.etMin}–${g.etMax}` : "–"],
                            ["Befestigung", g.thread ? `${g.thread} ${g.fastener ?? ""}` : "–"],
                          ].map(([k, v]) => (
                            <div key={k} className="bg-surface px-4 py-2.5">
                              <dt className="text-xs text-faint">{k}</dt>
                              <dd className="font-medium">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase tracking-wider text-faint">
                              {!isCar || gs.some((s) => s.position !== "alle") ? <th className="px-4 py-2 font-medium">Achse</th> : null}
                              <th className="px-4 py-2 font-medium">Felge</th>
                              {isCar && <th className="px-4 py-2 font-medium">ET</th>}
                              <th className="px-4 py-2 font-medium">Reifen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gs.map((s) => (
                              <tr key={s.id} className="border-t border-line/60">
                                {!isCar || gs.some((x) => x.position !== "alle") ? (
                                  <td className="px-4 py-2 text-muted">{s.position === "vorne" ? "Vorne" : s.position === "hinten" ? "Hinten" : "V+H"}</td>
                                ) : null}
                                <td className="px-4 py-2 font-medium">
                                  {s.width ? `${formatNumber(s.width)}${isCar ? "J" : ""}x${formatNumber(s.diameter)}` : `${formatNumber(s.diameter)} Zoll`}
                                </td>
                                {isCar && <td className="px-4 py-2 text-muted">{s.et ?? "–"}</td>}
                                <td className="px-4 py-2">{s.tireSize ?? "–"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {g.notes && <p className="border-t border-line px-4 py-2.5 text-xs text-muted">ℹ️ {g.notes}</p>}
                    </article>
                  );
                })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
