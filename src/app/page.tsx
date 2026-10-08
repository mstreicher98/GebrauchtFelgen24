import { and, desc, eq, gt, sql } from "drizzle-orm";
import { ArrowRight, BadgeCheck, Bike, Car, MessageCircle, Search, ShieldCheck, Snowflake, Sparkles, Upload } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { listing, user, vehicleGeneration, vehicleMake } from "@/db/schema";
import { FitmentFinder } from "@/components/fitment-finder";
import { HeroRim } from "@/components/hero-rim";
import { ListingCard, ListingGrid } from "@/components/listing-card";
import { getFavoriteIds } from "@/lib/favorites";
import { listingCardColumns } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

async function getHomeData() {
  const base = db.select(listingCardColumns).from(listing).innerJoin(user, eq(user.id, listing.userId));
  const [featured, latest, [stats], [vehicles]] = await Promise.all([
    base
      .where(and(eq(listing.status, "aktiv"), gt(listing.featuredUntil, new Date())))
      .orderBy(sql`random()`)
      .limit(4),
    db
      .select(listingCardColumns)
      .from(listing)
      .innerJoin(user, eq(user.id, listing.userId))
      .where(eq(listing.status, "aktiv"))
      .orderBy(desc(listing.publishedAt))
      .limit(8),
    db.select({ n: sql<number>`count(*)::int` }).from(listing).where(eq(listing.status, "aktiv")),
    db
      .select({
        gens: sql<number>`(select count(*)::int from ${vehicleGeneration})`,
        makes: sql<number>`count(*)::int`,
      })
      .from(vehicleMake),
  ]);
  return { featured, latest, activeCount: stats.n, gens: vehicles.gens, makes: vehicles.makes };
}

const CATEGORIES = [
  { href: "/suche?typ=auto&art=felge", label: "Autofelgen", icon: Car, text: "Alu, Stahl & geschmiedet" },
  { href: "/suche?typ=auto&art=komplettrad", label: "Kompletträder", icon: Sparkles, text: "Felge + Reifen, sofort montiert" },
  { href: "/suche?typ=auto&saison=winter", label: "Winterräder", icon: Snowflake, text: "Für die kalte Jahreszeit" },
  { href: "/suche?typ=motorrad", label: "Motorrad", icon: Bike, text: "Vorder- & Hinterräder" },
];

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

