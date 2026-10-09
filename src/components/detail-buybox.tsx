import { clsx } from "clsx";
import { ArrowRight, Bike, ChevronRight, CircleCheck, CircleMinus, Phone, Snowflake, Store, Sun, SunSnow } from "lucide-react";
import Link from "next/link";
import type { listing } from "@/db/schema";
import { CONDITIONS, MATERIALS, PRICE_TYPES, SEASONS } from "@/lib/constants";
import { formatNumber, formatPcd, formatPrice } from "@/lib/format";
import { DetailContactButton, DetailShareButton } from "./detail-contact";
import { DetailIconDiameter, DetailIconOffset, DetailIconPcd, DetailIconTire, DetailIconWidth } from "./detail-icons";
import { FavoriteButton } from "./favorite-button";

type Listing = typeof listing.$inferSelect;
type IconType = React.ComponentType<{ className?: string }>;

const POSITION_SHORT = { alle: "Satz", vorne: "Vorne", hinten: "Hinten" } as const;
const SEASON_ICON = { sommer: Sun, winter: Snowflake, ganzjahr: SunSnow } as const;

/** Preis pro Stück, auf ganze Euro gerundet (nur bei Anzahl > 1) */
export function perPiecePrice(l: Pick<Listing, "priceCents" | "quantity">) {
  if (l.quantity <= 1) return null;
  return formatPrice(Math.round(l.priceCents / l.quantity / 100) * 100);
}

function factCells(l: Listing): { label: string; value: string; Icon: IconType }[] {
  const cells: { label: string; value: string; Icon: IconType }[] = [
    { label: "Zoll", value: `${formatNumber(l.diameter)}″`, Icon: DetailIconDiameter },
    { label: "Breite", value: `${formatNumber(l.width)} J`, Icon: DetailIconWidth },
  ];
  if (l.vehicleType === "motorrad") {
    cells.push({ label: "Position", value: POSITION_SHORT[l.wheelPosition], Icon: Bike });
    return cells;
  }
  if (l.et != null) cells.push({ label: "Einpresstiefe", value: `ET ${formatNumber(l.et)}`, Icon: DetailIconOffset });
  const pcd = formatPcd(l.boltCount, l.boltCircle);
  if (pcd) cells.push({ label: "Lochkreis", value: pcd, Icon: DetailIconPcd });
  return cells;
}

