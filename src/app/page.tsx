import { and, asc, desc, eq, gt, gte, isNotNull, lte, sql } from "drizzle-orm";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CarFront,
  ChevronRight,
  ClipboardList,
  Globe2,
  MessageCircle,
  Store,
  Tag,
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { db } from "@/db";
import { listing, user } from "@/db/schema";
import { FitmentFinder } from "@/components/fitment-finder";
import { HeroRim } from "@/components/hero-rim";
import { HomeCarousel } from "@/components/home-carousel";
import { CategoryArt, type CategoryArtKind } from "@/components/home-category-art";
import { HomeSearch } from "@/components/home-search";
import { ListingCard, ListingGrid } from "@/components/listing-card";
import { getFavoriteIds } from "@/lib/favorites";
import { formatPcd } from "@/lib/format";
import { listingCardColumns } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

/* ------------------------------------------------------------------ */
/* Daten (alles serverseitig per SQL)                                  */
/* ------------------------------------------------------------------ */

const SIZES = [15, 16, 17, 18, 19, 20, 21];
const PCDS = ["5x112", "5x120", "5x114.3", "5x100", "4x100", "5x108"];

async function getHomeData() {
  const active = eq(listing.status, "aktiv");
  const auto = eq(listing.vehicleType, "auto");
  const cards = () => db.select(listingCardColumns).from(listing).innerJoin(user, eq(user.id, listing.userId));
  const n = sql<number>`count(*)::int`;

  const [featured, latest, [counts], sizes, pcds, brands, [platform]] = await Promise.all([
    cards()
      .where(and(active, gt(listing.featuredUntil, new Date())))
      .orderBy(sql`random()`)
      .limit(12),
    cards().where(active).orderBy(desc(listing.publishedAt), desc(listing.id)).limit(8),
    // Zählungen spiegeln exakt die Filter der verlinkten Suchen
    db
      .select({
        total: n,
        felge: sql<number>`(count(*) filter (where ${listing.vehicleType} = 'auto' and ${listing.kind} = 'felge'))::int`,
        komplettrad: sql<number>`(count(*) filter (where ${listing.kind} = 'komplettrad'))::int`,
        winter: sql<number>`(count(*) filter (where ${listing.season} = 'winter'))::int`,
        sommer: sql<number>`(count(*) filter (where ${listing.season} = 'sommer'))::int`,
        motorrad: sql<number>`(count(*) filter (where ${listing.vehicleType} = 'motorrad'))::int`,
        stahl: sql<number>`(count(*) filter (where ${listing.material} = 'stahl'))::int`,
      })
      .from(listing)
      .innerJoin(user, eq(user.id, listing.userId))
      .where(active),
    db
      .select({ zoll: listing.diameter, n })
      .from(listing)
      .innerJoin(user, eq(user.id, listing.userId))
      .where(and(active, auto, gte(listing.diameter, SIZES[0]), lte(listing.diameter, SIZES[SIZES.length - 1])))
      .groupBy(listing.diameter),
    db
      .select({ boltCount: listing.boltCount, boltCircle: listing.boltCircle, n })
      .from(listing)
      .innerJoin(user, eq(user.id, listing.userId))
      .where(and(active, isNotNull(listing.boltCount), isNotNull(listing.boltCircle)))
      .groupBy(listing.boltCount, listing.boltCircle),
    db
      .select({ brand: listing.rimBrand, n })
      .from(listing)
      .innerJoin(user, eq(user.id, listing.userId))
      .where(active)
      .groupBy(listing.rimBrand)
      .orderBy(desc(n), asc(listing.rimBrand))
      .limit(12),
    db.execute<{ generations: number; makes: number; dealers: number }>(sql`
      select
        (select count(*)::int from vehicle_generation) as generations,
        (select count(*)::int from vehicle_make) as makes,
        (select count(*)::int from "user" where account_type = 'haendler' and not banned) as dealers`),
  ]);

  const sizeCount = new Map(sizes.map((s) => [Number(s.zoll), s.n]));
  const pcdCount = new Map(pcds.map((p) => [formatPcd(p.boltCount, p.boltCircle), p.n]));
  return {
    featured,
    latest,
    counts,
    sizes: SIZES.map((z) => ({ zoll: z, n: sizeCount.get(z) ?? 0 })),
    pcds: PCDS.map((p) => ({ pcd: p, n: pcdCount.get(p) ?? 0 })),
    brands,
    platform,
  };
}

