import { Check, Snowflake, Store, Sun, Truck, X } from "lucide-react";
import Link from "next/link";
import { CONDITIONS, MATERIALS, SEASONS } from "@/lib/constants";
import { filtersToParams, type SearchFilters } from "@/lib/filters";
import { formatNumber } from "@/lib/format";

/** Link auf die Suche mit geänderten Filtern (immer zurück auf Seite 1). */
export function searchHref(f: SearchFilters, patch: Partial<SearchFilters>) {
  const qs = filtersToParams({ ...f, ...patch, seite: 1 }).toString();
  return qs ? `/suche?${qs}` : "/suche";
}

const toggle = <T,>(list: T[] | undefined, v: T) => {
  const cur = list ?? [];
  const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
  return next.length ? next : undefined;
};

type Chip = { key: string; label: string; href: string; active: boolean; icon?: React.ReactNode };

/**
 * Schnellfilter (horizontal scrollbar): Zollgrößen + häufige Wünsche.
 * `sizeRange`: bei gewähltem Fahrzeug nur die passenden Zollgrößen anbieten (z. B. [15, 19]).
 */
export function QuickFilters({
  f,
  vehicleType,
  sizeRange,
}: {
  f: SearchFilters;
  vehicleType?: "auto" | "motorrad";
  sizeRange?: [number, number];
}) {
  const moto = (vehicleType ?? f.typ) === "motorrad";
  const defaults = moto ? [16, 17, 18, 19, 21] : [15, 16, 17, 18, 19, 20, 21];
  const ranged = sizeRange ? Array.from({ length: sizeRange[1] - sizeRange[0] + 1 }, (_, i) => sizeRange[0] + i) : [];
  const sizes = ranged.length > 0 && ranged.length <= 9 ? ranged : defaults;

  const sizeChips: Chip[] = sizes.map((z) => ({
    key: `z${z}`,
    label: `${z}″`,
    href: searchHref(f, { zoll: toggle(f.zoll, z) }),
    active: !!f.zoll?.includes(z),
  }));

  const icon = "h-3.5 w-3.5";
  const otherChips: Chip[] = [
    ...(moto
      ? []
      : [{ key: "kr", label: "Kompletträder", href: searchHref(f, { art: f.art === "komplettrad" ? undefined : "komplettrad" }), active: f.art === "komplettrad" }]),
    {
      key: "winter",
      label: "Winter",
      href: searchHref(f, { saison: toggle(f.saison, "winter") }),
      active: !!f.saison?.includes("winter"),
      icon: <Snowflake className={icon} aria-hidden />,
    },
    {
      key: "sommer",
      label: "Sommer",
      href: searchHref(f, { saison: toggle(f.saison, "sommer") }),
      active: !!f.saison?.includes("sommer"),
      icon: <Sun className={icon} aria-hidden />,
    },
    {
      key: "versand",
      label: "Mit Versand",
      href: searchHref(f, { versand: f.versand ? undefined : true }),
      active: !!f.versand,
      icon: <Truck className={icon} aria-hidden />,
    },
    {
      key: "haendler",
      label: "Händler",
      href: searchHref(f, { anbieter: f.anbieter === "haendler" ? undefined : "haendler" }),
      active: f.anbieter === "haendler",
      icon: <Store className={icon} aria-hidden />,
    },
  ];

  const renderChip = (c: Chip) => (
    <li key={c.key} className="shrink-0">
      <Link href={c.href} scroll={false} className="chip h-9 whitespace-nowrap px-3.5 font-medium" data-active={c.active}>
        {c.active ? <Check className="h-3.5 w-3.5" aria-hidden /> : c.icon}
        {c.label}
        {c.active && <span className="sr-only"> (aktiv – zum Entfernen klicken)</span>}
      </Link>
    </li>
  );

  return (
    <nav aria-label="Schnellfilter" className="-mx-4 sm:-mx-6 lg:mx-0">
      <ul className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4 py-0.5 sm:px-6 lg:flex-wrap lg:overflow-visible lg:px-0">
        {sizeChips.map(renderChip)}
        <li aria-hidden className="mx-1 h-5 w-px shrink-0 bg-line" />
        {otherChips.map(renderChip)}
      </ul>
    </nav>
  );
}

