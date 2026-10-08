import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { BadgeCheck, Bike, Calendar, Car, Eye, MapPin, Package, Phone, Store, Truck, User as UserIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { conversation, listing, listingFitment, listingImage, user } from "@/db/schema";
import { ContactSeller } from "@/components/contact-seller";
import { FavoriteButton } from "@/components/favorite-button";
import { FitCheck } from "@/components/fit-check";
import { ImageGallery } from "@/components/image-gallery";
import { ListingCard, ListingGrid } from "@/components/listing-card";
import { OwnerActions } from "@/components/owner-actions";
import { ReportButton } from "@/components/report-button";
import { ShareButton } from "@/components/share-button";
import { CONDITIONS, COUNTRIES, LISTING_KIND_SINGULAR, LISTING_STATUS, MATERIALS, PRICE_TYPES, SEASONS, WHEEL_POSITIONS } from "@/lib/constants";
import { env } from "@/lib/env";
import { getFavoriteIds } from "@/lib/favorites";
import { formatDate, formatDot, formatNumber, formatPcd, formatPrice, formatRelative, formatRimSize, listingUrl, yearRange } from "@/lib/format";
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

  const [existingConv, similar, favs] = await Promise.all([
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
  ]);
  const similarFavs = await getFavoriteIds(me?.id, similar.map((s) => s.id));

  const pcd = formatPcd(l.boltCount, l.boltCircle);
  const sellerName = seller.accountType === "haendler" && seller.companyName ? seller.companyName : seller.name.split(" ")[0];
  const isCar = l.vehicleType === "auto";

  const specs: [string, string | null][] = [
    ["Art", LISTING_KIND_SINGULAR[l.kind]],
    ["Fahrzeug", isCar ? "Auto" : "Motorrad"],
    ["Felgenmarke", [l.rimBrand, l.rimModel].filter(Boolean).join(" ")],
    ["Material", MATERIALS[l.material]],
    ["Größe", formatRimSize(l.width, l.diameter)],
    ["Durchmesser", `${formatNumber(l.diameter)} Zoll`],
    ["Breite", `${formatNumber(l.width)} J`],
    ...(isCar
      ? ([
          ["Lochkreis", pcd],
          ["Einpresstiefe", l.et != null ? `ET ${l.et} mm` : null],
          ["Mittenloch", l.centerBore != null ? `${formatNumber(l.centerBore)} mm` : null],
        ] as [string, string | null][])
      : ([["Position", WHEEL_POSITIONS[l.wheelPosition]]] as [string, string | null][])),
    ["Anzahl", `${l.quantity} Stück`],
    ["Zustand", CONDITIONS[l.condition]],
    ["Gutachten / ABE", l.hasCertificate ? "Vorhanden" : null],
  ];
  const tireSpecs: [string, string | null][] =
    l.kind === "komplettrad"
      ? [
          ["Reifengröße", l.tireSize],
          ["Reifenmarke", l.tireBrand],
          ["Saison", l.season ? SEASONS[l.season] : null],
          ["Profiltiefe", l.treadDepth != null ? `${formatNumber(l.treadDepth)} mm` : null],
          ["DOT", formatDot(l.dot)],
          ["RDKS-Sensoren", l.tpms == null ? null : l.tpms ? "Ja" : "Nein"],
        ]
      : [];

  const jsonLd = {
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
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-faint" aria-label="Brotkrümel">
        <Link href="/" className="hover:text-gold">Start</Link>/
        <Link href={`/suche?typ=${l.vehicleType}`} className="hover:text-gold">{isCar ? "Autofelgen" : "Motorradfelgen"}</Link>/
        <Link href={`/suche?typ=${l.vehicleType}&zoll=${l.diameter}`} className="hover:text-gold">{formatNumber(l.diameter)} Zoll</Link>
      </nav>

      {l.status !== "aktiv" && (
        <div className="mb-4 rounded-2xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-gold">
          Dieses Inserat ist {LISTING_STATUS[l.status].toLowerCase()}
          {l.status === "verkauft" && l.soldAt ? ` (seit ${formatDate(l.soldAt)})` : ""}.
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0 space-y-8">
          <ImageGallery images={images} title={l.title} />

          <div className="lg:hidden">
            <TitleBlock l={l} favorite={favs.has(l.id)} />
          </div>

          <section className="card reveal p-5 sm:p-6">
            <h2 className="font-display text-xl uppercase tracking-wide">Technische Daten</h2>
            <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
              {specs
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
            </dl>
            {tireSpecs.length > 0 && (
              <>
                <h3 className="mt-6 font-semibold">Reifen</h3>
                <dl className="mt-2 grid gap-x-8 sm:grid-cols-2">
                  {tireSpecs
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
                        <dt className="text-muted">{k}</dt>
                        <dd className="text-right font-medium">{v}</dd>
                      </div>
                    ))}
                </dl>
              </>
            )}
          </section>

          {l.description && (
            <section className="card reveal p-5 sm:p-6">
              <h2 className="font-display text-xl uppercase tracking-wide">Beschreibung</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{l.description}</p>
            </section>
          )}

          {fitNames.length > 0 && (
            <section className="card reveal p-5 sm:p-6">
              <h2 className="font-display text-xl uppercase tracking-wide">Laut Verkäufer passend für</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {fitNames.map((g) => (
                  <Link key={g.id} href={`/suche?fahrzeug=${g.id}`} className="chip">
                    {isCar ? <Car className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                    {g.makeName} {generationLabel(g.modelName, g.name)}
                    <span className="text-faint">{yearRange(g.yearFrom, g.yearTo)}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {l.status === "aktiv" && <div className="reveal"><FitCheck listingId={l.id} vehicleType={l.vehicleType} /></div>}
        </div>

        {/* Seitenleiste */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="hidden lg:block">
            <TitleBlock l={l} favorite={favs.has(l.id)} />
          </div>

          {isOwner || isAdmin ? (
            <div className="card p-5">
              <h2 className="font-semibold">{isOwner ? "Dein Inserat" : "Admin"}</h2>
              <p className="mt-1 text-sm text-muted">
                Status: {LISTING_STATUS[l.status]} · {l.viewCount} Aufrufe · läuft bis {formatDate(l.expiresAt)}
              </p>
              <div className="mt-4">
                <OwnerActions id={l.id} status={l.status} />
              </div>
            </div>
          ) : null}

          {!isOwner && l.status === "aktiv" && (
            <div className="card p-5">
              <ContactSeller listingId={l.id} loggedIn={!!me} existingConversation={existingConv[0]?.id} />
              <p className="mt-3 text-center text-xs text-faint">Deine Kontaktdaten bleiben privat. Zahle nie im Voraus an Unbekannte.</p>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-gold-soft text-lg font-bold text-gold">
                {seller.accountType === "haendler" ? <Store className="h-5 w-5" /> : sellerName.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <Link href={`/nutzer/${seller.id}`} className="block truncate font-semibold hover:text-gold">
                  {sellerName}
                </Link>
                <p className="flex items-center gap-1 text-xs text-muted">
                  {seller.accountType === "haendler" ? (
                    <>
                      <BadgeCheck className="h-3.5 w-3.5 text-gold" /> Gewerblicher Händler
                    </>
                  ) : (
                    <>
                      <UserIcon className="h-3.5 w-3.5" /> Privat
                    </>
                  )}{" "}
                  · dabei seit {seller.createdAt.getFullYear()}
                </p>
              </div>
            </div>
            {l.showPhone && seller.phone && l.status === "aktiv" && (
              <a href={`tel:${seller.phone.replace(/\s/g, "")}`} className="btn btn-outline mt-4 w-full">
                <Phone className="h-4 w-4" /> {seller.phone}
              </a>
            )}
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-faint" /> {l.zip} {l.city}, {COUNTRIES[l.country as keyof typeof COUNTRIES] ?? l.country}</li>
              {l.pickup && <li className="flex items-center gap-2"><Package className="h-4 w-4 text-faint" /> Abholung möglich</li>}
              {l.shipping && (
                <li className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-faint" /> Versand möglich{l.shippingCostCents != null ? ` (${formatPrice(l.shippingCostCents)})` : ""}
                </li>
              )}
              <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-faint" /> Eingestellt {formatRelative(l.publishedAt)}</li>
              <li className="flex items-center gap-2"><Eye className="h-4 w-4 text-faint" /> {l.viewCount} Aufrufe</li>
            </ul>
          </div>

          {!isOwner && (
            <div className="flex justify-between px-1">
              <ReportButton targetType="listing" targetId={String(l.id)} label="Inserat melden" loggedIn={!!me} />
              <span className="text-xs text-faint">Anzeigen-Nr. {l.id}</span>
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display reveal mb-6 text-2xl font-bold uppercase">Ähnliche Felgen</h2>
          <ListingGrid>
            {similar.map((s, i) => (
              <ListingCard key={s.id} l={s} favorite={similarFavs.has(s.id)} index={i} />
            ))}
          </ListingGrid>
        </section>
      )}
    </div>
  );
}

function TitleBlock({ l, favorite }: { l: typeof listing.$inferSelect; favorite: boolean }) {
  const pcd = formatPcd(l.boltCount, l.boltCircle);
  const featured = l.featuredUntil && l.featuredUntil > new Date();
  return (
    <div className="card relative overflow-hidden p-5">
      {featured && <span className="badge mb-3 bg-red-solid text-white">TOP-Inserat</span>}
      <h1 className="text-xl font-bold leading-snug sm:text-2xl">{l.title}</h1>
      <p className="mt-2 text-sm text-muted">
        {[formatRimSize(l.width, l.diameter), l.et != null ? `ET${l.et}` : null, pcd, `${l.quantity} Stk.`].filter(Boolean).join(" · ")}
      </p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <span className="font-display text-4xl font-bold tracking-wide text-gradient-gold">{formatPrice(l.priceCents)}</span>
          <span className="ml-2 text-sm text-muted">{PRICE_TYPES[l.priceType]}</span>
          {l.quantity > 1 && <p className="text-xs text-faint">für {l.quantity} Stück</p>}
        </div>
        <div className="flex gap-2">
          <ShareButton title={l.title} />
          <FavoriteButton listingId={l.id} initial={favorite} variant="button" />
        </div>
      </div>
    </div>
  );
}