function CheckItem({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? CircleCheck : CircleMinus;
  return (
    <li className={clsx("flex items-start gap-2.5", !ok && "text-muted")}>
      <Icon className={clsx("mt-px h-[1.125rem] w-[1.125rem] shrink-0", ok ? "text-green" : "text-faint")} aria-hidden="true" />
      <span className="sr-only">{ok ? "Ja:" : "Nein:"}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

/** Kaufbox (Shop-Produktseite): Titel, Fakten, Preis, Abzeichen, Häkchen-Liste und Aktionen. */
export function DetailBuyBox({
  l,
  mode,
  favorite,
  ctaId,
  existingConversation,
  phone,
  seller,
  fitHint,
  similarHref = "#aehnliche",
}: {
  l: Listing;
  /** buyer = Kontakt möglich · owner = Eigentümer-Ansicht · closed = nicht mehr verfügbar */
  mode: "buyer" | "owner" | "closed";
  favorite: boolean;
  ctaId: string;
  existingConversation?: string | null;
  phone?: string | null;
  seller: { name: string; dealer: boolean; location: string };
  /** z. B. „VW Golf VII (5G)“ – Fahrzeug, das der Verkäufer als passend angegeben hat */
  fitHint?: string | null;
  /** Ziel für „Ähnliche Felgen ansehen“, wenn das Inserat nicht mehr verfügbar ist */
  similarHref?: string;
}) {
  const closed = mode === "closed";
  const featured = l.status === "aktiv" && l.featuredUntil && l.featuredUntil > new Date();
  const each = perPiecePrice(l);
  const cells = factCells(l);
  const SeasonIcon = l.season ? SEASON_ICON[l.season] : null;

  return (
    <div className="card p-5 sm:p-6">
      {/* Kopf */}
      <div className="flex flex-wrap items-center gap-2">
        {featured && <span className="badge badge-top">TOP</span>}
        <span className="truncate text-xs font-semibold uppercase tracking-wider text-brand">{[l.rimBrand, l.rimModel].filter(Boolean).join(" ")}</span>
      </div>
      <h1 className="mt-1.5 text-xl font-bold leading-snug text-balance sm:text-[1.375rem] sm:leading-tight">{l.title}</h1>

      {/* Abzeichen */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {l.kind === "komplettrad" && <span className="badge badge-brand">Komplettrad</span>}
        <span className="badge">{CONDITIONS[l.condition]}</span>
        {l.season && SeasonIcon && (
          <span className="badge">
            <SeasonIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {SEASONS[l.season]}
          </span>
        )}
        <span className="badge">{MATERIALS[l.material]}</span>
      </div>

      {/* Fakten-Chips */}
      <dl className="mt-4 grid overflow-hidden rounded-xl border border-line" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
        {cells.map(({ label, value, Icon }, i) => (
          <div key={label} className={clsx("flex flex-col items-center gap-1 bg-surface-2/50 px-1 py-2.5 text-center", i > 0 && "border-l border-line")}>
            <dt className="order-last max-w-full truncate text-[0.6875rem] leading-none text-muted">{label}</dt>
            <dd className="contents">
              <Icon className="order-first h-5 w-5 text-faint" />
              <span className="max-w-full truncate text-sm font-bold tabular-nums">{value}</span>
            </dd>
          </div>
        ))}
      </dl>
      {l.kind === "komplettrad" && l.tireSize && (
        <p className="mt-2 flex items-center gap-2 rounded-xl border border-line bg-surface-2/50 px-3 py-2 text-sm text-muted">
          <DetailIconTire className="h-5 w-5 shrink-0 text-faint" />
          <span className="min-w-0">
            Reifen <span className="font-semibold text-fg">{l.tireSize}</span>
            {l.tireBrand && <> · {l.tireBrand}</>}
          </span>
        </p>
      )}

      {/* Preis */}
      <div className="mt-4 border-t border-line pt-4">
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span className={clsx("font-display text-[2.5rem] font-extrabold leading-none tracking-tight tabular-nums", closed && "text-muted")}>
            {formatPrice(l.priceCents)}
          </span>
          <span className="badge">{PRICE_TYPES[l.priceType]}</span>
        </p>
        <p className="mt-1.5 text-sm text-muted">
          {l.quantity > 1 ? `Preis für ${l.quantity} Stück` : "Preis für 1 Stück"}
          {each && (
            <>
              {" · "}
              <span className="whitespace-nowrap font-semibold text-fg">≈ {each} / Stück</span>
            </>
          )}
        </p>
      </div>

      {/* Häkchen-Liste */}
      <ul className="mt-4 space-y-2.5 text-sm">
        {mode !== "closed" && (
          <CheckItem ok>
            {/* Link immer rechtsbündig in der ersten Zeile – der Text bricht bei Bedarf links um */}
            <span className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">Passungsprüfung für dein Fahrzeug</span>
              <a href="#passt" className="link shrink-0 whitespace-nowrap font-semibold">
                Jetzt prüfen
              </a>
            </span>
            {fitHint && <span className="mt-0.5 block text-xs text-muted">Laut Verkäufer passend für {fitHint}</span>}
          </CheckItem>
        )}
        <CheckItem ok={l.pickup}>{l.pickup ? <>Abholung in {seller.location}</> : "Keine Abholung"}</CheckItem>
        <CheckItem ok={l.shipping}>
          {l.shipping ? (
            <>
              Versand möglich
              {l.shippingCostCents != null && (
                <span className="text-muted"> · {l.shippingCostCents === 0 ? "kostenlos" : `${formatPrice(l.shippingCostCents)}`}</span>
              )}
            </>
          ) : (
            "Kein Versand – nur Abholung"
          )}
        </CheckItem>
        <CheckItem ok={l.hasCertificate}>{l.hasCertificate ? "Gutachten / ABE vorhanden" : "Kein Gutachten angegeben"}</CheckItem>
      </ul>

      {/* Aktionen */}
      <div className="mt-5 space-y-2.5">
        {mode === "buyer" && <DetailContactButton id={ctaId} existingConversation={existingConversation} className="h-12 w-full text-base" />}
        {closed && (
          <>
            <p className="text-center text-sm text-muted">Dieses Angebot ist nicht mehr verfügbar.</p>
            <Link href={similarHref} className="btn btn-brand h-12 w-full text-base">
              Ähnliche Felgen ansehen
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </>
        )}
        {mode === "buyer" && phone && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="btn btn-outline w-full">
            <Phone className="h-5 w-5" aria-hidden="true" /> {phone}
          </a>
        )}
        {mode === "owner" ? (
          <DetailShareButton title={l.title} className="w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 [&>button]:w-full">
            <FavoriteButton listingId={l.id} initial={favorite} variant="button" />
            <DetailShareButton title={l.title} />
          </div>
        )}
      </div>

      {/* Anbieter kompakt */}
      <a href="#anbieter" className="group -mx-5 -mb-5 mt-5 flex items-center gap-3 rounded-b-2xl border-t border-line px-5 py-4 transition-colors hover:bg-surface-2 sm:-mx-6 sm:-mb-6 sm:px-6">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand">
          {seller.dealer ? <Store className="h-5 w-5" aria-hidden="true" /> : seller.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold group-hover:text-brand">{seller.name}</span>
          <span className="block truncate text-xs text-muted">
            {seller.dealer ? "Gewerblicher Händler" : "Privatverkauf"} · {seller.location}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
      </a>
    </div>
  );
}
