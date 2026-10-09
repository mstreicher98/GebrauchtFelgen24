import { clsx } from "clsx";
import { and, asc, count, desc, eq, ne, sql } from "drizzle-orm";
import { ArrowRight, Bike, CalendarDays, Car, ChevronRight, Eye, Hash, Info, Settings2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { conversation, listing, listingFitment, listingImage, user } from "@/db/schema";
import { DetailBuyBox, perPiecePrice } from "@/components/detail-buybox";
import { DetailContactDialog } from "@/components/detail-contact";
import { DetailMobileBar } from "@/components/detail-mobile-bar";
import { DetailSeller } from "@/components/detail-seller";
import { DetailSpecs } from "@/components/detail-specs";
import { DetailSticky } from "@/components/detail-sticky";
import { FitCheck } from "@/components/fit-check";
import { ImageGallery } from "@/components/image-gallery";
import { ListingCard } from "@/components/listing-card";
import { OwnerActions } from "@/components/owner-actions";
import { ReportButton } from "@/components/report-button";
import { COUNTRIES, LISTING_STATUS, PRICE_TYPES } from "@/lib/constants";
import { env } from "@/lib/env";
import { getFavoriteIds } from "@/lib/favorites";
import { formatDate, formatNumber, formatPcd, formatPrice, formatRelative, formatRimSize, listingUrl, yearRange } from "@/lib/format";
import { imageUrl } from "@/lib/image-url";
import { listingCardColumns } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";
import { generationLabel, getGenerationNames } from "@/lib/vehicles";

const getListing = cache(async (id: number) => {
  const [row] = await db
    .select({ l: listing, seller: user })
    .from(listing)
    .innerJoin(user, eq(user.id, listing.userId))
    .where(eq(listing.id, id))
    .limit(1);
  if (!row) return null;
  const [images, fits] = await Promise.all([
    db
      .select({ key: listingImage.key, width: listingImage.width, height: listingImage.height })
      .from(listingImage)
      .where(eq(listingImage.listingId, id))
      .orderBy(asc(listingImage.position)),
    db.select({ g: listingFitment.generationId }).from(listingFitment).where(eq(listingFitment.listingId, id)),
  ]);
  const fitNames = await getGenerationNames(fits.map((f) => f.g));
  return { ...row, images, fitNames };
});

function parseId(slug: string) {
  const id = Number(slug.match(/^(\d+)/)?.[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata(props: PageProps<"/inserat/[slug]">): Promise<Metadata> {
  const id = parseId((await props.params).slug);
  const data = id ? await getListing(id) : null;
  if (!data) return { title: "Inserat nicht gefunden" };
  const { l, images } = data;
  const desc = `${formatPrice(l.priceCents)} · ${formatRimSize(l.width, l.diameter)}${l.et != null ? ` ET${l.et}` : ""}${l.boltCount ? ` · ${formatPcd(l.boltCount, l.boltCircle)}` : ""} · ${l.zip} ${l.city}. ${l.description.slice(0, 120)}`;
  return {
    title: l.title,
    description: desc,
    alternates: { canonical: listingUrl(l) },
    openGraph: { title: l.title, description: desc, images: images[0] ? [{ url: imageUrl(images[0].key, 1600) }] : undefined },
    robots: l.status === "aktiv" ? undefined : { index: false },
  };
}

const CTA_ID = "kaufbox-kontakt";
const END_ID = "inserat-ende";

export default async function ListingPage(props: PageProps<"/inserat/[slug]">) {
  const { slug } = await props.params;
  const id = parseId(slug);
  if (!id) notFound();
  const [me, data] = await Promise.all([getCurrentUser(), getListing(id)]);
  if (!data) notFound();
  const { l, seller, images, fitNames } = data;

  const canonical = listingUrl(l);
  if (`/inserat/${slug}` !== canonical) permanentRedirect(canonical);

  const isOwner = me?.id === l.userId;
  const isAdmin = me?.role === "admin";
  if (l.status === "gesperrt" && !isOwner && !isAdmin) notFound();

  if (!isOwner) {
    void db.update(listing).set({ viewCount: sql`${listing.viewCount} + 1` }).where(eq(listing.id, l.id)).catch(() => {});
  }

  const isCar = l.vehicleType === "auto";
  const pcd = formatPcd(l.boltCount, l.boltCircle);

  const [existingConv, similar, favs, [sellerStats]] = await Promise.all([
    me && !isOwner
      ? db
          .select({ id: conversation.id })
          .from(conversation)
          .where(and(eq(conversation.listingId, l.id), eq(conversation.buyerId, me.id)))
          .limit(1)
      : Promise.resolve([]),
    db
      .select(listingCardColumns)
      .from(listing)
      .innerJoin(user, eq(user.id, listing.userId))
      .where(
        and(
          eq(listing.status, "aktiv"),
          ne(listing.id, l.id),
          eq(listing.vehicleType, l.vehicleType),
          eq(listing.diameter, l.diameter),
          l.boltCount && l.boltCircle ? and(eq(listing.boltCount, l.boltCount), eq(listing.boltCircle, l.boltCircle)) : undefined,
        ),
      )
      .orderBy(desc(listing.publishedAt))
      .limit(4),
    getFavoriteIds(me?.id, [l.id]),
    db
      .select({ n: count() })
      .from(listing)
      .where(and(eq(listing.userId, seller.id), eq(listing.status, "aktiv"))),
  ]);
  const similarFavs = await getFavoriteIds(me?.id, similar.map((s) => s.id));

  const dealer = seller.accountType === "haendler";
  const sellerName = dealer && seller.companyName ? seller.companyName : seller.name.split(" ")[0];
  const country = COUNTRIES[l.country as keyof typeof COUNTRIES] ?? l.country;
  const place = `${l.zip} ${l.city}`;
  const phone = l.showPhone && seller.phone && l.status === "aktiv" ? seller.phone : null;
  const canContact = !isOwner && l.status === "aktiv";
  const conv = existingConv[0]?.id ?? null;
  const each = perPiecePrice(l);
  const fitHint = fitNames.length
    ? `${fitNames[0].makeName} ${generationLabel(fitNames[0].modelName, fitNames[0].name)}${fitNames.length > 1 ? ` (+${fitNames.length - 1})` : ""}`
    : null;

  // Brotkrümel & Such-Links
  const typeBase = isCar ? (l.kind === "komplettrad" ? "/suche?typ=auto&art=komplettrad" : "/suche?typ=auto&art=felge") : "/suche?typ=motorrad";
  const crumbs = [
    { href: "/", label: "Startseite" },
    { href: typeBase, label: isCar ? (l.kind === "komplettrad" ? "Kompletträder" : "Autofelgen") : "Motorradfelgen" },
    { href: `${typeBase}&zoll=${l.diameter}`, label: `${formatNumber(l.diameter)} Zoll` },
    ...(isCar && pcd ? [{ href: `${typeBase}&zoll=${l.diameter}&lk=${pcd}`, label: pcd }] : []),
  ];
  // „Ähnliche Felgen“ = gleiche Größe und gleicher Lochkreis, egal ob Felge oder Komplettrad (wie die Abfrage oben)
  const similarHref = `/suche?typ=${l.vehicleType}&zoll=${l.diameter}${isCar && pcd ? `&lk=${pcd}` : ""}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: l.title,
      description: l.description,
      image: images.map((i) => `${env.appUrl}${imageUrl(i.key, 1600)}`),
      brand: { "@type": "Brand", name: l.rimBrand },
      itemCondition: l.condition === "neu" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
      offers: {
        "@type": "Offer",
        price: (l.priceCents / 100).toFixed(2),
        priceCurrency: "EUR",
        availability: l.status === "aktiv" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
        url: `${env.appUrl}${canonical}`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [...crumbs, { href: canonical, label: l.title }].map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.label,
        item: `${env.appUrl}${c.href}`,
      })),
    },
  ];

  const manage = isOwner || isAdmin;
  const ownerPanel = manage && (
    <section aria-labelledby="verwalten-title" className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-brand-soft px-5 py-3.5">
        <h2 id="verwalten-title" className="flex items-center gap-2 font-semibold">
          <Settings2 className="h-4 w-4 text-brand" aria-hidden="true" />
          {isOwner ? "Dein Inserat verwalten" : "Admin-Ansicht"}
        </h2>
        <span className={l.status === "aktiv" ? "badge badge-green" : "badge"}>{LISTING_STATUS[l.status]}</span>
      </div>
      <div className="p-5">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-surface-2 px-3 py-2.5">
            <dt className="text-xs text-muted">Aufrufe</dt>
            <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">{formatNumber(l.viewCount)}</dd>
          </div>
          <div className="rounded-xl bg-surface-2 px-3 py-2.5">
            <dt className="text-xs text-muted">Läuft bis</dt>
            <dd className="mt-0.5 font-display text-lg font-bold tabular-nums">{formatDate(l.expiresAt)}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <OwnerActions id={l.id} status={l.status} />
        </div>
      </div>
    </section>
  );

  return (
    <div className="container-page pb-12 pt-4 sm:pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <nav aria-label="Brotkrümel" className="mb-4">
        <ol className="scrollbar-none flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-muted">
          {crumbs.map((c, i) => (
            <li key={c.href} className="flex shrink-0 items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-faint" aria-hidden="true" />}
              <Link href={c.href} className="hover:text-brand">
                {c.label}
              </Link>
            </li>
          ))}
          <li className="hidden min-w-0 items-center gap-1 md:flex">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
            <span aria-current="page" className="truncate font-medium text-fg">
              {l.title}
            </span>
          </li>
        </ol>
      </nav>

      {l.status !== "aktiv" && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-brand/40 bg-brand-soft px-4 py-3 text-sm" role="status">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
          <p>
            Dieses Inserat ist <strong>{LISTING_STATUS[l.status].toLowerCase()}</strong>
            {l.status === "verkauft" && l.soldAt ? ` (seit ${formatDate(l.soldAt)})` : ""}.
            {!isOwner && similar.length > 0 && (
              <>
                {" "}
                <a href="#aehnliche" className="link font-semibold">
                  Ähnliche Felgen ansehen
                </a>
              </>
            )}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24.5rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_26rem]">
        {/* Galerie */}
        <div className="-mx-4 min-w-0 sm:mx-0 lg:col-start-1 lg:row-start-1">
          <ImageGallery
            images={images}
            title={l.title}
            overlay={
              l.status === "verkauft" ? (
                <span className="badge bg-black/75 text-white">Verkauft</span>
              ) : l.kind === "komplettrad" ? (
                <span className="badge bg-black/65 text-white backdrop-blur-sm">Komplettrad</span>
              ) : null
            }
          />
        </div>

        {/* Kaufbox */}
        <aside className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1" aria-label="Preis und Kontakt">
          <DetailSticky className="space-y-4">
            {ownerPanel}
            <DetailBuyBox
              l={l}
              mode={isOwner ? "owner" : canContact ? "buyer" : "closed"}
              favorite={favs.has(l.id)}
              ctaId={CTA_ID}
              existingConversation={conv}
              phone={phone}
              seller={{ name: sellerName, dealer, location: place }}
              fitHint={fitHint}
              similarHref={similar.length > 0 ? "#aehnliche" : similarHref}
            />
          </DetailSticky>
        </aside>

        {/* Inhalt */}
        <div className="min-w-0 space-y-6 lg:col-start-1 lg:row-start-2">
          {l.status === "aktiv" ? (
            <FitCheck id="passt" listingId={l.id} vehicleType={l.vehicleType}>
              {fitNames.length > 0 && <FitList fitNames={fitNames} isCar={isCar} />}
            </FitCheck>
          ) : (
            fitNames.length > 0 && (
              <section className="card p-5 sm:p-6">
                <FitList fitNames={fitNames} isCar={isCar} plain />
              </section>
            )
          )}

          <DetailSpecs l={l} />

          {l.description && (
            <section aria-labelledby="beschreibung-title" className="card p-5 sm:p-6">
              <h2 id="beschreibung-title" className="font-display text-lg uppercase tracking-wide sm:text-xl">
                Beschreibung
              </h2>
              <p className="mt-3 max-w-prose whitespace-pre-line text-[0.9375rem] leading-7">{l.description}</p>
            </section>
          )}

          <DetailSeller seller={seller} displayName={sellerName} location={`${place}, ${country}`} activeListings={sellerStats?.n ?? 0} phone={phone} />

          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-1 text-xs text-faint">
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" aria-hidden="true" /> Anzeigen-Nr. {l.id}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Eingestellt {formatRelative(l.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" /> {l.viewCount} Aufrufe
              </span>
            </p>
            {!isOwner && <ReportButton targetType="listing" targetId={String(l.id)} label="Inserat melden" loggedIn={!!me} />}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section id="aehnliche" aria-labelledby="aehnliche-title" className="mt-14 scroll-mt-24 sm:mt-16">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 id="aehnliche-title" className="font-display text-2xl uppercase">
                Ähnliche Felgen
              </h2>
              <p className="mt-1 text-sm text-muted">
                {formatNumber(l.diameter)} Zoll{isCar && pcd ? ` · Lochkreis ${pcd}` : ""} – gleiche Größe, andere Angebote
              </p>
            </div>
            <Link href={similarHref} className="link hidden shrink-0 items-center gap-1 text-sm font-semibold sm:inline-flex">
              Alle ansehen <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          {/* Am Handy als wischbares Karussell, ab sm als Raster */}
          <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
            {similar.map((s, i) => (
              <div key={s.id} className="flex w-[80%] shrink-0 snap-start flex-col sm:w-auto [&>article]:flex-1">
                <ListingCard l={s} favorite={similarFavs.has(s.id)} index={i} />
              </div>
            ))}
            {/* Füllt eine unvollständige letzte Rasterzeile mit einem Link zu allen passenden Angeboten */}
            <Link
              href={similarHref}
              className={clsx(
                "group hidden flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface-2/60 p-6 text-center transition-colors hover:border-brand hover:bg-brand-soft",
                similar.length % 2 ? "sm:flex" : "sm:hidden",
                similar.length % 3 ? "lg:flex" : "lg:hidden",
                similar.length % 4 ? "xl:flex" : "xl:hidden",
              )}
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-fill text-on-brand shadow-[var(--shadow-card)] transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-display text-lg font-bold uppercase leading-tight tracking-wide">Mehr Angebote</span>
              <span className="text-sm text-muted">
                Alle {formatNumber(l.diameter)}″-{isCar ? "Angebote" : "Motorradfelgen"}
                {isCar && pcd ? ` mit Lochkreis ${pcd}` : ""} ansehen
              </span>
            </Link>
          </div>
          <Link href={similarHref} className="btn btn-outline mt-5 w-full sm:hidden">
            Alle ähnlichen Felgen ansehen <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      )}

      <div id={END_ID} className="h-px" aria-hidden="true" />

      {canContact && (
        <>
          <DetailMobileBar
            price={formatPrice(l.priceCents)}
            priceType={PRICE_TYPES[l.priceType]}
            priceNote={each ? `${l.quantity} Stück · ≈ ${each} / Stück` : `${l.quantity} Stück`}
            ctaId={CTA_ID}
            endId={END_ID}
            phone={phone}
            existingConversation={conv}
          />
          {!conv && (
            <DetailContactDialog
              listingId={l.id}
              loggedIn={!!me}
              sellerName={sellerName}
              sellerType={dealer ? "Gewerblicher Händler" : "Privatverkauf"}
              title={l.title}
              price={formatPrice(l.priceCents)}
              imageSrc={images[0] ? imageUrl(images[0].key, 400) : null}
            />
          )}
        </>
      )}
    </div>
  );
}

function FitList({
  fitNames,
  isCar,
  plain = false,
}: {
  fitNames: Awaited<ReturnType<typeof getGenerationNames>>;
  isCar: boolean;
  plain?: boolean;
}) {
  const Icon = isCar ? Car : Bike;
  return (
    <div className={plain ? undefined : "mt-5 border-t border-line pt-5"}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-faint">Laut Verkäufer passend für</h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {fitNames.map((g) => (
          <li key={g.id}>
            <Link
              href={`/suche?fahrzeug=${g.id}`}
              className="chip max-w-full items-start gap-2 rounded-2xl leading-5"
              title={`Weitere Felgen für ${g.makeName} ${generationLabel(g.modelName, g.name)}`}
            >
              <Icon className="h-4 w-4 shrink-0 translate-y-0.5 text-brand" aria-hidden="true" />
              {/* Als Fließtext, damit lange Namen am Handy sauber umbrechen */}
              <span className="min-w-0">
                <span className="font-semibold text-fg">
                  {g.makeName} {generationLabel(g.modelName, g.name)}
                </span>{" "}
                <span className="whitespace-nowrap text-faint">{yearRange(g.yearFrom, g.yearTo)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
