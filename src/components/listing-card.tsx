import { clsx } from "clsx";
import { Bike, Car, Images, MapPin, Truck } from "lucide-react";
import Link from "next/link";
import { CONDITIONS, SEASONS } from "@/lib/constants";
import { FIT_LEVEL_LABEL, type FitResult } from "@/lib/fitment";
import { formatNumber, formatPcd, formatPrice, formatRelative, formatRimSize, listingUrl } from "@/lib/format";
import { imageSrcSet, imageUrl } from "@/lib/image-url";
import type { ListingCardData } from "@/lib/search";
import { FavoriteButton } from "./favorite-button";
import { RimMark } from "./logo";

export function FitBadge({ fit, className }: { fit: FitResult; className?: string }) {
  if (fit.level === "nein") return null;
  const tone =
    fit.level === "perfekt" ? "badge-green" : fit.level === "passend" ? "badge-green" : fit.level === "zentrierring" ? "badge-gold" : "";
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

export function ListingCard({
  l,
  favorite,
  priority = false,
  index = 0,
  headingLevel = 3,
}: {
  l: CardListing;
  favorite?: boolean;
  priority?: boolean;
  index?: number;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const featured = l.featuredUntil && new Date(l.featuredUntil) > new Date();
  const pcd = formatPcd(l.boltCount, l.boltCircle);
  const inactive = l.status !== "aktiv";
  return (
    <article
      className="listing-card card reveal group relative flex flex-col overflow-hidden"
      style={{ ["--reveal-delay" as string]: `${(index % 4) * 70}ms` }}
    >
      <Link href={listingUrl(l)} className="relative block aspect-[4/3] overflow-hidden bg-surface-2">
        {l.imageKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(l.imageKey, 800)}
            srcSet={imageSrcSet(l.imageKey)}
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
            alt={l.title}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            className={clsx("h-full w-full object-cover", inactive && "grayscale")}
          />
        ) : (
          <div className="grid h-full w-full place-items-center">
            <RimMark className="h-16 w-16 text-faint opacity-40" />
          </div>
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {featured && <span className="badge bg-red-solid text-white shadow">TOP</span>}
          {l.kind === "komplettrad" && <span className="badge bg-black/65 text-white backdrop-blur">Komplettrad</span>}
          {inactive && <span className="badge bg-black/75 text-white">{l.status === "verkauft" ? "Verkauft" : "Inaktiv"}</span>}
        </div>
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <span className="badge bg-black/65 text-white backdrop-blur">
            {l.vehicleType === "motorrad" ? <Bike className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />}
            {formatNumber(l.diameter)}&quot;
          </span>
          {l.imageCount > 1 && (
            <span className="badge bg-black/65 text-white backdrop-blur">
              <Images className="h-3.5 w-3.5" />
              {l.imageCount}
            </span>
          )}
        </div>
      </Link>
      <div className="absolute right-2.5 top-2.5">
        <FavoriteButton listingId={l.id} initial={!!favorite} variant="overlay" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-display text-xl font-semibold tracking-wide">{formatPrice(l.priceCents)}</span>
          <span className="text-xs text-faint">{l.priceType === "vb" ? "VB" : "Festpreis"}</span>
        </div>
        <Heading className="line-clamp-2 text-[0.95rem] font-semibold leading-snug">
          <Link href={listingUrl(l)} className="after:absolute after:inset-0 after:content-[''] hover:text-gold">
            {l.title}
          </Link>
        </Heading>
        <p className="text-sm text-muted">
          {[formatRimSize(l.width, l.diameter), l.et != null ? `ET${l.et}` : null, pcd].filter(Boolean).join(" · ")}
          {" · "}
          {l.quantity} Stk.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {l.fit && <FitBadge fit={l.fit} />}
          {l.season && <span className="badge">{SEASONS[l.season]}</span>}
          <span className="badge">{CONDITIONS[l.condition]}</span>
          {l.sellerType === "haendler" && <span className="badge badge-gold">Händler</span>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-faint">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {l.zip} {l.city}
              {l.distanceKm != null && ` · ${l.distanceKm} km`}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {l.shipping && <Truck className="h-3.5 w-3.5" aria-label="Versand möglich" />}
            {formatRelative(l.publishedAt)}
          </span>
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

export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}
