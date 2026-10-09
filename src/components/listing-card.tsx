import { clsx } from "clsx";
import { Bike, FileCheck2, Images, Snowflake, Store, Sun, SunSnow, Truck, UserRound } from "lucide-react";
import Link from "next/link";
import { CONDITIONS, SEASONS } from "@/lib/constants";
import { FIT_LEVEL_LABEL, type FitResult } from "@/lib/fitment";
import { formatNumber, formatPcd, formatPrice, formatRelative, listingUrl } from "@/lib/format";
import { imageSrcSet, imageUrl } from "@/lib/image-url";
import type { ListingCardData } from "@/lib/search";
import { FavoriteButton } from "./favorite-button";
import { RimMark } from "./logo";

export function FitBadge({ fit, className }: { fit: FitResult; className?: string }) {
  if (fit.level === "nein") return null;
  const tone =
    fit.level === "perfekt" ? "badge-green" : fit.level === "passend" ? "badge-green" : fit.level === "zentrierring" ? "badge-brand" : "";
  return (
    <span className={clsx("badge", tone, className)} title={fit.hints.join(" · ")}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", fit.level === "pruefen" ? "bg-muted" : "bg-current")} />
      {FIT_LEVEL_LABEL[fit.level]}
    </span>
  );
}

type CardListing = Omit<ListingCardData, "fit" | "distanceKm" | "explicitFit"> & {
  fit?: FitResult | null;
  distanceKm?: number | null;
};

/* ------------------------------------------------------------------ */
/* Kleine Fach-Icons (Linienstil wie lucide, 24er-Raster)              */
/* ------------------------------------------------------------------ */
type IconProps = { className?: string };
const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Durchmesser (Zoll) */
export function IconDiameter({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M7 12h10M9.5 9.5 7 12l2.5 2.5M14.5 9.5 17 12l-2.5 2.5" />
    </svg>
  );
}

/** Maulweite (J) */
export function IconWidth({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M4 5v14M20 5v14M7.5 12h9M10 9.5 7.5 12l2.5 2.5M14 9.5l2.5 2.5-2.5 2.5" />
    </svg>
  );
}

/** Einpresstiefe (ET) */
export function IconOffset({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M8 3v18" strokeDasharray="2 2.5" />
      <path d="M16 5v14M8 12h8M13.5 9.5 16 12l-2.5 2.5" />
    </svg>
  );
}

/** Lochkreis */
export function IconPcd({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <circle cx="12" cy="12" r="9" />
      <g fill="currentColor" stroke="none">
        <circle cx="12" cy="7" r="1.4" />
        <circle cx="16.76" cy="10.45" r="1.4" />
        <circle cx="14.94" cy="16.05" r="1.4" />
        <circle cx="9.06" cy="16.05" r="1.4" />
        <circle cx="7.24" cy="10.45" r="1.4" />
      </g>
    </svg>
  );
}

/** Reifen */
export function IconTire({ className }: IconProps) {
  return (
    <svg {...iconBase} className={className}>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" />
    </svg>
  );
}

const POSITION_SHORT = { alle: "Satz", vorne: "Vorne", hinten: "Hinten" } as const;
const SEASON_ICON = { sommer: Sun, winter: Snowflake, ganzjahr: SunSnow } as const;

type Fact = { label: string; value: string; Icon: React.ComponentType<IconProps> };

function getFacts(l: CardListing): Fact[] {
  const facts: Fact[] = [
    { label: "Zoll", value: `${formatNumber(l.diameter)}″`, Icon: IconDiameter },
    { label: "Breite", value: `${formatNumber(l.width)}J`, Icon: IconWidth },
  ];
  if (l.vehicleType === "motorrad") {
    facts.push({ label: "Position", value: POSITION_SHORT[l.wheelPosition] ?? "Satz", Icon: Bike });
    return facts;
  }
  if (l.et != null) facts.push({ label: "Einpresstiefe", value: `ET${formatNumber(l.et)}`, Icon: IconOffset });
  const pcd = formatPcd(l.boltCount, l.boltCircle);
  if (pcd) facts.push({ label: "Lochkreis", value: pcd, Icon: IconPcd });
  return facts;
}

/** Preis pro Stück, auf ganze Euro gerundet */
function perPiece(l: CardListing) {
  if (l.quantity <= 1) return null;
  return formatPrice(Math.round(l.priceCents / l.quantity / 100) * 100);
}

/* ------------------------------------------------------------------ */
/* Bausteine                                                           */
/* ------------------------------------------------------------------ */

