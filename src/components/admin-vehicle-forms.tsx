"use client";
import { ChevronDown, Download, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminCreateMake, adminCreateModel, adminDeleteGeneration, adminImportHsnTsn, adminImportVehicles, adminSaveGeneration, type GenerationInput } from "@/app/actions/admin";
import { toast } from "./toaster";

export function NewMakeForm() {
  const [name, setName] = useState("");
  const [type, setType] = useState<"auto" | "motorrad">("auto");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="card flex flex-wrap items-end gap-2 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await adminCreateMake(type, name);
          if (r.error) toast(r.error, "error");
          else {
            setName("");
            toast("Marke angelegt");
            router.refresh();
          }
        });
      }}
    >
      <div>
        <label className="label">Neue Marke</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Lynk & Co" required />
      </div>
      <select className="select w-auto" value={type} onChange={(e) => setType(e.target.value as "auto" | "motorrad")}>
        <option value="auto">Auto</option>
        <option value="motorrad">Motorrad</option>
      </select>
      <button className="btn btn-brand" disabled={pending}>
        <Plus className="h-4 w-4" /> Anlegen
      </button>
    </form>
  );
}

export function NewModelForm({ makeId }: { makeId: number }) {
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await adminCreateModel(makeId, name);
          setName("");
          router.refresh();
        });
      }}
    >
      <input className="input max-w-xs" value={name} onChange={(e) => setName(e.target.value)} placeholder="Neues Modell, z. B. Golf" required />
      <button className="btn btn-outline" disabled={pending}>
        <Plus className="h-4 w-4" /> Modell
      </button>
    </form>
  );
}

export function GenerationEditor({ makeId, vehicleType, initial }: { makeId: number; vehicleType: "auto" | "motorrad"; initial: GenerationInput }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const isNew = !initial.id;
  const set = (k: keyof GenerationInput, val: string) => setV((s) => ({ ...s, [k]: val }));
  const f = (k: keyof GenerationInput, label: string, ph = "") => (
    <div>
      <label className="label">{label}</label>
      <input className="input py-2 text-sm" value={String(v[k] ?? "")} onChange={(e) => set(k, e.target.value)} placeholder={ph} />
    </div>
  );

  return (
    <div className="rounded-xl border border-line">
      <button type="button" className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm" onClick={() => setOpen((o) => !o)}>
        <span className={isNew ? "text-brand" : "font-medium"}>
          {isNew ? "+ Neue Baureihe" : `${initial.name} (${initial.yearFrom || "?"}–${initial.yearTo || "heute"}) · ${initial.pcd || "–"}`}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <form
          className="animate-fade-in grid gap-3 border-t border-line p-3 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await adminSaveGeneration(makeId, v);
              if (r.error) toast(r.error, "error");
              else {
                toast("Gespeichert");
                if (isNew) setV(initial);
                setOpen(false);
                router.refresh();
              }
            });
          }}
        >
          {f("name", "Name", "z. B. Golf VIII (CD)")}
          {f("yearFrom", "Baujahr von")}
          {f("yearTo", "bis (leer = aktuell)")}
          {vehicleType === "auto" && f("pcd", "Lochkreis", "5x112")}
          {vehicleType === "auto" && (
            <>
              {f("centerBore", "Mittenloch (mm)", "57.1")}
              {f("thread", "Gewinde", "M14x1,5")}
              {f("fastener", "Befestigung", "Schraube")}
              {f("etMin", "ET min")}
              {f("etMax", "ET max")}
            </>
          )}
          <div className="sm:col-span-4">
            <label className="label">Radgrößen (eine pro Zeile)</label>
            <textarea className="textarea min-h-28 font-mono text-sm" value={v.specs} onChange={(e) => set("specs", e.target.value)} />
          </div>
          <div className="sm:col-span-4">{f("notes", "Hinweis (optional)")}</div>
          <div className="flex gap-2 sm:col-span-4">
            <button className="btn btn-brand btn-sm" disabled={pending}>
              Speichern
            </button>
            {!isNew && (
              <button
                type="button"
                className="btn btn-ghost btn-sm text-red"
                onClick={() => {
                  if (!confirm("Baureihe löschen?")) return;
                  start(async () => {
                    await adminDeleteGeneration(makeId, initial.id!);
                    router.refresh();
                  });
                }}
              >
                Löschen
              </button>
            )}
            {!isNew && <span className="ml-auto self-center text-xs text-faint">ID {initial.id} (für HSN/TSN-Import)</span>}
          </div>
        </form>
      )}
    </div>
  );
}

