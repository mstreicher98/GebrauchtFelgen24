"use client";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { VehiclePicker, type PickedVehicle } from "./vehicle-picker";

import type { FitmentItem } from "@/lib/listing-form-values";

/** Mehrfachauswahl von Fahrzeugen für „Passend für". */
export function FitmentSelector({
  type,
  value,
  onChange,
  invalid,
}: {
  type: "auto" | "motorrad";
  value: FitmentItem[];
  onChange: (v: FitmentItem[]) => void;
  invalid?: boolean;
}) {
  const [picked, setPicked] = useState<PickedVehicle>(null);
  const [resetKey, setResetKey] = useState(0);
  return (
    <div className={invalid ? "rounded-2xl ring-1 ring-red p-2" : undefined}>
      {value.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {value.map((v) => (
            <span key={v.id} className="chip animate-scale-in" data-active="true">
              {v.label}
              <button type="button" onClick={() => onChange(value.filter((x) => x.id !== v.id))} aria-label={`${v.label} entfernen`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <VehiclePicker key={`${type}-${resetKey}`} type={type} onPick={setPicked} className="flex-1" idPrefix="fs" />
        <button
          type="button"
          className="btn btn-outline"
          disabled={!picked || value.some((v) => v.id === picked.generationId)}
          onClick={() => {
            if (!picked) return;
            onChange([...value, { id: picked.generationId, label: picked.label }]);
            setPicked(null);
            setResetKey((k) => k + 1);
          }}
        >
          <Plus className="h-4 w-4" /> Hinzufügen
        </button>
      </div>
    </div>
  );
}
