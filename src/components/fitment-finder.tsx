"use client";
import { clsx } from "clsx";
import { ArrowRight, Bike, Car, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { VehiclePicker, type PickedVehicle } from "./vehicle-picker";

/** „Welche Felgen passen auf mein Fahrzeug?" – Schnellsuche für Startseite & Suche. */
export function FitmentFinder({ compact = false }: { compact?: boolean }) {
  const [type, setType] = useState<"auto" | "motorrad">("auto");
  const [mode, setMode] = useState<"auswahl" | "hsn">("auswahl");
  const [picked, setPicked] = useState<PickedVehicle>(null);
  const [strict, setStrict] = useState(true);
  const [hsn, setHsn] = useState("");
  const [tsn, setTsn] = useState("");
  const [hsnError, setHsnError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const go = (genId: number) => {
    const p = new URLSearchParams({ fahrzeug: String(genId) });
    if (!strict) p.set("modus", "locker");
    router.push(`/suche?${p}`);
  };

  return (
    <div className={clsx("card relative overflow-hidden p-4 sm:p-6", !compact && "shadow-[var(--shadow)]")}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-line p-1" role="tablist" aria-label="Fahrzeugart">
          {(["auto", "motorrad"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={type === t}
              onClick={() => {
                setType(t);
                setPicked(null);
                if (t === "motorrad") setMode("auswahl");
              }}
              className={clsx(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all",
                type === t ? "bg-brand-fill text-on-brand shadow" : "text-muted hover:text-fg",
              )}
            >
              {t === "auto" ? <Car className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
              {t === "auto" ? "Auto" : "Motorrad"}
            </button>
          ))}
        </div>
        {type === "auto" && (
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-brand"
            onClick={() => setMode((m) => (m === "hsn" ? "auswahl" : "hsn"))}
          >
            <KeyRound className="h-4 w-4" />
            {mode === "hsn" ? "Fahrzeug auswählen" : "Mit HSN/TSN suchen"}
          </button>
        )}
      </div>

      <div className="mt-4">
        {mode === "auswahl" ? (
          <VehiclePicker type={type} onPick={setPicked} size={compact ? "md" : "lg"} idPrefix={compact ? "ff-c" : "ff"} />
        ) : (
          <form
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setHsnError(null);
              const r = await fetch(`/api/fahrzeuge?hsn=${encodeURIComponent(hsn)}&tsn=${encodeURIComponent(tsn)}`);
              setBusy(false);
              if (!r.ok) {
                setHsnError("Diese Schlüsselnummer ist noch nicht in unserer Datenbank. Bitte wähle dein Fahrzeug manuell aus.");
                return;
              }
              const g = await r.json();
              go(g.id);
            }}
          >
            <input className="input" placeholder="HSN (z. B. 0603)" inputMode="numeric" maxLength={4} value={hsn} onChange={(e) => setHsn(e.target.value)} required aria-label="Herstellerschlüsselnummer (HSN)" />
            <input className="input uppercase" placeholder="TSN (z. B. BQR)" maxLength={3} value={tsn} onChange={(e) => setTsn(e.target.value)} required aria-label="Typschlüsselnummer (TSN)" />
            <button className="btn btn-brand" disabled={busy}>
              Suchen
            </button>
            <p className="text-xs text-faint sm:col-span-3">
              HSN/TSN findest du im deutschen Fahrzeugschein (Feld 2.1 und 2.2).
            </p>
            {hsnError && <p className="text-sm text-red sm:col-span-3">{hsnError}</p>}
          </form>
        )}
      </div>

      {mode === "auswahl" && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <span className="relative inline-flex">
              <input type="checkbox" className="peer sr-only" checked={!strict} onChange={(e) => setStrict(!e.target.checked)} />
              <span className="h-6 w-11 rounded-full bg-surface-3 transition-colors peer-checked:bg-brand-fill" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
            </span>
            <span>
              Auch <strong>eventuell passende</strong> Felgen zeigen
              <span className="block text-xs text-faint">z. B. andere Zollgröße oder ET – Eintragung prüfen</span>
            </span>
          </label>
          <button
            type="button"
            className="btn btn-brand group"
            disabled={!picked}
            onClick={() => picked && go(picked.generationId)}
          >
            Passende Felgen anzeigen
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
}