export function HsnImportForm() {
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="card space-y-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setResult(await adminImportHsnTsn(csv));
          router.refresh();
        });
      }}
    >
      <label className="label">CSV einfügen (HSN;TSN;Baureihen-ID;Beschreibung)</label>
      <textarea className="textarea min-h-48 font-mono text-sm" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"0603;BQR;12;VW Golf VII 1.4 TSI\n0603;AXT;12;VW Golf VII 2.0 TDI"} />
      <button className="btn btn-brand" disabled={pending || !csv.trim()}>
        Importieren
      </button>
      {result && (
        <div className="text-sm">
          <p className="text-green">{result.imported} Einträge importiert.</p>
          {result.errors.map((e) => (
            <p key={e} className="text-red">
              {e}
            </p>
          ))}
        </div>
      )}
    </form>
  );
}

type ImportResult = Awaited<ReturnType<typeof adminImportVehicles>>;

/** Liest eine CSV-Datei als UTF-8 bzw. – falls ungültig (Excel „CSV (Trennzeichen-getrennt)“) – als Windows-1252. */
async function readCsvFile(file: File) {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

/** Fahrzeugliste als CSV exportieren und (mit Vorschau) importieren. */
export function VehicleTransfer({ exportHref }: { exportHref: string }) {
  const [file, setFile] = useState<{ name: string; csv: string } | null>(null);
  const [result, setResult] = useState<(ImportResult & { applied: boolean }) | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = (csv: string, apply: boolean) =>
    start(async () => {
      try {
        const r = await adminImportVehicles(csv, apply);
        setResult({ ...r, applied: apply && !!r.summary });
        if (apply && r.summary) {
          toast("Fahrzeugliste importiert");
          setFile(null);
          router.refresh();
        }
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });

  const s = result?.summary;
  return (
    <section className="card p-5">
      <h2 className="font-display text-lg uppercase">Export & Import</h2>
      <p className="mt-1 text-sm text-muted">
        CSV-Datei für Excel (eine Zeile pro Baureihe). Zum Ergänzen exportieren, in Excel bearbeiten und wieder importieren – es wird nichts gelöscht.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["auto", "Autos"],
            ["motorrad", "Motorräder"],
            ["", "Alle"],
          ] as const
        ).map(([t, l]) => (
          <a key={l} href={`${exportHref}${t ? `?typ=${t}` : ""}`} className="btn btn-outline btn-sm" download>
            <Download className="h-4 w-4" aria-hidden="true" /> {l} exportieren
          </a>
        ))}
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <label className="label" htmlFor="vehicle-csv">
          CSV importieren
        </label>
        <input
          id="vehicle-csv"
          type="file"
          accept=".csv,text/csv,text/plain"
          className="block w-full text-sm text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-surface-2 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-fg hover:file:bg-surface-3"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            setResult(null);
            if (!f) return;
            const csv = await readCsvFile(f);
            setFile({ name: f.name, csv });
            run(csv, false);
          }}
        />
        <p className="mt-1.5 text-xs text-faint">
          Pflichtspalten: Typ (Auto/Motorrad), Marke, Modell. Weitere Spalten wie im Export; fehlende Spalten lassen vorhandene Werte unverändert. Radgrößen im
          Format <code>7.5Jx18 ET51 225/40 R18</code>, mehrere mit <code>|</code> getrennt.
        </p>

        {pending && <p className="mt-3 text-sm text-muted">Wird geprüft …</p>}

        {result && !pending && (
          <div className="mt-4 rounded-xl bg-surface-2 p-4 text-sm" role="status">
            {s ? (
              <>
                <p className="font-semibold">
                  {result.applied ? "Importiert" : "Vorschau"}
                  {file && !result.applied ? ` – ${file.name}` : ""}: {s.rows} gültige Zeilen
                </p>
                <ul className="mt-2 grid gap-1 text-muted sm:grid-cols-2">
                  <li>Neue Marken: {s.makes}</li>
                  <li>Neue Modelle: {s.models}</li>
                  <li>Neue Baureihen: {s.generationsNew}</li>
                  <li>Aktualisierte Baureihen: {s.generationsUpdated}</li>
                </ul>
              </>
            ) : (
              <p className="font-semibold text-red">Import nicht möglich</p>
            )}
            {result.errors.length > 0 && (
              <div className="mt-3">
                <p className="font-semibold text-red">{result.errors.length >= 50 ? "Mindestens 50" : result.errors.length} Zeile(n) mit Fehlern werden übersprungen:</p>
                <ul className="mt-1 max-h-48 list-disc overflow-y-auto pl-5 text-xs text-muted">
                  {result.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {s && !result.applied && file && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className="btn btn-brand btn-sm" disabled={pending} onClick={() => run(file.csv, true)}>
                  Jetzt importieren
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                  }}
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
