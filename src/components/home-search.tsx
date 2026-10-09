"use client";
import { clsx } from "clsx";
import { Bike, Car, CircleCheck, KeyRound, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { CAR_DIAMETERS, COMMON_PCDS, MATERIALS, MOTO_DIAMETERS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { RimMark } from "./logo";
import { PlzInput } from "./plz-input";
import { VehiclePicker, type PickedVehicle } from "./vehicle-picker";

type Tab = "felge" | "komplettrad" | "motorrad";
type Mode = "fahrzeug" | "groesse";

const TABS: { id: Tab; label: string; icon: "rim" | "car" | "bike" }[] = [
  { id: "felge", label: "Felgen", icon: "rim" },
  { id: "komplettrad", label: "Kompletträder", icon: "car" },
  { id: "motorrad", label: "Motorrad", icon: "bike" },
];

/** Ganze Zahlen mit Punkt als Tausendertrennzeichen („1.234 Angebote“) */
const count = new Intl.NumberFormat("de-DE");
const PRICES = [100, 200, 300, 500, 750, 1000, 1500, 2000, 3000];
const RADII = [10, 25, 50, 100, 200];
const CAR_MATERIALS = ["alu", "stahl", "geschmiedet", "carbon", "magnesium"] as const;
const MOTO_MATERIALS = ["alu", "geschmiedet", "speiche", "carbon", "magnesium"] as const;

/** Parameter, die jede Suchmaske anfangs hat – identisch mit dem serverseitig gezählten Startwert. */
const HOME_SEARCH_INITIAL_QUERY = "typ=auto&art=felge";

type HsnVehicle = { id: number; name: string };

/**
 * Große Suchmaske im Hero (AutoScout24-Muster): Kategorie-Tabs, Suche nach Fahrzeug oder Größe,
 * Preis, Ort + Umkreis und ein Button mit Live-Trefferzahl.
 */
export function HomeSearch({ initialTotal, className }: { initialTotal: number; className?: string }) {
  const router = useRouter();
  const uid = useId();
  const [tab, setTab] = useState<Tab>("felge");
  const [mode, setMode] = useState<Mode>("fahrzeug");
  const [picked, setPicked] = useState<PickedVehicle>(null);
  const [hsnMode, setHsnMode] = useState(false);
  const [hsn, setHsn] = useState("");
  const [tsn, setTsn] = useState("");
  const [hsnResult, setHsnResult] = useState<{ key: string; vehicle: HsnVehicle | null } | null>(null);
  const [zoll, setZoll] = useState("");
  const [lk, setLk] = useState("");
  const [pos, setPos] = useState("");
  const [material, setMaterial] = useState("");
  const [preis, setPreis] = useState("");
  const [plz, setPlz] = useState("");
  const [land, setLand] = useState<string | undefined>();
  const [umkreis, setUmkreis] = useState("");
  const [counted, setCounted] = useState<{ q: string; total: number | null }>({ q: HOME_SEARCH_INITIAL_QUERY, total: initialTotal });

  const moto = tab === "motorrad";
  const vehicleType = moto ? "motorrad" : "auto";
  const showHsn = mode === "fahrzeug" && hsnMode && !moto;
  const hsnKey = `${hsn.trim()}/${tsn.trim().toUpperCase()}`;
  const hsnComplete = /^\d{4}$/.test(hsn.trim()) && /^[A-Z0-9]{3}$/i.test(tsn.trim());
  const hsnVehicle = hsnResult?.key === hsnKey ? hsnResult.vehicle : null;
  const vehicleId = mode === "fahrzeug" ? (showHsn ? hsnVehicle?.id : picked?.generationId) : undefined;

  /* Suchparameter – dieselben Namen wie auf /suche */
  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (moto) p.set("typ", "motorrad");
    else {
      p.set("typ", "auto");
      p.set("art", tab);
    }
    if (vehicleId) p.set("fahrzeug", String(vehicleId));
    if (mode === "groesse") {
      if (zoll) p.set("zoll", zoll);
      if (!moto && lk) p.set("lk", lk);
      if (moto && pos) p.set("pos", pos);
      if (material) p.set("material", material);
    }
    if (preis) p.set("preis_max", preis);
    if (plz) {
      p.set("plz", plz);
      if (land) p.set("land", land);
      if (umkreis) p.set("umkreis", umkreis);
    }
    return p.toString();
  }, [moto, tab, vehicleId, mode, zoll, lk, pos, material, preis, plz, land, umkreis]);

  /* Live-Zählung (entprellt) */
  useEffect(() => {
    if (counted.q === query) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/suche/anzahl?${query}`, { signal: ctrl.signal });
        const data: { total?: number } = r.ok ? await r.json() : {};
        setCounted({ q: query, total: typeof data.total === "number" ? data.total : null });
      } catch {
        /* abgebrochen oder offline – Button bleibt ohne Zahl benutzbar */
      }
    }, 280);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, counted.q]);

  /* HSN/TSN automatisch nachschlagen, sobald beide Felder vollständig sind */
  useEffect(() => {
    if (!showHsn || !hsnComplete || hsnResult?.key === hsnKey) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const [h, s] = hsnKey.split("/");
        const r = await fetch(`/api/fahrzeuge?hsn=${encodeURIComponent(h)}&tsn=${encodeURIComponent(s)}`, { signal: ctrl.signal });
        const g: { id?: number; fullName?: string } | null = r.ok ? await r.json() : null;
        setHsnResult({ key: hsnKey, vehicle: g?.id ? { id: g.id, name: g.fullName ?? "Fahrzeug gefunden" } : null });
      } catch {
        /* abgebrochen */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [showHsn, hsnComplete, hsnKey, hsnResult?.key]);

  const pending = counted.q !== query;
  const total = counted.total;
  const buttonLabel =
    total == null ? "Angebote anzeigen" : `${count.format(total)} ${total === 1 ? "Angebot" : "Angebote"} anzeigen`;

  const switchTab = (t: Tab) => {
    if ((t === "motorrad") !== moto) {
      setPicked(null);
      setZoll("");
      setMaterial("");
      setHsnMode(false);
    }
    setTab(t);
  };

  const diameters = moto ? MOTO_DIAMETERS : CAR_DIAMETERS;
  const materials = moto ? MOTO_MATERIALS : CAR_MATERIALS;
  const panelId = `${uid}-panel`;

  return (
    <div className={clsx("overflow-hidden rounded-2xl border border-line bg-surface text-fg shadow-[0_24px_60px_-24px_rgb(0_0_0/0.55)]", className)}>
      {/* Kategorie-Tabs */}
      <div
        role="tablist"
        aria-label="Was suchst du?"
        className="flex border-b border-line"
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          const i = TABS.findIndex((t) => t.id === tab);
          const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].id;
          switchTab(next);
          document.getElementById(`${uid}-tab-${next}`)?.focus();
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              id={`${uid}-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => switchTab(t.id)}
              className={clsx(
                "relative flex flex-1 items-center justify-center gap-2 px-2 py-3.5 text-sm font-semibold transition-colors sm:flex-none sm:px-6 sm:text-[0.9375rem]",
                active ? "text-brand" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {t.icon === "rim" ? (
                <RimMark className="hidden h-4 w-4 sm:block" />
              ) : t.icon === "car" ? (
                <Car className="hidden h-4 w-4 sm:block" aria-hidden />
              ) : (
                <Bike className="hidden h-4 w-4 sm:block" aria-hidden />
              )}
              {t.label}
              <span className={clsx("absolute inset-x-3 bottom-0 h-[3px] rounded-t-full bg-brand-fill transition-opacity sm:inset-x-4", active ? "opacity-100" : "opacity-0")} />
            </button>
          );
        })}
      </div>

      <form
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${uid}-tab-${tab}`}
        className="p-4 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/suche?${query}`);
        }}
      >
        {/* Suche nach Fahrzeug | Größe */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Suchart" className="inline-flex rounded-xl bg-surface-2 p-1">
            {(
              [
                ["fahrzeug", "Nach Fahrzeug"],
                ["groesse", "Nach Größe"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={clsx(
                  "rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all",
                  mode === m ? "bg-surface text-fg shadow-card" : "text-muted hover:text-fg",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="hidden items-center gap-1.5 text-sm text-faint sm:flex">
            <CircleCheck className="h-4 w-4 text-brand" aria-hidden />
            {mode === "fahrzeug" ? "Wir zeigen dir nur Felgen, die passen" : "Alle Maße frei kombinierbar"}
          </p>
        </div>

        {/* Zeile 1: Fahrzeug bzw. Größe */}
        <div className="mt-4">
          {/* bleibt eingehängt, damit die Auswahl beim Umschalten erhalten bleibt */}
          <div hidden={mode !== "fahrzeug" || showHsn}>
            <VehiclePicker type={vehicleType} onPick={setPicked} idPrefix={`${uid}-vp`} />
          </div>
          {showHsn && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor={`${uid}-hsn`} className="sr-only">
                  HSN (Herstellerschlüsselnummer)
                </label>
                <Prefixed prefix="HSN">
                  <input
                    id={`${uid}-hsn`}
                    className="input pl-14"
                    placeholder="z. B. 0603"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    value={hsn}
                    onChange={(e) => setHsn(e.target.value.replace(/\D/g, ""))}
                  />
                </Prefixed>
              </div>
              <div>
                <label htmlFor={`${uid}-tsn`} className="sr-only">
                  TSN (Typschlüsselnummer)
                </label>
                <Prefixed prefix="TSN">
                  <input
                    id={`${uid}-tsn`}
                    className="input pl-14 uppercase placeholder:normal-case"
                    placeholder="z. B. BQR"
                    autoComplete="off"
                    maxLength={3}
                    value={tsn}
                    onChange={(e) => setTsn(e.target.value.toUpperCase())}
                  />
                </Prefixed>
              </div>
              <p className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1 sm:min-h-11" aria-live="polite">
                {hsnVehicle ? (
                  <>
                    <CircleCheck className="h-4 w-4 shrink-0 text-green" aria-hidden />
                    <span className="font-semibold">{hsnVehicle.name}</span>
                  </>
                ) : hsnComplete && hsnResult?.key === hsnKey ? (
                  <span className="text-red">Nicht gefunden – bitte Fahrzeug auswählen.</span>
                ) : (
                  <span className="text-faint">Steht im Fahrzeugschein (Feld 2.1 und 2.2).</span>
                )}
              </p>
            </div>
          )}
          {mode === "groesse" && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field id={`${uid}-zoll`} label="Zoll">
                <select id={`${uid}-zoll`} className="select" value={zoll} onChange={(e) => setZoll(e.target.value)}>
                  <option value="">Zoll (alle)</option>
                  {diameters.map((d) => (
                    <option key={d} value={d}>
                      {d} Zoll
                    </option>
                  ))}
                </select>
              </Field>
              {moto ? (
                <Field id={`${uid}-pos`} label="Position">
                  <select id={`${uid}-pos`} className="select" value={pos} onChange={(e) => setPos(e.target.value)}>
                    <option value="">Vorder- & Hinterrad</option>
                    <option value="vorne">Vorderrad</option>
                    <option value="hinten">Hinterrad</option>
                  </select>
                </Field>
              ) : (
                <Field id={`${uid}-lk`} label="Lochkreis">
                  <select id={`${uid}-lk`} className="select" value={lk} onChange={(e) => setLk(e.target.value)}>
                    <option value="">Lochkreis (alle)</option>
                    {COMMON_PCDS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field id={`${uid}-mat`} label="Material">
                <select id={`${uid}-mat`} className="select" value={material} onChange={(e) => setMaterial(e.target.value)}>
                  <option value="">Material (alle)</option>
                  {materials.map((m) => (
                    <option key={m} value={m}>
                      {MATERIALS[m]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>

        {/* Zeile 2: Preis · Ort + Umkreis · Button */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field id={`${uid}-preis`} label="Preis bis">
            <select id={`${uid}-preis`} className="select" value={preis} onChange={(e) => setPreis(e.target.value)}>
              <option value="">Preis bis (beliebig)</option>
              {PRICES.map((p) => (
                <option key={p} value={p}>
                  bis {formatPrice(p * 100)}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={`${uid}-plz`} className="sr-only">
                PLZ oder Ort
              </label>
              <PlzInput
                id={`${uid}-plz`}
                placeholder="PLZ / Ort"
                value={plz}
                onChange={(zip, country) => {
                  setPlz(zip);
                  setLand(country);
                }}
              />
            </div>
            <div className="w-[7.75rem] shrink-0">
              <label htmlFor={`${uid}-umkreis`} className="sr-only">
                Umkreis
              </label>
              <select id={`${uid}-umkreis`} className="select" value={umkreis} onChange={(e) => setUmkreis(e.target.value)}>
                <option value="">Umkreis</option>
                {RADII.map((r) => (
                  <option key={r} value={r}>
                    {r} km
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-brand min-h-12 w-full text-base sm:col-span-2 xl:col-span-1">
            <Search className="h-[1.125rem] w-[1.125rem]" aria-hidden />
            <span aria-live="polite" className={clsx("tabular-nums transition-opacity", pending && "opacity-70")}>
              {buttonLabel}
            </span>
          </button>
        </div>

        {/* Links */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href={`/suche?${query}`} className="flex items-center gap-1.5 font-semibold text-brand hover:underline hover:underline-offset-4">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Erweiterte Suche
          </Link>
          {!moto && (
            <button
              type="button"
              onClick={() => {
                setMode("fahrzeug");
                setHsnMode((v) => (mode === "fahrzeug" ? !v : true));
              }}
              className="flex items-center gap-1.5 font-semibold text-brand hover:underline hover:underline-offset-4"
            >
              <KeyRound className="h-4 w-4" aria-hidden />
              {showHsn ? "Marke & Modell wählen" : "Mit HSN/TSN suchen"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Sichtbares Kürzel links im Eingabefeld – bleibt stehen, wenn der Platzhalter verschwindet. */
function Prefixed({ prefix, children }: { prefix: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 flex w-12 items-center justify-center border-r border-line text-xs font-bold tracking-wide text-muted"
      >
        {prefix}
      </span>
      {children}
    </div>
  );
}