const POPULAR = [
  ["VW Golf VII", "Volkswagen", "Golf VII (5G)"],
  ["BMW 3er G20", "BMW", "3er (G20/G21)"],
  ["Audi A4 B9", "Audi", "A4 (B9/8W)"],
  ["Tesla Model 3", "Tesla", "Model 3"],
  ["Skoda Octavia IV", "Skoda", "Octavia IV (NX)"],
  ["Mercedes C W205", "Mercedes-Benz", "C-Klasse (W205)"],
  ["Yamaha MT-07", "Yamaha", "MT-07"],
  ["BMW R 1250 GS", "BMW Motorrad", "R 1250 GS"],
];

async function getPopularLinks() {
  const rows = await db.execute<{ id: number; mk: string; gn: string }>(sql`
    select g.id, mk.name as mk, g.name as gn from vehicle_generation g
    join vehicle_model m on m.id = g.model_id join vehicle_make mk on mk.id = m.make_id`);
  return POPULAR.map(([label, mk, gn]) => {
    const r = rows.find((x) => x.mk === mk && x.gn === gn);
    return r ? { label, href: `/suche?fahrzeug=${r.id}` } : null;
  }).filter((x): x is { label: string; href: string } => !!x);
}

/** Ganze Zahlen mit Punkt als Tausendertrennzeichen („1.234 Angebote“) */
const int = new Intl.NumberFormat("de-DE");
const offers = (n: number) => `${int.format(n)} ${n === 1 ? "Angebot" : "Angebote"}`;
const brandLabel = (b: string) => (b === "Original (OEM)" ? "Originalfelgen" : b);