function Stage({ l, priority, sizes, compact = false, className }: { l: CardListing; priority: boolean; sizes: string; compact?: boolean; className?: string }) {
  const featured = l.featuredUntil && new Date(l.featuredUntil) > new Date();
  const inactive = l.status !== "aktiv";
  return (
    <div className={clsx("relative overflow-hidden bg-surface-2", className)}>
      {l.imageKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl(l.imageKey, 800)}
          srcSet={imageSrcSet(l.imageKey)}
          sizes={sizes}
          alt={l.title}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={clsx(
            "absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.04]",
            inactive && "grayscale",
          )}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <RimMark className="h-1/3 w-1/3 text-faint opacity-30" />
        </div>
      )}
      <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
        {featured && <span className="badge badge-top">TOP</span>}
        {l.kind === "komplettrad" && (
          <span className={clsx("badge bg-black/65 text-white backdrop-blur-sm", compact && "max-sm:hidden")}>Komplettrad</span>
        )}
        {inactive && <span className="badge bg-black/75 text-white">{l.status === "verkauft" ? "Verkauft" : "Inaktiv"}</span>}
      </div>
      {l.imageCount > 1 && (
        <span className={clsx("badge absolute bottom-2.5 right-2.5 bg-black/60 tabular-nums text-white backdrop-blur-sm", compact && "max-sm:hidden")}>
          <Images className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Bilder:</span>
          {l.imageCount}
        </span>
      )}
    </div>
  );
}

