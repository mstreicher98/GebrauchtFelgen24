import { parseSpec, type ParsedSpec } from "../../data/vehicles/types";

/**
 * Fahrzeugliste als CSV (Excel-kompatibel: Semikolon, UTF-8 mit BOM, Dezimalkomma).
 * Eine Zeile pro Baureihe; Marken/Modelle ohne Baureihe stehen mit leerer Baureihe drin.
 * Der Import erkennt die Spalten am Namen (Reihenfolge egal) und akzeptiert auch Komma/Tab als Trennzeichen.
 */

export const VEHICLE_COLUMNS = [
  "Typ",
  "Marke",
  "Modell",
  "Baureihe",
  "Baujahr von",
  "Baujahr bis",
  "Lochkreis",
  "Mittenloch (mm)",
  "Gewinde",
  "Befestigung",
  "ET min",
  "ET max",
  "Radgrößen",
  "Hinweis",
] as const;

export type VehicleRow = {
  type: "auto" | "motorrad";
  make: string;
  model: string;
  generation: string | null;
  yearFrom: number | null;
  yearTo: number | null;
  boltCount: number | null;
  boltCircle: number | null;
  centerBore: number | null;
  thread: string | null;
  fastener: string | null;
  etMin: number | null;
  etMax: number | null;
  specs: ParsedSpec[];
  notes: string | null;
};

/** Radgröße als Text, z. B. „7.5Jx18 ET51 225/40 R18“ (Auto) bzw. „V 3.50x17 120/70 ZR17“ (Motorrad, ohne J) */
export function specToString(
  s: { position: string; diameter: number; width: number | null; et: number | null; tireSize: string | null },
  type: "auto" | "motorrad" = "auto",
) {
  const pos = s.position === "vorne" ? "V " : s.position === "hinten" ? "H " : "";
  const rim = s.width == null ? `${s.diameter}` : type === "motorrad" ? `${s.width.toFixed(2)}x${s.diameter}` : `${s.width}Jx${s.diameter}`;
  return `${pos}${rim}${s.et != null ? ` ET${s.et}` : ""}${s.tireSize ? ` ${s.tireSize}` : ""}`;
}

/* ---------------- Export ---------------- */

