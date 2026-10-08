export type GenDef = {
  name: string;
  from: number | null;
  to: number | null;
  pcd: string | null;
  centerBore: number | null;
  thread: string | null;
  et: [number, number] | null;
  specs: string[];
  notes?: string;
};

export type MakeDef = {
  name: string;
  type: "auto" | "motorrad";
  models: Record<string, GenDef[]>;
};

/** Auto-Generation */
export function gen(
  name: string,
  from: number | null,
  to: number | null,
  pcd: string,
  centerBore: number,
  thread: string,
  et: [number, number] | null,
  specs: string[],
  notes?: string,
): GenDef {
  return { name, from, to, pcd, centerBore, thread, et, specs, notes };
}

/** Motorrad-Modell (Radgrößen vorne/hinten) */
export function moto(name: string, from: number | null, to: number | null, specs: string[], notes?: string): GenDef {
  return { name, from, to, pcd: null, centerBore: null, thread: null, et: null, specs, notes };
}

export function make(name: string, type: "auto" | "motorrad", models: Record<string, GenDef[]>): MakeDef {
  return { name, type, models };
}

export type ParsedSpec = {
  position: "alle" | "vorne" | "hinten";
  diameter: number;
  width: number | null;
  et: number | null;
  tireSize: string | null;
};

/**
 * Parst Radgrößen-Strings:
 *   "7.5Jx18 ET51 225/40 R18"            → alle
 *   "V 8Jx19 ET27 225/40 R19 | H 8.5Jx19 ET40 255/35 R19" → vorne + hinten
 *   "V 3.50x17 120/70 ZR17"              → Motorrad vorne
 *   "H 16 150/80B16"                     → nur Zoll bekannt
 */
export function parseSpec(spec: string): ParsedSpec[] {
  return spec.split("|").map((part) => {
    let s = part.trim();
    let position: ParsedSpec["position"] = "alle";
    const pm = s.match(/^([VH])\s+/);
    if (pm) {
      position = pm[1] === "V" ? "vorne" : "hinten";
      s = s.slice(pm[0].length);
    }
    let width: number | null = null;
    let diameter: number;
    const rim = s.match(/^(\d+(?:\.\d+)?)J?x(\d+(?:\.\d)?)\s*/i);
    if (rim) {
      width = Number(rim[1]);
      diameter = Number(rim[2]);
      s = s.slice(rim[0].length);
    } else {
      const d = s.match(/^(\d{2})\s+/);
      if (!d) throw new Error(`Ungültige Radgröße: ${part}`);
      diameter = Number(d[1]);
      s = s.slice(d[0].length);
    }
    let et: number | null = null;
    const etm = s.match(/^ET(-?\d+(?:\.\d)?)\s*/i);
    if (etm) {
      et = Math.round(Number(etm[1]));
      s = s.slice(etm[0].length);
    }
    return { position, diameter, width, et, tireSize: s.trim() || null };
  });
}
