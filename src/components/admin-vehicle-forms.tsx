"use client";
import { ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminCreateMake, adminCreateModel, adminDeleteGeneration, adminImportHsnTsn, adminSaveGeneration, type GenerationInput } from "@/app/actions/admin";
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
      <button className="btn btn-gold" disabled={pending}>
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
        <span className={isNew ? "text-gold" : "font-medium"}>
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
            <button className="btn btn-gold btn-sm" disabled={pending}>
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
      <button className="btn btn-gold" disabled={pending || !csv.trim()}>
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
