import "server-only";
import { and, asc, desc, eq, gte, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { listing, listingFitment, listingImage, postalCode, user, vehicleWheelSpec } from "@/db/schema";
import { PAGE_SIZE } from "./constants";
import { checkFitment, LOOSE_TOLERANCE, type FitResult } from "./fitment";
import type { SearchFilters } from "./filters";
import { getGeneration, toFitGeneration, type GenerationWithContext } from "./vehicles";

export async function lookupPostalCode(zip: string, country?: string) {
  const rows = await db
    .select()
    .from(postalCode)
    .where(country ? and(eq(postalCode.zip, zip), eq(postalCode.country, country)) : eq(postalCode.zip, zip))
    .limit(1);
  return rows[0] ?? null;
}

const between = (col: SQL | AnyPgColumn, min: number | null, max: number | null, tol = 0) => {
  const parts: SQL[] = [];
  if (min != null) parts.push(sql`${col} >= ${min - tol}`);
  if (max != null) parts.push(sql`${col} <= ${max + tol}`);
  return parts.length ? and(...parts)! : sql`true`;
};

/** SQL-Bedingung „passt auf Fahrzeug" – spiegelt die Logik aus fitment.ts. */
function fitmentCondition(gen: NonNullable<GenerationWithContext>, mode: "streng" | "locker", pos?: "vorne" | "hinten") {
  const explicit = sql`exists (select 1 from ${listingFitment} lf where lf.listing_id = ${listing.id} and lf.generation_id = ${gen.id})`;

  if (gen.type === "motorrad") {
    if (mode === "streng") return explicit;
    const posCond = pos ? sql`and (s.position = 'alle' or s.position = ${pos})` : sql``;
    const sameSize = sql`exists (select 1 from ${vehicleWheelSpec} s where s.generation_id = ${gen.id} ${posCond}
      and s.diameter = ${listing.diameter} and (s.width is null or s.width = ${listing.width}))`;
    return or(explicit, sameSize)!;
  }

  const pcd =
    gen.boltCount && gen.boltCircle
      ? and(eq(listing.boltCount, gen.boltCount), eq(listing.boltCircle, gen.boltCircle))!
      : sql`true`;
  const cbOk =
    gen.centerBore != null ? sql`(${listing.centerBore} is null or ${listing.centerBore} >= ${gen.centerBore - 0.05})` : sql`true`;

  if (mode === "streng") {
    const cbStrict =
      gen.centerBore != null
        ? sql`(${listing.centerBore} is not null and ${listing.centerBore} >= ${gen.centerBore - 0.05})`
        : sql`true`;
    return or(
      and(
        pcd,
        cbStrict,
        between(listing.diameter, gen.diameterMin, gen.diameterMax),
        between(listing.width, gen.widthMin, gen.widthMax),
        sql`${listing.et} is not null`,
        between(listing.et, gen.etMin, gen.etMax),
      ),
      and(explicit, pcd, cbOk),
    )!;
  }

  return or(
    and(
      pcd,
      cbOk,
      between(listing.diameter, gen.diameterMin, gen.diameterMax, LOOSE_TOLERANCE.diameter),
      between(listing.width, gen.widthMin, gen.widthMax, LOOSE_TOLERANCE.width),
      or(sql`${listing.et} is null`, between(listing.et, gen.etMin, gen.etMax, LOOSE_TOLERANCE.et)),
    ),
    and(explicit, cbOk),
  )!;
}

export async function buildConditions(f: SearchFilters, opts: { includeInactive?: boolean } = {}) {
  const conds: SQL[] = [];
  if (!opts.includeInactive) conds.push(eq(listing.status, "aktiv"));

  let gen: GenerationWithContext | null = null;
  if (f.fahrzeug) {
    gen = await getGeneration(f.fahrzeug);
    if (gen) {
      conds.push(eq(listing.vehicleType, gen.type));
      conds.push(fitmentCondition(gen, f.modus, f.pos));
    }
  }
  if (f.typ && !gen) conds.push(eq(listing.vehicleType, f.typ));
  if (f.art) conds.push(eq(listing.kind, f.art));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(
      or(
        sql`to_tsvector('german', ${listing.title} || ' ' || ${listing.rimBrand} || ' ' || coalesce(${listing.rimModel}, '')) @@ websearch_to_tsquery('german', ${f.q})`,
        sql`${listing.title} ilike ${like}`,
        sql`${listing.rimBrand} ilike ${like}`,
        sql`${listing.rimModel} ilike ${like}`,
      )!,
    );
  }
  if (f.zoll) conds.push(inArray(listing.diameter, f.zoll));
  if (f.breiteMin != null) conds.push(gte(listing.width, f.breiteMin));
  if (f.breiteMax != null) conds.push(lte(listing.width, f.breiteMax));
  if (f.lk) conds.push(and(eq(listing.boltCount, f.lk.boltCount), eq(listing.boltCircle, f.lk.boltCircle))!);
  if (f.etMin != null) conds.push(gte(listing.et, f.etMin));
  if (f.etMax != null) conds.push(lte(listing.et, f.etMax));
  if (f.material) conds.push(inArray(listing.material, f.material as never[]));
  if (f.zustand) conds.push(inArray(listing.condition, f.zustand as never[]));
  if (f.saison) conds.push(inArray(listing.season, f.saison as never[]));
  if (f.preisMin != null) conds.push(gte(listing.priceCents, Math.round(f.preisMin * 100)));
  if (f.preisMax != null) conds.push(lte(listing.priceCents, Math.round(f.preisMax * 100)));
  if (f.versand) conds.push(eq(listing.shipping, true));
  if (f.anbieter) conds.push(eq(user.accountType, f.anbieter));
  if (f.pos && gen?.type !== "motorrad") conds.push(or(eq(listing.wheelPosition, f.pos), eq(listing.wheelPosition, "alle"))!);

  let origin: { lat: number; lng: number; place: string } | null = null;
  if (f.plz) {
    const pc = await lookupPostalCode(f.plz, f.land);
    if (pc) {
      origin = { lat: pc.lat, lng: pc.lng, place: pc.place };
      if (f.umkreis) conds.push(sql`${distanceSql(origin)} <= ${f.umkreis}`);
    }
  }
  return { conds, gen, origin };
}

