"use client";
import { clsx } from "clsx";
import { Bike, Car, Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CAR_DIAMETERS, COMMON_PCDS, CONDITIONS, MATERIALS, MOTO_DIAMETERS, SEASONS } from "@/lib/constants";
import { PlzInput } from "./plz-input";

type Props = { hasVehicle: boolean; vehicleType?: "auto" | "motorrad" };

/** Parameter, die keine Filter sind (Darstellung, Fahrzeug, Seite) */
const NON_FILTER_KEYS = ["seite", "sort", "fahrzeug", "modus", "ansicht"];
/** Beim Zurücksetzen bleiben Fahrzeug, Modus, Sortierung und Ansicht erhalten */
const KEEP_ON_RESET = ["fahrzeug", "modus", "sort", "ansicht"];
/** Freitext-Felder (werden erst mit „Filter anwenden“ übernommen) */
const TEXT_KEYS = ["q", "breite_min", "breite_max", "et_min", "et_max", "preis_min", "preis_max", "umkreis", "plz"];

function useActiveCount() {
  const sp = useSearchParams();
  return [...sp.keys()].filter((k) => !NON_FILTER_KEYS.includes(k) && k !== "land").length;
}

export function FilterSidebar(props: Props) {
  return (
    <div className="overflow-clip rounded-2xl border border-line bg-surface">
      <FilterForm {...props} variant="sidebar" />
    </div>
  );
}

