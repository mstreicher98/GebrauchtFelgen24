import { parsePcd } from "./format";

/** Such-Filter, wie sie in der URL stehen (deutsche Parameternamen). */
export type SearchFilters = {
  typ?: "auto" | "motorrad";
  art?: "felge" | "komplettrad";
  q?: string;
  zoll?: number[];
  breiteMin?: number;
  breiteMax?: number;
  lk?: { boltCount: number; boltCircle: number };
  etMin?: number;
  etMax?: number;
  material?: string[];
  zustand?: string[];
  saison?: string[];
  preisMin?: number;
  preisMax?: number;
  plz?: string;
  land?: string;
  umkreis?: number;
  versand?: boolean;
  anbieter?: "privat" | "haendler";
  fahrzeug?: number;
  modus: "streng" | "locker";
  pos?: "vorne" | "hinten";
  sort: "neu" | "preis_auf" | "preis_ab" | "entfernung";
  seite: number;
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

function get(p: Params, k: string): string | undefined {
  if (p instanceof URLSearchParams) return p.get(k) ?? undefined;
  const v = p[k];
  return Array.isArray(v) ? v[0] : v;
}

const numOrUndef = (s: string | undefined) => {
  if (s == null || s.trim() === "") return undefined;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};
const list = (s: string | undefined) => (s ? s.split(",").map((x) => x.trim()).filter(Boolean) : undefined);
const oneOf = <T extends string>(s: string | undefined, allowed: readonly T[]) =>
  allowed.includes(s as T) ? (s as T) : undefined;

export function parseFilters(p: Params): SearchFilters {
  const zoll = list(get(p, "zoll"))
    ?.map(Number)
    .filter((n) => Number.isFinite(n) && n > 0 && n < 40);
  return {
    typ: oneOf(get(p, "typ"), ["auto", "motorrad"] as const),
    art: oneOf(get(p, "art"), ["felge", "komplettrad"] as const),
    q: get(p, "q")?.trim().slice(0, 100) || undefined,
    zoll: zoll?.length ? zoll : undefined,
    breiteMin: numOrUndef(get(p, "breite_min")),
    breiteMax: numOrUndef(get(p, "breite_max")),
    lk: parsePcd(get(p, "lk")) ?? undefined,
    etMin: numOrUndef(get(p, "et_min")),
    etMax: numOrUndef(get(p, "et_max")),
    material: list(get(p, "material")),
    zustand: list(get(p, "zustand")),
    saison: list(get(p, "saison")),
    preisMin: numOrUndef(get(p, "preis_min")),
    preisMax: numOrUndef(get(p, "preis_max")),
    plz: get(p, "plz")?.trim().slice(0, 10) || undefined,
    land: oneOf(get(p, "land"), ["AT", "DE", "CH"] as const),
    umkreis: numOrUndef(get(p, "umkreis")),
    versand: get(p, "versand") === "1" || undefined,
    anbieter: oneOf(get(p, "anbieter"), ["privat", "haendler"] as const),
    fahrzeug: numOrUndef(get(p, "fahrzeug")),
    modus: get(p, "modus") === "locker" ? "locker" : "streng",
    pos: oneOf(get(p, "pos"), ["vorne", "hinten"] as const),
    sort: oneOf(get(p, "sort"), ["neu", "preis_auf", "preis_ab", "entfernung"] as const) ?? "neu",
    seite: Math.max(1, Math.floor(numOrUndef(get(p, "seite")) ?? 1)),
  };
}

/** Zurück in URL-Parameter (nur gesetzte Werte). */
export function filtersToParams(f: Partial<SearchFilters>): URLSearchParams {
  const p = new URLSearchParams();
  const set = (k: string, v: unknown) => {
    if (v === undefined || v === null || v === "" || v === false) return;
    p.set(k, String(v));
  };
  set("typ", f.typ);
  set("art", f.art);
  set("q", f.q);
  set("zoll", f.zoll?.join(","));
  set("breite_min", f.breiteMin);
  set("breite_max", f.breiteMax);
  if (f.lk) set("lk", `${f.lk.boltCount}x${f.lk.boltCircle}`);
  set("et_min", f.etMin);
  set("et_max", f.etMax);
  set("material", f.material?.join(","));
  set("zustand", f.zustand?.join(","));
  set("saison", f.saison?.join(","));
  set("preis_min", f.preisMin);
  set("preis_max", f.preisMax);
  set("plz", f.plz);
  set("land", f.land);
  set("umkreis", f.umkreis);
  set("versand", f.versand ? "1" : undefined);
  set("anbieter", f.anbieter);
  set("fahrzeug", f.fahrzeug);
  if (f.fahrzeug && f.modus === "locker") set("modus", "locker");
  set("pos", f.pos);
  if (f.sort && f.sort !== "neu") set("sort", f.sort);
  if (f.seite && f.seite > 1) set("seite", f.seite);
  return p;
}

/** Kurze, lesbare Beschreibung einer Suche (für gespeicherte Suchen). */
export function describeFilters(f: SearchFilters, vehicleName?: string) {
  const parts: string[] = [];
  if (vehicleName) parts.push(vehicleName);
  if (f.art) parts.push(f.art === "felge" ? "Felgen" : "Kompletträder");
  if (f.typ && !vehicleName) parts.push(f.typ === "auto" ? "Auto" : "Motorrad");
  if (f.zoll) parts.push(f.zoll.map((z) => `${z}"`).join("/"));
  if (f.lk) parts.push(`LK ${f.lk.boltCount}x${f.lk.boltCircle}`);
  if (f.q) parts.push(`„${f.q}"`);
  if (f.saison) parts.push(f.saison.join("/"));
  if (f.preisMax) parts.push(`bis ${f.preisMax} €`);
  if (f.plz && f.umkreis) parts.push(`${f.umkreis} km um ${f.plz}`);
  return parts.join(" · ") || "Alle Felgen";
}
