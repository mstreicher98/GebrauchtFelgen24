import { asc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { vehicleGeneration, vehicleMake, vehicleModel, vehicleWheelSpec } from "@/db/schema";
import { GenerationEditor, NewModelForm } from "@/components/admin-vehicle-forms";
import { adminDeleteModel } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin-buttons";
import { formatPcd } from "@/lib/format";

function specToString(s: { position: string; diameter: number; width: number | null; et: number | null; tireSize: string | null }) {
  const pos = s.position === "vorne" ? "V " : s.position === "hinten" ? "H " : "";
  const rim = s.width != null ? `${s.width}Jx${s.diameter}` : `${s.diameter}`;
  return `${pos}${rim}${s.et != null ? ` ET${s.et}` : ""}${s.tireSize ? ` ${s.tireSize}` : ""}`;
}

export default async function AdminMakePage(props: PageProps<"/admin/fahrzeuge/[makeId]">) {
  const makeId = Number((await props.params).makeId);
  const [mk] = await db.select().from(vehicleMake).where(eq(vehicleMake.id, makeId)).limit(1);
  if (!mk) notFound();
  const models = await db.select().from(vehicleModel).where(eq(vehicleModel.makeId, makeId)).orderBy(asc(vehicleModel.name));
  const gens = models.length ? await db.select().from(vehicleGeneration).where(inArray(vehicleGeneration.modelId, models.map((m) => m.id))).orderBy(asc(vehicleGeneration.yearFrom)) : [];
  const specs = gens.length ? await db.select().from(vehicleWheelSpec).where(inArray(vehicleWheelSpec.generationId, gens.map((g) => g.id))).orderBy(asc(vehicleWheelSpec.id)) : [];

  return (
    <div>
      <Link href="/admin/fahrzeuge" className="text-sm text-muted hover:text-brand">← Alle Marken</Link>
      <h2 className="font-display mt-2 text-2xl uppercase">{mk.name}</h2>
      <p className="mb-6 mt-1 text-sm text-muted">
        Radgrößen bitte eine pro Zeile im Format <code className="text-brand">7.5Jx18 ET51 225/40 R18</code>, Mischbereifung mit{" "}
        <code className="text-brand">V 8Jx19 ET27 225/40 R19 | H 8.5Jx19 ET40 255/35 R19</code>, Motorräder z. B. <code className="text-brand">V 3.50x17 120/70 ZR17</code>.
        Zoll- und Breitenbereich werden automatisch aus den Radgrößen berechnet.
      </p>
      <NewModelForm makeId={makeId} />
      <div className="mt-6 space-y-8">
        {models.map((m) => (
          <section key={m.id} className="card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{m.name}</h3>
              <ActionButton action={adminDeleteModel.bind(null, makeId, m.id)} confirmText={`Modell ${m.name} inkl. aller Baureihen löschen?`} className="btn btn-ghost btn-sm text-red">
                Modell löschen
              </ActionButton>
            </div>
            <div className="mt-3 space-y-2">
              {gens
                .filter((g) => g.modelId === m.id)
                .map((g) => (
                  <GenerationEditor
                    key={g.id}
                    makeId={makeId}
                    vehicleType={mk.type}
                    initial={{
                      id: g.id,
                      modelId: m.id,
                      name: g.name,
                      yearFrom: g.yearFrom?.toString() ?? "",
                      yearTo: g.yearTo?.toString() ?? "",
                      pcd: formatPcd(g.boltCount, g.boltCircle) ?? "",
                      centerBore: g.centerBore?.toString() ?? "",
                      thread: g.thread ?? "",
                      fastener: g.fastener ?? "",
                      etMin: g.etMin?.toString() ?? "",
                      etMax: g.etMax?.toString() ?? "",
                      specs: specs.filter((s) => s.generationId === g.id).map(specToString).join("\n"),
                      notes: g.notes ?? "",
                    }}
                  />
                ))}
              <GenerationEditor
                makeId={makeId}
                vehicleType={mk.type}
                initial={{ modelId: m.id, name: "", yearFrom: "", yearTo: "", pcd: "", centerBore: "", thread: "", fastener: "", etMin: "", etMax: "", specs: "", notes: "" }}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
