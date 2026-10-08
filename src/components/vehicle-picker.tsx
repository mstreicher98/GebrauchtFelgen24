"use client";
import { clsx } from "clsx";
import { useEffect, useState } from "react";

type Opt = { id: number; name: string };

const cache = new Map<string, Promise<Opt[]>>();
function load(url: string): Promise<Opt[]> {
  if (!cache.has(url)) {
    cache.set(
      url,
      fetch(url)
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => {
          cache.delete(url);
          return [];
        }),
    );
  }
  return cache.get(url)!;
}

export type PickedVehicle = { generationId: number; label: string } | null;

/**
 * Kaskadierende Auswahl Marke → Modell → Generation.
 * `onPick` wird mit der Generation (oder null) aufgerufen.
 */
export function VehiclePicker({
  type,
  onPick,
  className,
  size = "md",
  idPrefix = "vp",
}: {
  type: "auto" | "motorrad";
  onPick: (v: PickedVehicle) => void;
  className?: string;
  size?: "md" | "lg";
  idPrefix?: string;
}) {
  const [makes, setMakes] = useState<Opt[]>([]);
  const [models, setModels] = useState<Opt[]>([]);
  const [gens, setGens] = useState<Opt[]>([]);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [gen, setGen] = useState("");

  useEffect(() => {
    let alive = true;
    void load(`/api/fahrzeuge?typ=${type}`).then((m) => alive && setMakes(m));
    /* eslint-disable react-hooks/set-state-in-effect -- Auswahl beim Typwechsel zurücksetzen */
    setMake("");
    setModel("");
    setGen("");
    setModels([]);
    setGens([]);
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      alive = false;
    };
  }, [type]);

  const cls = clsx("select", size === "lg" && "py-3.5 text-base");

  return (
    <div className={clsx("grid gap-3 sm:grid-cols-3", className)}>
      <div>
        <label htmlFor={`${idPrefix}-make`} className="sr-only">
          Marke
        </label>
        <select
          id={`${idPrefix}-make`}
          className={cls}
          value={make}
          onChange={async (e) => {
            const v = e.target.value;
            setMake(v);
            setModel("");
            setGen("");
            setGens([]);
            onPick(null);
            setModels(v ? await load(`/api/fahrzeuge?marke=${v}`) : []);
          }}
        >
          <option value="">Marke wählen</option>
          {makes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-model`} className="sr-only">
          Modell
        </label>
        <select
          id={`${idPrefix}-model`}
          className={cls}
          value={model}
          disabled={!make}
          onChange={async (e) => {
            const v = e.target.value;
            setModel(v);
            setGen("");
            onPick(null);
            const g = v ? await load(`/api/fahrzeuge?modell=${v}`) : [];
            setGens(g);
            if (g.length === 1) {
              setGen(String(g[0].id));
              onPick({ generationId: g[0].id, label: label(makes, make, models, v, g[0]) });
            }
          }}
        >
          <option value="">Modell wählen</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-gen`} className="sr-only">
          Baureihe / Baujahr
        </label>
        <select
          id={`${idPrefix}-gen`}
          className={cls}
          value={gen}
          disabled={!model}
          onChange={(e) => {
            const v = e.target.value;
            setGen(v);
            const g = gens.find((x) => String(x.id) === v);
            onPick(g ? { generationId: g.id, label: label(makes, make, models, model, g) } : null);
          }}
        >
          <option value="">Baureihe / Baujahr</option>
          {gens.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function label(makes: Opt[], make: string, models: Opt[], model: string, gen: Opt) {
  const mk = makes.find((m) => String(m.id) === make)?.name ?? "";
  const md = models.find((m) => String(m.id) === model)?.name ?? "";
  const g = gen.name.toLowerCase().startsWith(md.toLowerCase()) ? gen.name : `${md} ${gen.name}`;
  return `${mk} ${g}`.trim();
}