/* ------------------------------------------------------------------ */
/* Seite                                                               */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  const [me, data, popular] = await Promise.all([getCurrentUser(), getHomeData(), getPopularLinks()]);
  const favs = await getFavoriteIds(me?.id, [...data.featured, ...data.latest].map((l) => l.id));
  const { counts, platform } = data;

  const categories: { kind: CategoryArtKind; label: string; href: string; n: number }[] = [
    { kind: "felge", label: "Autofelgen", href: "/suche?typ=auto&art=felge", n: counts.felge },
    { kind: "komplettrad", label: "Kompletträder", href: "/suche?art=komplettrad", n: counts.komplettrad },
    { kind: "winter", label: "Winterräder", href: "/suche?saison=winter", n: counts.winter },
    { kind: "sommer", label: "Sommerräder", href: "/suche?saison=sommer", n: counts.sommer },
    { kind: "motorrad", label: "Motorradfelgen", href: "/suche?typ=motorrad", n: counts.motorrad },
    { kind: "stahl", label: "Stahlfelgen", href: "/suche?material=stahl", n: counts.stahl },
  ];

  return (
    <>
      {/* 1 · HERO-SUCHMASKE */}
      <section
        aria-labelledby="hero-title"
        className="relative overflow-hidden bg-[linear-gradient(125deg,var(--brand-fill-2)_0%,color-mix(in_oklab,var(--brand-fill-2)_62%,black)_58%,color-mix(in_oklab,var(--brand-fill-2)_30%,black)_100%)] text-on-brand"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_28rem_at_85%_0%,rgb(255_255_255/0.13),transparent_70%)]" />
        <div className="container-page relative grid gap-12 pb-10 pt-8 sm:pb-14 sm:pt-12 lg:grid-cols-[minmax(0,1fr)_13rem] lg:items-center lg:pb-16 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="min-w-0">
            <h1 id="hero-title" className="font-display text-[1.875rem] uppercase leading-[1.05] tracking-tight sm:text-[2.75rem] lg:text-5xl">
              Gebrauchte Felgen &amp; Kompletträder
            </h1>
            <p className="mt-3 max-w-2xl text-base text-on-brand/80 sm:text-lg">
              <strong className="font-semibold text-on-brand">{offers(counts.total)}</strong> von Privat und Händlern in Österreich,
              Deutschland und der Schweiz – mit Passungsprüfung für dein Fahrzeug.
            </p>
            <HomeSearch initialTotal={counts.felge} className="mt-6 sm:mt-8" />
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute inset-[6%] rounded-full bg-on-brand/[0.07] ring-1 ring-on-brand/10" />
            <HeroRim className="relative w-full" />
          </div>
        </div>
      </section>

      {/* 2 · KATEGORIEN */}
      <section aria-labelledby="kat-title" className="container-page mt-10 sm:mt-14">
        <SectionHeader id="kat-title" title="Kategorien" sub="Felgen und Räder für jeden Einsatz" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
          {categories.map((c) => (
            <li key={c.kind}>
              <Link
                href={c.href}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-[border-color,box-shadow] duration-300 hover:border-brand hover:shadow-card-hover"
              >
                <span className="flex h-24 items-center justify-center bg-surface-2 sm:h-32">
                  <CategoryArt
                    kind={c.kind}
                    className="h-[4.25rem] w-[4.25rem] transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-105 sm:h-[5.5rem] sm:w-[5.5rem]"
                  />
                </span>
                <span className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
                  <span className="min-w-0">
                    <span className="block truncate text-[0.9375rem] font-semibold leading-5 group-hover:text-brand">{c.label}</span>
                    <span className="mt-0.5 block text-xs text-muted sm:text-[0.8125rem]">{offers(c.n)}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 · TOP-ANGEBOTE */}
      {data.featured.length > 0 && (
        <section aria-labelledby="top-title" className="container-page mt-12 sm:mt-16">
          <SectionHeader id="top-title" title="Top-Angebote" sub="Hervorgehobene Inserate" href="/suche" />
          <HomeCarousel label="Top-Angebote">
            {data.featured.map((l, i) => (
              <ListingCard key={l.id} l={l} favorite={favs.has(l.id)} index={i} />
            ))}
          </HomeCarousel>
        </section>
      )}

      {/* 4 · FELGEN NACH GRÖSSE */}
      <section aria-labelledby="groesse-title" className="container-page mt-12 sm:mt-16">
        <SectionHeader id="groesse-title" title="Felgen nach Größe" sub="Direkt zur passenden Zollgröße oder zum Lochkreis" />
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-6">
          <h3 className="text-sm font-semibold text-muted">Zollgröße</h3>
          <ul className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-3">
            {data.sizes.map((s) => (
              <li key={s.zoll}>
                <Link
                  href={`/suche?typ=auto&zoll=${s.zoll}`}
                  className="group flex h-full flex-col items-center justify-center rounded-xl border border-transparent bg-surface-2 px-1 py-3.5 text-center transition-colors hover:border-brand hover:bg-brand-soft sm:py-5"
                >
                  <span className="font-display text-2xl leading-none group-hover:text-brand sm:text-[2rem]">
                    {s.zoll}
                    <span className="text-brand">″</span>
                  </span>
                  <span className={clsx("mt-1.5 whitespace-nowrap text-[0.6875rem] sm:text-xs", s.n ? "text-muted" : "text-faint")}>
                    {s.n ? offers(s.n) : "keine"}
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/suche?typ=auto"
                className="group flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-1 py-3.5 text-center transition-colors hover:border-brand hover:bg-brand-soft sm:py-5"
              >
                <span className="text-sm font-semibold group-hover:text-brand">Alle</span>
                <span className="mt-1.5 text-[0.6875rem] text-muted sm:text-xs">Größen</span>
              </Link>
            </li>
          </ul>
          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
            <h3 className="shrink-0 text-sm font-semibold text-muted sm:w-24">Lochkreis</h3>
            <ul className="flex flex-wrap gap-2">
              {data.pcds.map((p) => (
                <li key={p.pcd}>
                  <Link href={`/suche?lk=${p.pcd}`} className="chip tabular-nums">
                    <span className="font-semibold text-fg">{p.pcd}</span>
                    <span className="text-faint">· {int.format(p.n)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5 · NEUESTE ANGEBOTE */}
      <section aria-labelledby="neu-title" className="container-page mt-12 sm:mt-16">
        <SectionHeader id="neu-title" title="Neueste Angebote" sub="Frisch eingestellt" href="/suche" />
        {data.latest.length ? (
          <>
            <ListingGrid>
              {data.latest.map((l, i) => (
                // Handy: 4 Karten (kürzere Seite), lg mit 3 Spalten: 6 – so bleibt keine Reihe halb leer
                <div key={l.id} className={clsx("contents", i >= 4 && "max-sm:hidden", i >= 6 && "lg:max-xl:hidden")}>
                  <ListingCard l={l} favorite={favs.has(l.id)} index={i} />
                </div>
              ))}
            </ListingGrid>
            <div className="mt-6 flex justify-center sm:mt-8">
              <Link href="/suche" className="btn btn-outline group w-full sm:w-auto sm:px-8">
                Alle {offers(counts.total)} ansehen
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          </>
        ) : (
          <div className="card p-10 text-center text-muted">
            Noch keine Angebote.{" "}
            <Link className="link" href="/inserat/neu">
              Stell das erste ein!
            </Link>
          </div>
        )}
      </section>

      {/* 6 · BELIEBTE FELGENMARKEN */}
      {data.brands.length > 0 && (
        <section aria-labelledby="marken-title" className="container-page mt-12 sm:mt-16">
          <SectionHeader id="marken-title" title="Beliebte Felgenmarken" sub="Von Originalfelgen bis Premium-Schmiedefelge" />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
            {data.brands.map((b) => (
              <li key={b.brand}>
                <Link
                  href={`/suche?q=${encodeURIComponent(b.brand)}`}
                  className="group flex h-full flex-col items-center justify-center rounded-2xl border border-line bg-surface px-3 py-5 text-center shadow-card transition-[border-color,box-shadow] duration-300 hover:border-brand hover:shadow-card-hover sm:py-6"
                >
                  <span className="font-display block max-w-full truncate text-base uppercase leading-tight tracking-wide group-hover:text-brand sm:text-lg">
                    {brandLabel(b.brand)}
                  </span>
                  <span className="mt-1 text-xs text-muted sm:text-[0.8125rem]">{offers(b.n)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 7 · KONFIGURATOR */}
      <section aria-labelledby="konf-title" id="konfigurator" className="mt-14 scroll-mt-24 border-y border-line bg-brand-soft sm:mt-20">
        <div className="container-page grid gap-8 py-10 sm:py-14 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:items-center xl:gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Felgen-Konfigurator</p>
            <h2 id="konf-title" className="font-display mt-2 text-[1.625rem] uppercase leading-tight sm:text-[2rem]">
              Welche Felgen passen auf mein Auto?
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Wir kennen Lochkreis, Mittenloch, Einpresstiefe und Seriengrößen von {int.format(platform.generations)} Fahrzeugmodellen
              aus {int.format(platform.makes)} Marken – und zeigen dir nur Felgen, die wirklich passen.
            </p>
            <ol className="mt-6 flex items-center gap-1.5 text-[0.8125rem] font-semibold sm:gap-2 sm:text-sm">
              {["Marke", "Modell", "Baureihe"].map((s, i) => (
                <li key={s} className="flex items-center gap-1.5 sm:gap-2">
                  {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-faint" aria-hidden />}
                  <span className="flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface py-1 pl-1 pr-3 shadow-card sm:pr-3.5">
                    <span className="font-display flex h-6 w-6 items-center justify-center rounded-full bg-brand-fill text-xs text-on-brand">
                      {i + 1}
                    </span>
                    {s}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="min-w-0">
            <FitmentFinder />
            {popular.length > 0 && (
              <div className="scrollbar-none mt-4 flex items-center gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] sm:flex-wrap sm:overflow-visible sm:[mask-image:none]">
                <span className="mr-1 shrink-0 text-sm text-muted">Beliebt:</span>
                {popular.map((p) => (
                  <Link key={p.href} href={p.href} className="chip shrink-0">
                    {p.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 8 · VERKAUFEN */}
      <section aria-labelledby="verkaufen-title" className="container-page mt-14 sm:mt-20">
        <div className="grid overflow-hidden rounded-2xl border border-line bg-surface shadow-card xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="relative bg-[linear-gradient(135deg,var(--brand-fill-2),color-mix(in_oklab,var(--brand-fill-2)_55%,black))] p-6 text-on-brand sm:p-8 xl:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-on-brand/75">Verkaufen</p>
            <h2 id="verkaufen-title" className="font-display mt-2 text-[1.625rem] uppercase leading-tight sm:text-[2rem]">
              Felgen verkaufen&nbsp;– kostenlos
            </h2>
            <p className="mt-3 max-w-md text-on-brand/80">
              Inserat in wenigen Minuten erstellen. Käufer mit passendem Fahrzeug finden dich automatisch.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href="/inserat/neu"
                className="btn group bg-on-brand px-6 text-brand-fill-2 shadow-sm hover:bg-on-brand/90"
              >
                Kostenlos inserieren
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              <Link href="/registrieren?typ=haendler" className="text-sm font-semibold text-on-brand/90 underline-offset-4 hover:underline">
                Für Händler
              </Link>
            </div>
          </div>
          <ol className="grid content-center gap-5 p-6 sm:grid-cols-3 sm:gap-6 sm:p-8 xl:p-10">
            {[
              { icon: Camera, t: "Fotos hochladen", d: "Bis zu 12 Bilder – am besten bei Tageslicht und mit Detailaufnahmen." },
              { icon: ClipboardList, t: "Daten eingeben", d: "Zoll, Breite, ET und Lochkreis – die Passung prüfen wir automatisch." },
              { icon: MessageCircle, t: "Anfragen erhalten", d: "Käufer schreiben dir im Chat. Telefon und E-Mail bleiben privat." },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4 sm:block">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 sm:mt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand">Schritt {i + 1}</p>
                  <h3 className="mt-1 font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 9 · VERTRAUENS-ZAHLEN */}
      <section aria-labelledby="zahlen-title" className="container-page mb-16 mt-12 sm:mb-20 sm:mt-16">
        <h2 id="zahlen-title" className="sr-only">
          GebrauchtFelgen24 in Zahlen
        </h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
          {[
            { icon: Tag, value: int.format(counts.total), label: "aktive Angebote" },
            { icon: CarFront, value: int.format(platform.generations), label: "Fahrzeugmodelle in der Datenbank" },
            { icon: Store, value: int.format(platform.dealers), label: platform.dealers === 1 ? "Händler" : "Händler an Bord" },
            { icon: Globe2, value: "3", label: "Länder: AT · DE · CH" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col-reverse items-center justify-end bg-surface px-3 py-6 text-center sm:py-8">
              <dt className="mt-2 text-sm text-muted">{s.label}</dt>
              <dd className="flex flex-col items-center gap-3">
                <s.icon className="h-6 w-6 text-brand" aria-hidden />
                <span className="font-display text-3xl leading-none sm:text-4xl">{s.value}</span>
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-balance text-center text-sm text-muted">
          <BadgeCheck className="mr-1.5 inline-block h-4 w-4 align-[-0.1875rem] text-brand" aria-hidden />
          Kostenlos für Käufer und Verkäufer&nbsp;· Kontakt nur über den sicheren Chat
        </p>
      </section>
    </>
  );
}

function SectionHeader({ id, title, sub, href }: { id: string; title: string; sub?: string; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 sm:mb-6">
      <div className="min-w-0">
        <h2 id={id} className="font-display text-[1.375rem] uppercase leading-tight sm:text-[1.75rem]">
          {title}
        </h2>
        {sub && <p className="mt-1 text-sm text-muted sm:text-[0.9375rem]">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="group flex shrink-0 items-center gap-1 pb-0.5 text-sm font-semibold text-brand">
          Alle ansehen
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </div>
  );
}