/** Entfernbare Kennzeichen der aktiven Filter (Marktplatz-Muster). */
export function ActiveFilters({ f }: { f: SearchFilters }) {
  const tags: { key: string; label: string; href: string }[] = [];
  const add = (key: string, label: string, patch: Partial<SearchFilters>) => tags.push({ key, label, href: searchHref(f, patch) });
  const range = (min?: number, max?: number, unit = "") =>
    min != null && max != null
      ? `${formatNumber(min)}–${formatNumber(max)}${unit}`
      : min != null
        ? `ab ${formatNumber(min)}${unit}`
        : `bis ${formatNumber(max)}${unit}`;

  if (f.q) add("q", `„${f.q}“`, { q: undefined });
  if (f.typ) add("typ", f.typ === "auto" ? "Auto" : "Motorrad", { typ: undefined, lk: undefined, zoll: undefined });
  if (f.art) add("art", f.art === "felge" ? "Nur Felgen" : "Kompletträder", { art: undefined });
  f.zoll?.forEach((z) => add(`zoll${z}`, `${z} Zoll`, { zoll: toggle(f.zoll, z) }));
  if (f.lk) add("lk", `LK ${f.lk.boltCount}x${f.lk.boltCircle}`, { lk: undefined });
  if (f.breiteMin != null || f.breiteMax != null) add("breite", `Breite ${range(f.breiteMin, f.breiteMax, " J")}`, { breiteMin: undefined, breiteMax: undefined });
  if (f.etMin != null || f.etMax != null) add("et", `ET ${range(f.etMin, f.etMax)}`, { etMin: undefined, etMax: undefined });
  if (f.preisMin != null || f.preisMax != null) add("preis", `Preis ${range(f.preisMin, f.preisMax, " €")}`, { preisMin: undefined, preisMax: undefined });
  f.saison?.forEach((s) => add(`saison-${s}`, SEASONS[s as keyof typeof SEASONS] ?? s, { saison: toggle(f.saison, s) }));
  f.zustand?.forEach((s) => add(`zustand-${s}`, CONDITIONS[s as keyof typeof CONDITIONS] ?? s, { zustand: toggle(f.zustand, s) }));
  f.material?.forEach((s) => add(`material-${s}`, MATERIALS[s as keyof typeof MATERIALS] ?? s, { material: toggle(f.material, s) }));
  if (f.plz) add("plz", f.umkreis ? `${f.umkreis} km um ${f.plz}` : `PLZ ${f.plz}`, { plz: undefined, land: undefined, umkreis: undefined });
  if (f.versand) add("versand", "Mit Versand", { versand: undefined });
  if (f.anbieter) add("anbieter", f.anbieter === "haendler" ? "Händler" : "Privat", { anbieter: undefined });
  if (f.pos) add("pos", f.pos === "vorne" ? "Vorderrad" : "Hinterrad", { pos: undefined });

  if (tags.length === 0) return null;

  const resetHref = searchHref({ modus: f.modus, sort: f.sort, seite: 1, fahrzeug: f.fahrzeug, ansicht: f.ansicht }, {});

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Aktive Filter" role="group">
      {tags.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          scroll={false}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-soft pl-3 pr-2 text-[0.8125rem] font-semibold text-brand transition-colors hover:bg-brand-fill hover:text-on-brand"
          aria-label={`Filter entfernen: ${t.label}`}
        >
          {t.label}
          <X className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ))}
      <Link href={resetHref} scroll={false} className="ml-1 text-[0.8125rem] font-semibold text-muted underline-offset-2 hover:text-brand hover:underline">
        Alle zurücksetzen
      </Link>
    </div>
  );
}