function FactStrip({ facts }: { facts: Fact[] }) {
  return (
    <dl
      className="grid overflow-hidden rounded-xl border border-line bg-surface-2/40"
      style={{ gridTemplateColumns: `repeat(${facts.length}, minmax(0, 1fr))` }}
    >
      {facts.map(({ label, value, Icon }, i) => (
        <div key={label} className={clsx("flex flex-col items-center gap-1 px-1 py-2", i > 0 && "border-l border-line")} title={label}>
          <dt className="text-faint">
            <Icon className="h-[1.125rem] w-[1.125rem]" />
            <span className="sr-only">{label}</span>
          </dt>
          <dd className="max-w-full truncate text-[0.8125rem] font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function FactInline({ facts }: { facts: Fact[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[0.8125rem] sm:flex sm:flex-wrap sm:items-center sm:gap-x-5 sm:text-sm">
      {facts.map(({ label, value, Icon }) => (
        <div key={label} className="flex min-w-0 items-center gap-1.5" title={label}>
          <dt className="text-faint">
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </dt>
          <dd className="truncate font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TireLine({ l }: { l: CardListing }) {
  if (l.kind !== "komplettrad" || !l.tireSize) return null;
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
      <IconTire className="h-4 w-4 shrink-0 text-faint" />
      <span className="truncate">
        Reifen <span className="font-semibold text-fg">{l.tireSize}</span>
      </span>
    </p>
  );
}

function Price({ l, align = "left" }: { l: CardListing; align?: "left" | "right" }) {
  const each = perPiece(l);
  return (
    <div className={clsx(align === "right" && "sm:text-right")}>
      <p className={clsx("flex items-baseline gap-2", align === "right" && "sm:justify-end")}>
        <span className="font-display text-[1.625rem] leading-none font-extrabold tracking-tight tabular-nums">{formatPrice(l.priceCents)}</span>
        <span className="text-xs font-semibold text-muted">{l.priceType === "vb" ? "VB" : "Festpreis"}</span>
      </p>
      <p className="mt-1.5 text-xs text-muted">
        {l.quantity} Stück
        {each && (
          <>
            {" · "}
            <span className="whitespace-nowrap">≈ {each} / Stück</span>
          </>
        )}
      </p>
    </div>
  );
}

function Badges({ l, className }: { l: CardListing; className?: string }) {
  const SeasonIcon = l.season ? SEASON_ICON[l.season] : null;
  return (
    <div className={clsx("flex flex-wrap gap-1.5", className)}>
      {l.fit && <FitBadge fit={l.fit} />}
      {l.season && SeasonIcon && (
        <span className="badge">
          <SeasonIcon className="h-3.5 w-3.5" aria-hidden />
          {SEASONS[l.season]}
        </span>
      )}
      <span className="badge">{CONDITIONS[l.condition]}</span>
      {l.hasCertificate && (
        <span className="badge">
          <FileCheck2 className="h-3.5 w-3.5 text-brand" aria-hidden />
          Gutachten
        </span>
      )}
      {l.shipping && (
        <span className="badge">
          <Truck className="h-3.5 w-3.5 text-brand" aria-hidden />
          Versand
        </span>
      )}
    </div>
  );
}

function Footer({ l, showSeller = false }: { l: CardListing; showSeller?: boolean }) {
  const dealer = l.sellerType === "haendler";
  const SellerIcon = dealer ? Store : UserRound;
  const sellerLabel = dealer ? "Händler" : "Privat";
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-xs text-muted">
      {/* flex-1: feste Breite, damit Händlername und Ort in jeder Zeile gleich gekürzt werden */}
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <SellerIcon className={clsx("h-3.5 w-3.5 shrink-0", dealer ? "text-brand" : "text-faint")} aria-hidden />
        <span className={clsx("sr-only", showSeller && !dealer && "sm:hidden")}>{sellerLabel}: </span>
        {showSeller && (
          <>
            <span className="hidden min-w-0 max-w-[55%] shrink-0 truncate font-semibold text-fg sm:block">{dealer && l.sellerCompany ? l.sellerCompany : sellerLabel}</span>
            <span className="hidden text-faint sm:inline" aria-hidden>
              ·
            </span>
          </>
        )}
        <span className="min-w-0 truncate" title={`${sellerLabel} · ${l.zip} ${l.city}`}>
          {l.zip} {l.city}
          {l.distanceKm != null && ` · ${l.distanceKm} km`}
        </span>
      </span>
      <time dateTime={new Date(l.publishedAt).toISOString()} className="shrink-0 text-faint">
        {formatRelative(l.publishedAt)}
      </time>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Karte                                                               */
/* ------------------------------------------------------------------ */

export function ListingCard({
  l,
  favorite,
  priority = false,
  index = 0,
  headingLevel = 3,
  layout = "grid",
}: {
  l: CardListing;
  favorite?: boolean;
  priority?: boolean;
  index?: number;
  headingLevel?: 2 | 3;
  /** „grid“ = Shop-Kachel (Standard), „list“ = Marktplatz-Listenzeile */
  layout?: "grid" | "list";
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const facts = getFacts(l);
  const title = (
    <Link
      href={listingUrl(l)}
      className="after:absolute after:inset-0 after:content-[''] hover:text-brand focus-visible:outline-none focus-visible:after:rounded-2xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[var(--brand)]"
    >
      {l.title}
    </Link>
  );
  const heart = (
    <div className="absolute right-2.5 top-2.5 z-10">
      <FavoriteButton listingId={l.id} initial={!!favorite} variant="overlay" />
    </div>
  );
  const shell =
    "reveal group relative overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color,box-shadow] duration-300 hover:border-line-strong hover:shadow-[var(--shadow)]";
  const delay = { ["--reveal-delay" as string]: `${(index % 4) * 60}ms` };

  if (layout === "list") {
    return (
      <article className={clsx(shell, "flex")} style={delay}>
        {/* Handy: quadratisches Vorschaubild (Felge bleibt ganz sichtbar), ab sm: Bildspalte über die volle Höhe */}
        <div className="w-[38%] max-w-44 shrink-0 p-3 pr-0 sm:w-56 sm:max-w-none sm:p-0 xl:w-64">
          <div className="relative aspect-square overflow-hidden rounded-xl sm:aspect-auto sm:h-full sm:min-h-48 sm:rounded-none">
            <Stage l={l} priority={priority} sizes="(min-width: 1280px) 256px, (min-width: 640px) 224px, 38vw" compact className="h-full" />
            {heart}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <Heading className="line-clamp-2 text-sm font-semibold leading-5 sm:text-base sm:leading-6">{title}</Heading>
            <div className="shrink-0">
              <Price l={l} align="right" />
            </div>
          </div>
          <div className="mt-2.5 space-y-2 sm:mt-3">
            <FactInline facts={facts} />
            <TireLine l={l} />
          </div>
          <Badges l={l} className="mt-3 hidden sm:flex" />
          <div className="mt-auto pt-3 sm:pt-4">
            <Footer l={l} showSeller />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={clsx(shell, "flex flex-col")} style={delay}>
      <Stage
        l={l}
        priority={priority}
        sizes="(min-width: 1280px) 300px, (min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
        className="aspect-[4/3]"
      />
      {heart}
      <div className="flex flex-1 flex-col p-4">
        <Heading className="line-clamp-2 min-h-10 text-[0.9375rem] font-semibold leading-5">{title}</Heading>
        <div className="mt-3 space-y-2">
          <FactStrip facts={facts} />
          <TireLine l={l} />
        </div>
        <div className="mt-4">
          <Price l={l} />
        </div>
        <Badges l={l} className="mt-3" />
        <div className="mt-auto pt-4">
          <Footer l={l} />
        </div>
      </div>
    </article>
  );
}

export function ListingGrid({ children, className, cols = 4 }: { children: React.ReactNode; className?: string; cols?: 3 | 4 }) {
  return (
    <div className={clsx("grid gap-4 sm:grid-cols-2", cols === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "xl:grid-cols-3", className)}>{children}</div>
  );
}

/** Listenansicht (eine Karte pro Zeile) */
export function ListingList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("flex flex-col gap-3 sm:gap-4", className)}>{children}</div>;
}

export function ListingCardSkeleton({ layout = "grid" }: { layout?: "grid" | "list" }) {
  if (layout === "list") {
    return (
      <div className="flex overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="w-[38%] max-w-44 shrink-0 p-3 pr-0 sm:w-56 sm:max-w-none sm:p-0 xl:w-64">
          <div className="skeleton aspect-square rounded-xl sm:aspect-auto sm:h-full sm:min-h-48 sm:rounded-none" />
        </div>
        <div className="flex-1 space-y-3 p-3 sm:p-5">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-7 w-1/3" />
          <div className="skeleton h-4 w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-7 w-2/5" />
      </div>
    </div>
  );
}
