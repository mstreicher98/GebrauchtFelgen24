import { ArrowLeftRight, Bike, CalendarDays, CarFront, FileCheck2, Hash, Layers, Radar, Ruler, Shapes, Snowflake, Sparkles, Sun, SunSnow, Tag } from "lucide-react";
import type { listing } from "@/db/schema";
import { CONDITIONS, LISTING_KIND_SINGULAR, MATERIALS, SEASONS, WHEEL_POSITIONS } from "@/lib/constants";
import { formatDot, formatNumber, formatPcd, formatRimSize } from "@/lib/format";
import { DetailIconBore, DetailIconDiameter, DetailIconOffset, DetailIconPcd, DetailIconTire, DetailIconTread, DetailIconWidth } from "./detail-icons";

type Listing = typeof listing.$inferSelect;
type Row = { label: string; value: string | null | undefined; Icon: React.ComponentType<{ className?: string }> };

const SEASON_ICON = { sommer: Sun, winter: Snowflake, ganzjahr: SunSnow } as const;

function SpecGroup({ title, rows }: { title: string; rows: Row[] }) {
  const visible = rows.filter((r) => r.value);
  if (visible.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-faint">{title}</h3>
      <dl className="grid sm:grid-cols-2 sm:gap-x-8">
        {visible.map(({ label, value, Icon }) => (
          <div key={label} className="flex min-h-12 items-center gap-3 border-b border-line py-2">
            <dt className="flex shrink-0 items-center gap-3 text-sm text-muted">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                <Icon className="h-[1.125rem] w-[1.125rem]" />
              </span>
              {label}
            </dt>
            <dd className="ml-auto min-w-0 pl-2 text-right text-sm font-semibold tabular-nums [overflow-wrap:anywhere]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Technische Daten als zweispaltige Tabelle mit Icons. */
export function DetailSpecs({ l }: { l: Listing }) {
  const isCar = l.vehicleType === "auto";
  const rim: Row[] = [
    { label: "Art", value: LISTING_KIND_SINGULAR[l.kind], Icon: Shapes },
    { label: "Fahrzeug", value: isCar ? "Auto" : "Motorrad", Icon: isCar ? CarFront : Bike },
    { label: "Felgenmarke", value: [l.rimBrand, l.rimModel].filter(Boolean).join(" "), Icon: Tag },
    { label: "Material", value: MATERIALS[l.material], Icon: Layers },
    { label: "Felgengröße", value: formatRimSize(l.width, l.diameter), Icon: Ruler },
    { label: "Durchmesser", value: `${formatNumber(l.diameter)} Zoll`, Icon: DetailIconDiameter },
    { label: "Breite", value: `${formatNumber(l.width)} J`, Icon: DetailIconWidth },
    ...(isCar
      ? [
          { label: "Lochkreis", value: formatPcd(l.boltCount, l.boltCircle), Icon: DetailIconPcd },
          { label: "Einpresstiefe", value: l.et != null ? `ET ${l.et} mm` : null, Icon: DetailIconOffset },
          { label: "Mittenloch", value: l.centerBore != null ? `${formatNumber(l.centerBore)} mm` : null, Icon: DetailIconBore },
        ]
      : [{ label: "Position", value: WHEEL_POSITIONS[l.wheelPosition], Icon: ArrowLeftRight }]),
    { label: "Anzahl", value: `${l.quantity} Stück`, Icon: Hash },
    { label: "Zustand", value: CONDITIONS[l.condition], Icon: Sparkles },
    { label: "Gutachten / ABE", value: l.hasCertificate ? "Vorhanden" : "Nicht angegeben", Icon: FileCheck2 },
  ];
  const tire: Row[] =
    l.kind === "komplettrad"
      ? [
          { label: "Reifengröße", value: l.tireSize, Icon: DetailIconTire },
          { label: "Reifenmarke", value: l.tireBrand, Icon: Tag },
          { label: "Saison", value: l.season ? SEASONS[l.season] : null, Icon: l.season ? SEASON_ICON[l.season] : Sun },
          { label: "Profiltiefe", value: l.treadDepth != null ? `${formatNumber(l.treadDepth)} mm` : null, Icon: DetailIconTread },
          { label: "DOT", value: formatDot(l.dot), Icon: CalendarDays },
          { label: "RDKS-Sensoren", value: l.tpms == null ? null : l.tpms ? "Ja" : "Nein", Icon: Radar },
        ]
      : [];

  return (
    <section aria-labelledby="specs-title" className="card p-5 sm:p-6">
      <h2 id="specs-title" className="font-display text-lg uppercase tracking-wide sm:text-xl">
        Technische Daten
      </h2>
      <div className="mt-4 space-y-6">
        <SpecGroup title={l.kind === "komplettrad" ? "Felge" : "Felgen-Daten"} rows={rim} />
        <SpecGroup title="Reifen" rows={tire} />
      </div>
    </section>
  );
}
