"use client";
import { clsx } from "clsx";
import { CheckCircle2, CircleHelp, Wrench, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { checkListingFit } from "@/app/actions/fitment";
import { FIT_LEVEL_LABEL, type FitResult } from "@/lib/fitment";
import { Spinner } from "./logo";
import { VehiclePicker } from "./vehicle-picker";

export function FitCheck({ listingId, vehicleType }: { listingId: number; vehicleType: "auto" | "motorrad" }) {
  const [result, setResult] = useState<{ label: string; fit: FitResult } | null>(null);
  const [pending, start] = useTransition();

  const icon = (lvl: FitResult["level"]) =>
    lvl === "perfekt" || lvl === "passend" ? (
      <CheckCircle2 className="h-6 w-6 text-green" />
    ) : lvl === "zentrierring" ? (
      <Wrench className="h-6 w-6 text-brand" />
    ) : lvl === "pruefen" ? (
      <CircleHelp className="h-6 w-6 text-brand" />
    ) : (
      <XCircle className="h-6 w-6 text-red" />
    );

  return (
    <div className="card p-5">
      <h2 className="font-display text-lg uppercase tracking-wide">Passt das auf mein Fahrzeug?</h2>
      <p className="mt-1 text-sm text-muted">Wähle dein {vehicleType === "auto" ? "Auto" : "Motorrad"} – wir prüfen die Daten sofort.</p>
      <VehiclePicker
        type={vehicleType}
        className="mt-4 !grid-cols-1"
        idPrefix="fc"
        onPick={(v) => {
          if (!v) return setResult(null);
          start(async () => {
            const fit = await checkListingFit(listingId, v.generationId);
            if (fit) setResult({ label: v.label, fit });
          });
        }}
      />
      {pending && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
          <Spinner className="h-5 w-5" /> Prüfe …
        </div>
      )}
      {result && !pending && (
        <div
          className={clsx(
            "animate-scale-in mt-4 rounded-2xl border p-4",
            result.fit.level === "nein" ? "border-red/40 bg-red-soft" : result.fit.level === "perfekt" || result.fit.level === "passend" ? "border-green/40 bg-green-soft" : "border-brand/40 bg-brand-soft",
          )}
        >
          <div className="flex items-center gap-3">
            {icon(result.fit.level)}
            <div>
              <p className="font-semibold">{result.fit.level === "nein" ? "Passt nicht" : FIT_LEVEL_LABEL[result.fit.level]}</p>
              <p className="text-xs text-muted">{result.label}</p>
            </div>
          </div>
          {result.fit.hints.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
              {result.fit.hints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
