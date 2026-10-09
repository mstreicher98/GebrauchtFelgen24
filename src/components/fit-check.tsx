"use client";
import { clsx } from "clsx";
import { ArrowRight, Bike, CarFront, CheckCircle2, CircleHelp, Wrench, XCircle } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { checkListingFit } from "@/app/actions/fitment";
import { FIT_LEVEL_LABEL, type FitResult } from "@/lib/fitment";
import { Spinner } from "./logo";
import { VehiclePicker } from "./vehicle-picker";

const CHECKS = {
  auto: "Lochkreis, Mittenloch, Breite, Einpresstiefe und Reifengröße",
  motorrad: "Felgengröße, Breite, Position und Reifengröße",
};

export function FitCheck({
  listingId,
  vehicleType,
  id,
  className,
  children,
}: {
  listingId: number;
  vehicleType: "auto" | "motorrad";
  /** Anker-ID, z. B. „passt“ für Sprungmarken aus der Kaufbox */
  id?: string;
  className?: string;
  /** Zusatzinhalt unter der Prüfung (z. B. „Laut Verkäufer passend für“) */
  children?: React.ReactNode;
}) {
  const [result, setResult] = useState<{ label: string; generationId: number; fit: FitResult } | null>(null);
  const [pending, start] = useTransition();
  const VehicleIcon = vehicleType === "auto" ? CarFront : Bike;

  const icon = (lvl: FitResult["level"]) =>
    lvl === "perfekt" || lvl === "passend" ? (
      <CheckCircle2 className="h-7 w-7 text-green" aria-hidden="true" />
    ) : lvl === "zentrierring" ? (
      <Wrench className="h-7 w-7 text-brand" aria-hidden="true" />
    ) : lvl === "pruefen" ? (
      <CircleHelp className="h-7 w-7 text-brand" aria-hidden="true" />
    ) : (
      <XCircle className="h-7 w-7 text-red" aria-hidden="true" />
    );

  const good = result && (result.fit.level === "perfekt" || result.fit.level === "passend");

  return (
    <section id={id} aria-labelledby="fitcheck-title" className={clsx("card scroll-mt-24 overflow-hidden", className)}>
      <div className="flex items-start gap-4 border-b border-line bg-brand-soft px-5 py-5 sm:px-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-fill text-on-brand shadow-[var(--shadow-card)]">
          <VehicleIcon className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="fitcheck-title" className="font-display text-lg uppercase leading-tight tracking-wide sm:text-xl">
            Passt auf mein {vehicleType === "auto" ? "Auto" : "Motorrad"}?
          </h2>
          <p className="mt-1 text-sm text-muted">
            Wähle dein {vehicleType === "auto" ? "Fahrzeug" : "Motorrad"} – wir gleichen {CHECKS[vehicleType]} sofort mit den Herstellerdaten ab.
          </p>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <VehiclePicker
          type={vehicleType}
          // Baureihe + Baujahr ist das längste Feld – etwas mehr Platz, damit es nicht abgeschnitten wird
          className="sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)]!"
          idPrefix="fc"
          onPick={(v) => {
            if (!v) return setResult(null);
            start(async () => {
              const fit = await checkListingFit(listingId, v.generationId);
              if (fit) setResult({ label: v.label, generationId: v.generationId, fit });
            });
          }}
        />

        <div aria-live="polite">
          {pending && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
              <Spinner className="h-5 w-5" /> Prüfe die Passung …
            </div>
          )}
          {result && !pending && (
            <div
              className={clsx(
                "animate-scale-in mt-4 rounded-xl border p-4",
                result.fit.level === "nein" ? "border-red/40 bg-red-soft" : good ? "border-green/40 bg-green-soft" : "border-brand/40 bg-brand-soft",
              )}
            >
              <div className="flex items-start gap-3">
                {icon(result.fit.level)}
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold">{result.fit.level === "nein" ? "Passt leider nicht" : FIT_LEVEL_LABEL[result.fit.level]}</p>
                  <p className="text-sm text-muted">für {result.label}</p>
                </div>
              </div>
              {result.fit.hints.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-line/60 pt-3 text-sm text-muted">
                  {result.fit.hints.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" aria-hidden="true" />
                      {h}
                    </li>
                  ))}
                </ul>
              )}
              <Link href={`/suche?fahrzeug=${result.generationId}`} className="link mt-3 inline-block text-sm font-semibold">
                {good ? "Weitere passende Felgen ansehen" : "Passende Felgen für dein Fahrzeug finden"}
                <ArrowRight className="ml-1 inline h-4 w-4 align-[-3px]" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {children}
      </div>
    </section>
  );
}