export function MobileFilterButton({ hasVehicle, vehicleType }: Props) {
  const [open, setOpen] = useState(false);
  const active = useActiveCount();
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    // Nach dem Schließen den Fokus zurück auf den Filter-Knopf setzen
    if (!open && wasOpen.current) trigger.current?.focus();
    wasOpen.current = open;
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="btn btn-outline btn-sm h-10 shrink-0 gap-1.5 rounded-full px-3.5 lg:hidden"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={active > 0 ? `Filter (${active} aktiv)` : "Filter"}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filter
        {active > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-fill px-1 text-[0.6875rem] font-bold text-on-brand" aria-hidden>
            {active}
          </span>
        )}
      </button>
      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filter">
          <div className="animate-fade-in absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div
            className="absolute inset-y-0 right-0 flex w-[min(92vw,24rem)] flex-col bg-surface shadow-2xl"
            style={{ animation: "slide-in-right .35s cubic-bezier(.2,.8,.2,1)" }}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="flex items-center gap-2 font-display text-lg uppercase">
                <SlidersHorizontal className="h-4 w-4 text-brand" />
                Filter
              </span>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Schließen" autoFocus>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FilterForm hasVehicle={hasVehicle} vehicleType={vehicleType} variant="drawer" onApplied={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterForm({ hasVehicle, vehicleType, variant, onApplied }: Props & { variant: "sidebar" | "drawer"; onApplied?: () => void }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const plzParam = sp.get("plz") ?? "";
  const [plz, setPlz] = useState(plzParam);
  const [land, setLand] = useState(sp.get("land") ?? "");
  const [dirty, setDirty] = useState(false);
  const active = useActiveCount();
  // Freitext-Felder sind unkontrolliert: bei geänderten URL-Werten neu aufbauen
  const textKey = TEXT_KEYS.map((k) => sp.get(k) ?? "").join("|");
  const [syncedKey, setSyncedKey] = useState(textKey);
  // URL geändert (angewendet, zurückgesetzt oder Filter-Kennzeichen entfernt) → Zustand nachziehen
  if (textKey !== syncedKey) {
    setSyncedKey(textKey);
    setPlz(plzParam);
    setLand(sp.get("land") ?? "");
    setDirty(false);
  }

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

  const reset = () => {
    const keep = new URLSearchParams();
    for (const k of KEEP_ON_RESET) if (sp.get(k)) keep.set(k, sp.get(k)!);
    setPlz("");
    setLand("");
    start(() => router.push(`${pathname}?${keep.toString()}`, { scroll: false }));
    onApplied?.();
  };

  const diameters =
    typ === "motorrad" ? MOTO_DIAMETERS : typ === "auto" ? CAR_DIAMETERS : [...new Set([...CAR_DIAMETERS, ...MOTO_DIAMETERS])].sort((a, b) => a - b);

  const pad = variant === "sidebar" ? "px-5" : "px-4";
  const field = "input h-10 py-0";

  return (
    <form
      className={clsx("transition-opacity", pending && "opacity-60")}
      aria-busy={pending}
      onInput={(e) => {
        const t = e.target as HTMLElement;
        if (t instanceof HTMLInputElement && t.type === "checkbox") return;
        setDirty(true);
      }}
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
      {variant === "sidebar" && (
        <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 font-display text-base uppercase tracking-wide">
            <SlidersHorizontal className="h-4 w-4 text-brand" aria-hidden />
            Filter
            {active > 0 && <span className="badge badge-brand font-sans tracking-normal">{active}</span>}
          </h2>
          {active > 0 && (
            <button type="button" onClick={reset} className="text-sm font-semibold text-brand hover:underline hover:underline-offset-2">
              Zurücksetzen
            </button>
          )}
        </div>
      )}

      <div className="divide-y divide-line">
        <Section title="Suchbegriff" pad={pad}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden />
            <input key={textKey} name="q" aria-label="Suchbegriff" className={clsx(field, "pl-9")} defaultValue={sp.get("q") ?? ""} placeholder="z. B. BBS, AMG, Winter …" />
          </div>
        </Section>

        {!hasVehicle && (
          <Section title="Fahrzeug" pad={pad}>
            <div className="grid grid-cols-2 gap-2">
              {(["auto", "motorrad"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  className="chip h-9 justify-center font-medium"
                  data-active={typ === t}
                  aria-pressed={typ === t}
                  onClick={() => update({ typ: typ === t ? null : t, lk: null, zoll: null })}
                >
                  {t === "auto" ? <Car className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                  {t === "auto" ? "Auto" : "Motorrad"}
                </button>
              ))}
            </div>
          </Section>
        )}

        <Section title="Art" pad={pad}>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["felge", "Nur Felgen"],
              ["komplettrad", "Kompletträder"],
            ].map(([v, l]) => (
              <button
                type="button"
                key={v}
                className="chip h-9 justify-center px-2 font-medium"
                data-active={sp.get("art") === v}
                aria-pressed={sp.get("art") === v}
                onClick={() => update({ art: sp.get("art") === v ? null : v })}
              >
                {l}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Zollgröße" pad={pad}>
          <div className="grid grid-cols-5 gap-1.5">
            {diameters.map((d) => (
              <button
                type="button"
                key={d}
                className="chip h-9 justify-center px-0 font-medium tabular-nums"
                data-active={list("zoll").includes(String(d))}
                aria-pressed={list("zoll").includes(String(d))}
                aria-label={`${d} Zoll`}
                onClick={() => toggleList("zoll", String(d))}
              >
                {d}″
              </button>
            ))}
          </div>
        </Section>

        {typ !== "motorrad" && !hasVehicle && (
          <Section title="Lochkreis" pad={pad}>
            <select aria-label="Lochkreis" className="select h-10 py-0" value={sp.get("lk") ?? ""} onChange={(e) => update({ lk: e.target.value || null })}>
              <option value="">Alle Lochkreise</option>
              {COMMON_PCDS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Section>
        )}

        <Section title="Breite (J)" pad={pad}>
          <Range key={textKey} field={field} names={["breite_min", "breite_max"]} label="Breite" inputMode="decimal" sp={sp} />
        </Section>

        {typ !== "motorrad" && (
          <Section title="Einpresstiefe (ET)" pad={pad}>
            <Range key={textKey} field={field} names={["et_min", "et_max"]} label="Einpresstiefe" inputMode="numeric" sp={sp} />
          </Section>
        )}

        <Section title="Preis (€)" pad={pad}>
          <Range key={textKey} field={field} names={["preis_min", "preis_max"]} label="Preis" inputMode="numeric" sp={sp} />
        </Section>

        <Section title="Standort" pad={pad}>
          <div className="[&_input]:h-10 [&_input]:py-0">
            <PlzInput
              key={textKey}
              value={plz}
              onChange={(v, c) => {
                setPlz(v);
                if (c) setLand(c);
              }}
            />
          </div>
          <select key={textKey} name="umkreis" aria-label="Umkreis" className="select mt-2 h-10 py-0" defaultValue={sp.get("umkreis") ?? ""}>
            <option value="">Umkreis: überall</option>
            {[10, 25, 50, 100, 200, 500].map((k) => (
              <option key={k} value={k}>
                bis {k} km
              </option>
            ))}
          </select>
          <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[var(--brand-fill)]"
              checked={sp.get("versand") === "1"}
              onChange={(e) => update({ versand: e.target.checked ? "1" : null })}
            />
            Nur mit Versand
          </label>
        </Section>

        <ChipSection title="Saison" pad={pad} options={SEASONS} selected={list("saison")} onToggle={(v) => toggleList("saison", v)} />
        <ChipSection title="Zustand" pad={pad} options={CONDITIONS} selected={list("zustand")} onToggle={(v) => toggleList("zustand", v)} />
        <ChipSection title="Material" pad={pad} options={MATERIALS} selected={list("material")} onToggle={(v) => toggleList("material", v)} />

        <Section title="Anbieter" pad={pad}>
          <div className="grid grid-cols-2 gap-2">
            {[
              ["privat", "Privat"],
              ["haendler", "Händler"],
            ].map(([v, l]) => (
              <button
                type="button"
                key={v}
                className="chip h-9 justify-center font-medium"
                data-active={sp.get("anbieter") === v}
                aria-pressed={sp.get("anbieter") === v}
                onClick={() => update({ anbieter: sp.get("anbieter") === v ? null : v })}
              >
                {l}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Am Desktop klebt die Leiste erst, wenn Eingaben noch nicht übernommen sind */}
      <div className={clsx("bottom-0 z-10 flex gap-2 border-t border-line bg-surface py-4", pad, (variant === "drawer" || dirty) && "sticky", variant === "drawer" && "pb-[calc(1rem+env(safe-area-inset-bottom))]")}>
        <button className="btn btn-brand flex-1" disabled={pending}>
          Filter anwenden
        </button>
        {variant === "drawer" && (
          <button type="button" className="btn btn-ghost" onClick={reset}>
            Zurücksetzen
          </button>
        )}
      </div>
    </form>
  );
}

function Range({
  field,
  names,
  label,
  inputMode,
  sp,
}: {
  field: string;
  names: [string, string];
  label: string;
  inputMode: "decimal" | "numeric";
  sp: URLSearchParams | ReturnType<typeof useSearchParams>;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <input name={names[0]} aria-label={`${label} von`} className={field} inputMode={inputMode} placeholder="von" defaultValue={sp.get(names[0]) ?? ""} />
      <span className="text-faint" aria-hidden>
        –
      </span>
      <input name={names[1]} aria-label={`${label} bis`} className={field} inputMode={inputMode} placeholder="bis" defaultValue={sp.get(names[1]) ?? ""} />
    </div>
  );
}

function ChipSection({
  title,
  pad,
  options,
  selected,
  onToggle,
}: {
  title: string;
  pad: string;
  options: Record<string, string>;
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <Section title={title} pad={pad}>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(options).map(([v, l]) => (
          <button
            type="button"
            key={v}
            className="chip h-9 px-3.5 text-sm font-medium"
            data-active={selected.includes(v)}
            aria-pressed={selected.includes(v)}
            onClick={() => onToggle(v)}
          >
            {l}
          </button>
        ))}
      </div>
    </Section>
  );
}

function Section({ title, pad, children }: { title: string; pad: string; children: React.ReactNode }) {
  return (
    <div className={clsx(pad, "py-4")}>
      <fieldset>
        <legend className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted">{title}</legend>
        {children}
      </fieldset>
    </div>
  );
}