const esc = (v: string) => (/[;"\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const num = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

export function vehicleRowsToCsv(rows: VehicleRow[]) {
  const lines = [VEHICLE_COLUMNS.join(";")];
  for (const r of rows) {
    lines.push(
      [
        r.type === "auto" ? "Auto" : "Motorrad",
        r.make,
        r.model,
        r.generation ?? "",
        r.yearFrom?.toString() ?? "",
        r.yearTo?.toString() ?? "",
        r.boltCount && r.boltCircle ? `${r.boltCount}x${num(r.boltCircle)}` : "",
        num(r.centerBore),
        r.thread ?? "",
        r.fastener ?? "",
        num(r.etMin),
        num(r.etMax),
        r.specs.map((s) => specToString(s, r.type)).join(" | "),
        r.notes ?? "",
      ]
        .map(esc)
        .join(";"),
    );
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}

/* ---------------- Import ---------------- */

/** CSV-Parser mit Anführungszeichen ("" als Escape, Zeilenumbrüche in Feldern) und erkanntem Trennzeichen. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.slice(0, src.search(/\r?\n|$/));
  const delim = [";", "\t", ","].reduce((best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best), ";");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && field === "") quoted = true;
    else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim()));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-zäöüß0-9]/g, "");
const HEADER_ALIASES: Record<string, (typeof VEHICLE_COLUMNS)[number]> = {
  fahrzeugtyp: "Typ",
  hersteller: "Marke",
  generation: "Baureihe",
  von: "Baujahr von",
  bis: "Baujahr bis",
  pcd: "Lochkreis",
  mittenloch: "Mittenloch (mm)",
  nabe: "Mittenloch (mm)",
  radgroessen: "Radgrößen",
  hinweise: "Hinweis",
  notizen: "Hinweis",
};

function decimal(v: string, label: string, errors: string[]) {
  const s = v.trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) {
    errors.push(`${label}: „${v}“ ist keine Zahl`);
    return null;
  }
  return n;
}

/** Felgengrößen-Spannen einer Baureihe aus ihren Radgrößen (für die Passungsprüfung) */
export function specRanges(specs: ParsedSpec[]) {
  const diameters = specs.map((s) => s.diameter);
  const widths = specs.map((s) => s.width).filter((w): w is number => w != null);
  return {
    diameterMin: diameters.length ? Math.floor(Math.min(...diameters)) : null,
    diameterMax: diameters.length ? Math.ceil(Math.max(...diameters)) : null,
    widthMin: widths.length ? Math.min(...widths) - 0.5 : null,
    widthMax: widths.length ? Math.max(...widths) + 0.5 : null,
  };
}

/**
 * Liest eine Fahrzeugliste (CSV) ein. Fehlerhafte Zeilen werden mit Zeilennummer gemeldet und übersprungen.
 * `columns` nennt die vorhandenen Spalten – fehlende Spalten lassen beim Import bestehende Werte unverändert.
 */
export function parseVehicleCsv(text: string): { rows: VehicleRow[]; errors: string[]; columns: (typeof VEHICLE_COLUMNS)[number][] } {
  const table = parseCsv(text);
  const errors: string[] = [];
  if (table.length === 0) return { rows: [], errors: ["Die Datei ist leer."], columns: [] };

  const index = new Map<(typeof VEHICLE_COLUMNS)[number], number>();
  table[0].forEach((h, i) => {
    const key = norm(h);
    const col = VEHICLE_COLUMNS.find((c) => norm(c) === key) ?? HEADER_ALIASES[key];
    if (col && !index.has(col)) index.set(col, i);
  });
  const missing = (["Typ", "Marke", "Modell"] as const).filter((c) => !index.has(c));
  if (missing.length) return { rows: [], errors: [`Spalte(n) fehlen: ${missing.join(", ")}. Erste Zeile muss die Spaltennamen enthalten.`], columns: [] };

  const rows: VehicleRow[] = [];
  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const get = (c: (typeof VEHICLE_COLUMNS)[number]) => (index.has(c) ? (cells[index.get(c)!] ?? "").trim() : "");
    const rowErrors: string[] = [];
    const typRaw = get("Typ").toLowerCase();
    const type = /^(auto|pkw|car)/.test(typRaw) ? "auto" : /^(motorrad|moto|bike|krad)/.test(typRaw) ? "motorrad" : null;
    if (!type) rowErrors.push(`Typ „${get("Typ")}“ unbekannt (Auto oder Motorrad)`);
    const make = get("Marke");
    const model = get("Modell");
    if (!make) rowErrors.push("Marke fehlt");
    // Ohne Modell nur erlaubt, wenn auch keine Baureihe angegeben ist (dann wird nur die Marke angelegt)
    if (!model && get("Baureihe")) rowErrors.push("Modell fehlt");

    const year = (c: "Baujahr von" | "Baujahr bis") => {
      const v = get(c);
      if (!v || /^(aktuell|heute|-|–)$/i.test(v)) return null;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1900 || n > 2100) {
        rowErrors.push(`${c} „${v}“ ungültig`);
        return null;
      }
      return n;
    };
    const pcdRaw = get("Lochkreis").replace(",", ".").replace(/\s/g, "");
    const pcd = pcdRaw ? /^(\d{1,2})[x×/](\d{2,3}(?:\.\d)?)$/i.exec(pcdRaw) : null;
    if (pcdRaw && !pcd) rowErrors.push(`Lochkreis „${get("Lochkreis")}“ ungültig (Format 5x112)`);

    let specs: ParsedSpec[] = [];
    const specRaw = get("Radgrößen")
      .replace(/(\d),(\d)/g, "$1.$2")
      .split(/\r?\n/)
      .join(" | ");
    if (specRaw.trim()) {
      try {
        specs = specRaw
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean)
          .flatMap(parseSpec);
      } catch (e) {
        rowErrors.push((e as Error).message);
      }
    }

    const row: VehicleRow = {
      type: type ?? "auto",
      make,
      model,
      generation: get("Baureihe") || null,
      yearFrom: year("Baujahr von"),
      yearTo: year("Baujahr bis"),
      boltCount: pcd ? Number(pcd[1]) : null,
      boltCircle: pcd ? Number(pcd[2]) : null,
      centerBore: decimal(get("Mittenloch (mm)"), "Mittenloch", rowErrors),
      thread: get("Gewinde") || null,
      fastener: get("Befestigung") || null,
      etMin: decimal(get("ET min"), "ET min", rowErrors),
      etMax: decimal(get("ET max"), "ET max", rowErrors),
      specs,
      notes: get("Hinweis") || null,
    };
    if (row.etMin != null) row.etMin = Math.round(row.etMin);
    if (row.etMax != null) row.etMax = Math.round(row.etMax);
    if (rowErrors.length) errors.push(`Zeile ${line}: ${rowErrors.join(", ")}`);
    else rows.push(row);
  });
  return { rows, errors, columns: [...index.keys()] };
}