export default async function HomePage() {
  const [me, data, popular] = await Promise.all([getCurrentUser(), getHomeData(), getPopularLinks()]);
  const favs = await getFavoriteIds(me?.id, [...data.featured, ...data.latest].map((l) => l.id));

  return (
    <>
      {/* HERO */}
      <section className="carbon relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-brand-fill-2/20 blur-3xl" />
        <div className="container-page relative grid items-center gap-10 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-muted backdrop-blur" style={{ animationDelay: "50ms" }}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green" />
              {data.activeCount.toLocaleString("de-AT")} aktive Inserate in AT · DE · CH
            </p>
            <h1 className="animate-rise font-display mt-5 text-[2.15rem] uppercase leading-[0.98] tracking-tight sm:text-5xl lg:text-[3.6rem] xl:text-[4rem]" style={{ animationDelay: "120ms" }}>
              <span className="text-chrome">Die richtige Felge.</span>
              <br />
              <span className="text-gradient-brand">Für dein Fahrzeug.</span>
            </h1>
            <p className="animate-rise mt-5 max-w-xl text-lg text-muted" style={{ animationDelay: "200ms" }}>
              Gebrauchte Felgen und Kompletträder für Auto und Motorrad kaufen und verkaufen. Wähle dein Fahrzeug, und wir zeigen dir nur, was
              wirklich passt: Lochkreis, Einpresstiefe, Mittenloch und Größe.
            </p>
            <div className="animate-rise mt-7 flex flex-wrap gap-3" style={{ animationDelay: "280ms" }}>
              <Link href="/suche" className="btn btn-brand group">
                <Search className="h-4 w-4" />
                Felgen durchsuchen
              </Link>
              <Link href="/inserat/neu" className="btn btn-outline group">
                Kostenlos verkaufen
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
          <HeroRim className="animate-rise-scale mx-auto w-[min(78vw,26rem)] lg:w-full lg:max-w-[30rem]" />
        </div>
      </section>

      {/* FITMENT FINDER */}
      <section className="container-page relative z-10 -mt-10 md:-mt-14">
        <div className="reveal">
          <h2 className="sr-only">Felgen für dein Fahrzeug finden</h2>
          <FitmentFinder />
        </div>
        {popular.length > 0 && (
          <div className="reveal mt-5 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-faint">Beliebt:</span>
            {popular.map((p) => (
              <Link key={p.href} href={p.href} className="chip">
                {p.label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* KATEGORIEN */}
      <section className="container-page mt-16">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.href}
              href={c.href}
              className="reveal card group relative overflow-hidden p-5 transition-all hover:border-brand"
              style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}
            >
              <c.icon className="h-7 w-7 text-brand transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
              <h3 className="font-display mt-4 text-lg font-semibold uppercase tracking-wide">{c.label}</h3>
              <p className="mt-1 text-sm text-muted">{c.text}</p>
              <ArrowRight className="absolute right-4 top-5 h-4 w-4 text-faint transition-all group-hover:translate-x-1 group-hover:text-brand" />
            </Link>
          ))}
        </div>
      </section>

      {/* TOP-INSERATE */}
      {data.featured.length > 0 && (
        <section className="container-page mt-16">
          <SectionTitle eyebrow="Hervorgehoben" title="Top-Inserate" href="/suche" />
          <ListingGrid>
            {data.featured.map((l, i) => (
              <ListingCard key={l.id} l={l} favorite={favs.has(l.id)} index={i} />
            ))}
          </ListingGrid>
        </section>
      )}

      {/* NEUESTE */}
      <section className="container-page mt-16">
        <SectionTitle eyebrow="Frisch eingestellt" title="Neueste Felgen" href="/suche" />
        {data.latest.length ? (
          <ListingGrid>
            {data.latest.map((l, i) => (
              <ListingCard key={l.id} l={l} favorite={favs.has(l.id)} index={i} priority={i < 2} />
            ))}
          </ListingGrid>
        ) : (
          <div className="card p-10 text-center text-muted">
            Noch keine Inserate. <Link className="link" href="/inserat/neu">Sei der Erste!</Link>
          </div>
        )}
      </section>

      {/* SO FUNKTIONIERT'S */}
      <section className="container-page mt-24">
        <div className="reveal text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">So einfach geht&apos;s</p>
          <h2 className="font-display mt-2 text-3xl font-bold uppercase sm:text-4xl">In drei Schritten zur neuen Felge</h2>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { icon: Search, t: "Fahrzeug wählen", d: `Über ${data.gens} Modelle von ${data.makes} Marken mit Lochkreis, Mittenloch, ET und Seriengrößen.` },
            { icon: BadgeCheck, t: "Passende Felgen finden", d: "Wir prüfen jedes Inserat gegen dein Fahrzeug – streng oder mit „eventuell passend“." },
            { icon: MessageCircle, t: "Direkt chatten", d: "Schreib dem Verkäufer im Chat. Deine Telefonnummer und E-Mail bleiben privat." },
          ].map((s, i) => (
            <div key={s.t} className="reveal card relative p-6" style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}>
              <span className="font-display absolute right-5 top-3 text-6xl font-bold text-surface-3">{i + 1}</span>
              <s.icon className="relative h-8 w-8 text-brand" />
              <h3 className="relative mt-4 text-lg font-semibold">{s.t}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VERKAUFEN CTA */}
      <section className="container-page mt-24">
        <div className="reveal streak relative overflow-hidden rounded-[1.75rem] border border-brand/30 bg-gradient-to-br from-surface-2 via-surface to-bg p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-3xl font-bold uppercase sm:text-4xl">
                Felgen im Keller? <span className="text-gradient-brand">Mach Geld daraus.</span>
              </h2>
              <p className="mt-3 max-w-2xl text-muted">
                Inserieren ist kostenlos. Lade bis zu 12 Fotos hoch, gib die Daten ein, und Käufer mit passendem Fahrzeug finden dich automatisch.
              </p>
              <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand" /> Kontakt nur über den Chat</li>
                <li className="flex items-center gap-2"><Upload className="h-4 w-4 text-brand" /> In 3 Minuten online</li>
                <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-brand" /> Privat & gewerblich</li>
              </ul>
            </div>
            <Link href="/inserat/neu" className="btn btn-brand h-14 px-8 text-base">
              Jetzt inserieren
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div className="reveal mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">{eyebrow}</p>
        <h2 className="font-display mt-1 text-2xl font-bold uppercase sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-muted hover:text-brand">
          Alle ansehen <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
