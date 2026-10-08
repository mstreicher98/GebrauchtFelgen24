"use client";
import { clsx } from "clsx";
import { Bike, Car, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CAR_DIAMETERS, COMMON_PCDS, CONDITIONS, MATERIALS, MOTO_DIAMETERS, SEASONS } from "@/lib/constants";
import { PlzInput } from "./plz-input";

type Props = { hasVehicle: boolean; vehicleType?: "auto" | "motorrad" };

export function FilterSidebar(props: Props) {
  return <FilterForm {...props} />;
}

export function MobileFilterButton({ hasVehicle, vehicleType }: Props) {
  const [open, setOpen] = useState(false);
  const sp = useSearchParams();
  const active = [...sp.keys()].filter((k) => !["seite", "sort", "fahrzeug", "modus"].includes(k)).length;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button type="button" className="btn btn-outline btn-sm lg:hidden" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Filter{active > 0 && <span className="badge badge-gold">{active}</span>}
      </button>
      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filter">
          <div className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(92vw,24rem)] flex-col bg-bg shadow-2xl" style={{ animation: "slide-in-right .35s cubic-bezier(.2,.8,.2,1)" }}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-display text-lg uppercase">Filter</span>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Schließen">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterForm hasVehicle={hasVehicle} vehicleType={vehicleType} onApplied={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterForm({ hasVehicle, vehicleType, onApplied }: Props & { onApplied?: () => void }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const [plz, setPlz] = useState(sp.get("plz") ?? "");
  const [land, setLand] = useState(sp.get("land") ?? "");
  const [plzKey, setPlzKey] = useState(0);

  const typ = (vehicleType ?? sp.get("typ") ?? "") as "" | "auto" | "motorrad";
  const list = (k: string) => (sp.get(k) ?? "").split(",").filter(Boolean);

  const update = (patch: Record<string, string | null>, close = false) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    }
    p.delete("seite");
    start(() => router.push(`${pathname}?${p.toString()}`, { scroll: false }));
    if (close) onApplied?.();
  };

  const toggleList = (k: string, v: string) => {
    const cur = list(k);
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    update({ [k]: next.join(",") || null });
  };

  const diameters = typ === "motorrad" ? MOTO_DIAMETERS : typ === "auto" ? CAR_DIAMETERS : [...new Set([...CAR_DIAMETERS, ...MOTO_DIAMETERS])].sort((a, b) => a - b);

  return (
    <form
      className={clsx("space-y-6 transition-opacity", pending && "opacity-60")}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const patch: Record<string, string | null> = {};
        for (const k of ["q", "preis_min", "preis_max", "breite_min", "breite_max", "et_min", "et_max", "umkreis"]) {
          patch[k] = String(fd.get(k) ?? "").trim() || null;
        }
        patch.plz = plz.trim() || null;
        patch.land = plz.trim() ? land || null : null;
        update(patch, true);
      }}
    >
      <Section title="Suchbegriff">
        <input name="q" className="input" defaultValue={sp.get("q") ?? ""} placeholder="z. B. BBS, AMG, Winter …" />
      </Section>

      {!hasVehicle && (
        <Section title="Fahrzeug">
          <div className="grid grid-cols-2 gap-2">
            {(["auto", "motorrad"] as const).map((t) => (
              <button
                type="button"
                key={t}
                className="chip justify-center"
                data-active={typ === t}
                onClick={() => update({ typ: typ === t ? null : t, lk: null, zoll: null })}
              >
                {t === "auto" ? <Car className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                {t === "auto" ? "Auto" : "Motorrad"}
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title="Art">
        <div className="grid grid-cols-2 gap-2">
          {[
            ["felge", "Nur Felgen"],
            ["komplettrad", "Kompletträder"],
          ].map(([v, l]) => (
            <button type="button" key={v} className="chip justify-center" data-active={sp.get("art") === v} onClick={() => update({ art: sp.get("art") === v ? null : v })}>
              {l}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Zollgröße">
        <div className="flex flex-wrap gap-1.5">
          {diameters.map((d) => (
            <button type="button" key={d} className="chip px-3" data-active={list("zoll").includes(String(d))} onClick={() => toggleList("zoll", String(d))}>
              {d}&quot;
            </button>
          ))}
        </div>
      </Section>

      {typ !== "motorrad" && !hasVehicle && (
        <Section title="Lochkreis">
          <select className="select" value={sp.get("lk") ?? ""} onChange={(e) => update({ lk: e.target.value || null })}>
            <option value="">Alle</option>
            {COMMON_PCDS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Section>
      )}

      <Section title="Breite (J)">
        <div className="grid grid-cols-2 gap-2">
          <input name="breite_min" className="input" inputMode="decimal" placeholder="von" defaultValue={sp.get("breite_min") ?? ""} />
          <input name="breite_max" className="input" inputMode="decimal" placeholder="bis" defaultValue={sp.get("breite_max") ?? ""} />
        </div>
      </Section>

      {typ !== "motorrad" && (
        <Section title="Einpresstiefe (ET)">
          <div className="grid grid-cols-2 gap-2">
            <input name="et_min" className="input" inputMode="numeric" placeholder="von" defaultValue={sp.get("et_min") ?? ""} />
            <input name="et_max" className="input" inputMode="numeric" placeholder="bis" defaultValue={sp.get("et_max") ?? ""} />
          </div>
        </Section>
      )}

      <Section title="Preis (€)">
        <div className="grid grid-cols-2 gap-2">
          <input name="preis_min" className="input" inputMode="numeric" placeholder="von" defaultValue={sp.get("preis_min") ?? ""} />
          <input name="preis_max" className="input" inputMode="numeric" placeholder="bis" defaultValue={sp.get("preis_max") ?? ""} />
        </div>
      </Section>

      <Section title="Standort">
        <PlzInput
          key={plzKey}
          value={plz}
          onChange={(v, c) => {
            setPlz(v);
            if (c) setLand(c);
          }}
        />
        <select name="umkreis" className="select mt-2" defaultValue={sp.get("umkreis") ?? ""}>
          <option value="">Umkreis: überall</option>
          {[10, 25, 50, 100, 200, 500].map((k) => (
            <option key={k} value={k}>
              bis {k} km
            </option>
          ))}
        </select>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-muted">
          <input type="checkbox" className="h-4 w-4 accent-[var(--gold)]" checked={sp.get("versand") === "1"} onChange={(e) => update({ versand: e.target.checked ? "1" : null })} />
          Nur mit Versand
        </label>
      </Section>

      <Section title="Saison (Kompletträder)">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(SEASONS).map(([v, l]) => (
            <button type="button" key={v} className="chip" data-active={list("saison").includes(v)} onClick={() => toggleList("saison", v)}>
              {l}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Zustand">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(CONDITIONS).map(([v, l]) => (
            <button type="button" key={v} className="chip" data-active={list("zustand").includes(v)} onClick={() => toggleList("zustand", v)}>
              {l}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Material">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(MATERIALS).map(([v, l]) => (
            <button type="button" key={v} className="chip" data-active={list("material").includes(v)} onClick={() => toggleList("material", v)}>
              {l}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Anbieter">
        <div className="grid grid-cols-2 gap-2">
          {[
            ["privat", "Privat"],
            ["haendler", "Händler"],
          ].map(([v, l]) => (
            <button type="button" key={v} className="chip justify-center" data-active={sp.get("anbieter") === v} onClick={() => update({ anbieter: sp.get("anbieter") === v ? null : v })}>
              {l}
            </button>
          ))}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-1 flex gap-2 bg-gradient-to-t from-bg via-bg to-transparent px-1 pb-1 pt-4">
        <button className="btn btn-gold flex-1" disabled={pending}>
          Filter anwenden
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            const keep = new URLSearchParams();
            for (const k of ["fahrzeug", "modus"]) if (sp.get(k)) keep.set(k, sp.get(k)!);
            setPlz("");
            setPlzKey((k) => k + 1);
            start(() => router.push(`${pathname}?${keep.toString()}`, { scroll: false }));
            onApplied?.();
          }}
        >
          Zurücksetzen
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-faint">{title}</legend>
      {children}
    </fieldset>
  );
}