function distanceSql(o: { lat: number; lng: number }) {
  // Haversine in km
  return sql`(6371 * acos(least(1, greatest(-1,
    cos(radians(${o.lat})) * cos(radians(${listing.lat})) * cos(radians(${listing.lng}) - radians(${o.lng}))
    + sin(radians(${o.lat})) * sin(radians(${listing.lat}))))))`;
}

export const listingCardColumns = {
  id: listing.id,
  title: listing.title,
  kind: listing.kind,
  vehicleType: listing.vehicleType,
  material: listing.material,
  rimBrand: listing.rimBrand,
  diameter: listing.diameter,
  width: listing.width,
  boltCount: listing.boltCount,
  boltCircle: listing.boltCircle,
  et: listing.et,
  centerBore: listing.centerBore,
  quantity: listing.quantity,
  wheelPosition: listing.wheelPosition,
  condition: listing.condition,
  hasCertificate: listing.hasCertificate,
  season: listing.season,
  tireSize: listing.tireSize,
  priceCents: listing.priceCents,
  priceType: listing.priceType,
  shipping: listing.shipping,
  zip: listing.zip,
  city: listing.city,
  country: listing.country,
  status: listing.status,
  featuredUntil: listing.featuredUntil,
  publishedAt: listing.publishedAt,
  sellerType: user.accountType,
  sellerCompany: user.companyName,
  imageKey: sql<string | null>`(select ${listingImage.key} from ${listingImage} where ${listingImage.listingId} = ${listing.id} order by ${listingImage.position} limit 1)`,
  imageCount: sql<number>`(select count(*)::int from ${listingImage} where ${listingImage.listingId} = ${listing.id})`,
};

export type ListingCardData = Awaited<ReturnType<typeof searchListings>>["items"][number];

export async function searchListings(f: SearchFilters, pageSize = PAGE_SIZE) {
  const { conds, gen, origin } = await buildConditions(f);
  const where = and(...conds);

  const distance = origin ? distanceSql(origin) : null;
  const featuredFirst = sql`(${listing.featuredUntil} is not null and ${listing.featuredUntil} > now()) desc`;
  const order: SQL[] = [featuredFirst];
  if (f.sort === "preis_auf") order.push(asc(listing.priceCents));
  else if (f.sort === "preis_ab") order.push(desc(listing.priceCents));
  else if (f.sort === "entfernung" && distance) order.push(sql`${distance} asc nulls last`);
  order.push(desc(listing.publishedAt), desc(listing.id));

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        ...listingCardColumns,
        distanceKm: distance ? sql<number | null>`round((${distance})::numeric, 0)::int` : sql<number | null>`null::int`,
        explicitFit: gen
          ? sql<boolean>`exists (select 1 from ${listingFitment} lf where lf.listing_id = ${listing.id} and lf.generation_id = ${gen.id})`
          : sql<boolean>`false`,
      })
      .from(listing)
      .innerJoin(user, eq(user.id, listing.userId))
      .where(where)
      .orderBy(...order)
      .limit(pageSize)
      .offset((f.seite - 1) * pageSize),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(listing)
      .innerJoin(user, eq(user.id, listing.userId))
      .where(where),
  ]);

  const fitGen = gen ? toFitGeneration(gen) : null;
  const items = rows.map((r) => {
    let fit: FitResult | null = null;
    if (fitGen) {
      fit = checkFitment(fitGen, {
        vehicleType: r.vehicleType,
        kind: r.kind,
        boltCount: r.boltCount,
        boltCircle: r.boltCircle,
        centerBore: r.centerBore,
        diameter: r.diameter,
        width: r.width,
        et: r.et,
        tireSize: r.tireSize,
        wheelPosition: r.wheelPosition,
        explicitFit: r.explicitFit,
      });
    }
    return { ...r, fit };
  });

  return { items, total, gen, origin, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Prüft für gespeicherte Suchen, welche neuen Inserate (seit `since`) passen. */
export async function findNewMatches(f: SearchFilters, since: Date, limit = 5) {
  const { conds } = await buildConditions({ ...f, seite: 1 });
  conds.push(sql`${listing.publishedAt} > ${since}`);
  const where = and(...conds);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select(listingCardColumns)
      .from(listing)
      .innerJoin(user, eq(user.id, listing.userId))
      .where(where)
      .orderBy(desc(listing.publishedAt))
      .limit(limit),
    db.select({ total: sql<number>`count(*)::int` }).from(listing).innerJoin(user, eq(user.id, listing.userId)).where(where),
  ]);
  return { rows, total };
}
