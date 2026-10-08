/**
 * Passungsprüfung Felge ↔ Fahrzeug.
 *
 * Reine Funktionen ohne Datenbankzugriff – die gleichen Toleranzen werden in
 * `search.ts` als SQL-Vorfilter verwendet, damit Liste und Badge übereinstimmen.
 */

export const LOOSE_TOLERANCE = {
  diameter: 1, // Zoll
  width: 0.5, // J
  et: 7, // mm
};

export type FitMode = "streng" | "locker";
export type FitLevel = "perfekt" | "passend" | "zentrierring" | "pruefen" | "nein";

export const FIT_LEVEL_LABEL: Record<Exclude<FitLevel, "nein">, string> = {
  perfekt: "Passt perfekt",
  passend: "Passt",
  zentrierring: "Passt mit Zentrierring",
  pruefen: "Eventuell passend – prüfen",
};

export type FitGeneration = {
  boltCount: number | null;
  boltCircle: number | null;
  centerBore: number | null;
  etMin: number | null;
  etMax: number | null;
  widthMin: number | null;
  widthMax: number | null;
  diameterMin: number | null;
  diameterMax: number | null;
  specs: { position: "alle" | "vorne" | "hinten"; diameter: number; width: number | null; et: number | null; tireSize: string | null }[];
};

export type FitListing = {
  vehicleType: "auto" | "motorrad";
  kind: "felge" | "komplettrad";
  boltCount: number | null;
  boltCircle: number | null;
  centerBore: number | null;
  diameter: number;
  width: number;
  et: number | null;
  tireSize: string | null;
  wheelPosition: "alle" | "vorne" | "hinten";
  /** Verkäufer hat dieses Fahrzeug explizit als „passend für" angegeben */
  explicitFit: boolean;
};

export type FitResult = { level: FitLevel; hints: string[] };

const inRange = (v: number, min: number | null, max: number | null, tol = 0) =>
  (min == null || v >= min - tol) && (max == null || v <= max + tol);

/** Normalisiert Reifengrößen: „225/45 ZR17 94W" → „225/45r17" */
export function normalizeTireSize(s: string | null | undefined) {
  if (!s) return null;
  const m = s
    .toLowerCase()
    .replace(/\s+/g, "")
    .match(/(\d{2,3}(?:[.,]\d{1,2})?)\/(\d{2,3})-?z?r?b?-?(\d{2}(?:[.,]5)?)/);
  if (!m) return s.toLowerCase().replace(/\s+/g, "");
  return `${m[1].replace(",", ".")}/${m[2]}r${m[3].replace(",", ".")}`;
}

export function checkFitment(gen: FitGeneration, l: FitListing): FitResult {
  const hints: string[] = [];

  if (l.vehicleType === "motorrad") {
    if (l.explicitFit) return { level: "perfekt", hints: ["Vom Verkäufer als passend angegeben"] };
    const sameSize = gen.specs.some(
      (s) =>
        (l.wheelPosition === "alle" || s.position === "alle" || s.position === l.wheelPosition) &&
        s.diameter === l.diameter &&
        (s.width == null || s.width === l.width),
    );
    if (!sameSize) return { level: "nein", hints };
    hints.push("Gleiche Felgengröße – Achsdurchmesser, Bremsscheiben- und Kettenradaufnahme prüfen");
    return { level: "pruefen", hints };
  }

  // --- Auto ---
  if (l.explicitFit) hints.push("Vom Verkäufer als passend angegeben");

  if (gen.boltCount && gen.boltCircle) {
    if (l.boltCount !== gen.boltCount || l.boltCircle !== gen.boltCircle) {
      return { level: l.explicitFit ? "pruefen" : "nein", hints: [...hints, "Lochkreis weicht ab"] };
    }
  }

  let needsRing = false;
  let uncertain = false;

  if (gen.centerBore != null) {
    if (l.centerBore == null) {
      uncertain = true;
      hints.push("Mittenloch nicht angegeben");
    } else if (l.centerBore + 0.05 < gen.centerBore) {
      return { level: "nein", hints: [...hints, "Mittenloch zu klein"] };
    } else if (l.centerBore - gen.centerBore > 0.15) {
      needsRing = true;
      hints.push(`Zentrierring ${l.centerBore} → ${gen.centerBore} mm nötig`);
    }
  }

  const strictDiameter = inRange(l.diameter, gen.diameterMin, gen.diameterMax);
  const strictWidth = inRange(l.width, gen.widthMin, gen.widthMax);
  const strictEt = l.et != null && inRange(l.et, gen.etMin, gen.etMax);

  if (!strictDiameter) {
    if (!inRange(l.diameter, gen.diameterMin, gen.diameterMax, LOOSE_TOLERANCE.diameter) && !l.explicitFit)
      return { level: "nein", hints };
    uncertain = true;
    hints.push("Zollgröße außerhalb der Serienfreigabe – Eintragung prüfen");
  }
  if (!strictWidth) {
    if (!inRange(l.width, gen.widthMin, gen.widthMax, LOOSE_TOLERANCE.width) && !l.explicitFit)
      return { level: "nein", hints };
    uncertain = true;
    hints.push("Felgenbreite außerhalb der Serienfreigabe – Freigängigkeit prüfen");
  }
  if (!strictEt) {
    if (l.et == null) {
      hints.push("Einpresstiefe nicht angegeben");
    } else {
      if (!inRange(l.et, gen.etMin, gen.etMax, LOOSE_TOLERANCE.et) && !l.explicitFit) return { level: "nein", hints };
      hints.push("Einpresstiefe außerhalb des üblichen Bereichs – Gutachten prüfen");
    }
    uncertain = true;
  }

  if (l.kind === "komplettrad" && l.tireSize) {
    const t = normalizeTireSize(l.tireSize);
    const approved = gen.specs.some((s) => s.tireSize && normalizeTireSize(s.tireSize) === t);
    if (!approved && gen.specs.length > 0) hints.push("Reifengröße nicht in den Seriengrößen – Fahrzeugpapiere prüfen");
  }

  if (uncertain) return { level: l.explicitFit ? "passend" : "pruefen", hints };

  const oem = gen.specs.some(
    (s) => s.diameter === l.diameter && s.width === l.width && s.et != null && l.et != null && Math.abs(s.et - l.et) <= 3,
  );
  if (needsRing) return { level: "zentrierring", hints };
  if (oem || l.explicitFit) {
    if (oem) hints.unshift("Entspricht einer Serien-Radgröße");
    return { level: "perfekt", hints };
  }
  return { level: "passend", hints };
}

export function levelVisible(level: FitLevel, mode: FitMode) {
  if (level === "nein") return false;
  return mode === "locker" || level !== "pruefen";
}
