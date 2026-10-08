import { CarFront, CircleAlert, Info, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FitmentFinder } from "@/components/fitment-finder";
import { ListingCard, ListingGrid } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { FitModeToggle, SaveSearchButton, SortSelect } from "@/components/search-controls";
import { FilterSidebar, MobileFilterButton } from "@/components/search-filters";
import { getFavoriteIds } from "@/lib/favorites";
import { describeFilters, filtersToParams, parseFilters } from "@/lib/filters";
import { formatNumber, formatPcd, yearRange } from "@/lib/format";
import { searchListings } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";
import { getGeneration } from "@/lib/vehicles";

export async function generateMetadata(props: PageProps<"/suche">): Promise<Metadata> {
  const f = parseFilters(await props.searchParams);
  const gen = f.fahrzeug ? await getGeneration(f.fahrzeug) : null;
  const title = gen ? `Felgen für ${gen.fullName}` : `${describeFilters(f)} – gebraucht kaufen`;
  return { title, description: `Gebrauchte ${gen ? `Felgen und Kompletträder passend für ${gen.fullName}` : "Felgen und Kompletträder"} in Österreich, Deutschland und der Schweiz.` };
}

export default async function SearchPage(props: PageProps<"/suche">) {
  const f = parseFilters(await props.searchParams);
  const [me, res] = await Promise.all([getCurrentUser(), searchListings(f)]);
  const favs = await getFavoriteIds(me?.id, res.items.map((i) => i.id));
  const gen = res.gen;
  const pageHref = (p: number) => `/suche?${filtersToParams({ ...f, seite: p })}`;

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase sm:text-4xl">
            {gen ? (
              <>
                Felgen für <span className="text-gradient-gold">{gen.fullName}</span>
              </>
            ) : (
              "Felgen finden"
            )}
          </h1>
          <p className="mt-1 text-muted">
            {res.total.toLocaleString("de-AT")} {res.total === 1 ? "Inserat" : "Inserate"}
            {res.origin && f.umkreis ? ` im Umkreis von ${f.umkreis} km um ${f.plz} ${res.origin.place}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense>
            <MobileFilterButton hasVehicle={!!gen} vehicleType={gen?.type} />
            <SaveSearchButton />
            <SortSelect hasOrigin={!!res.origin} />
          </Suspense>
        </div>
      </div>

      {gen ? (
        <div className="card reveal mb-6 overflow-hidden">
          <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gold">
                {gen.type === "auto" ? "Dein Auto" : "Dein Motorrad"}
                <Link href="/suche" className="text-faint hover:text-red" aria-label="Fahrzeug entfernen">
                  <X className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="mt-1 font-semibold">
                {gen.fullName} <span className="font-normal text-muted">{yearRange(gen.yearFrom, gen.yearTo)}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                {gen.type === "auto" ? (
                  <>
                    <span className="badge">LK {formatPcd(gen.boltCount, gen.boltCircle)}</span>
                    {gen.centerBore && <span className="badge">ML {formatNumber(gen.centerBore)} mm</span>}
                    {gen.etMin != null && <span className="badge">ET {gen.etMin}–{gen.etMax}</span>}
                    {gen.diameterMin && <span className="badge">{gen.diameterMin}–{gen.diameterMax} Zoll</span>}
                    {gen.thread && <span className="badge">{gen.thread} {gen.fastener}</span>}
                  </>
                ) : (
                  gen.specs.map((s) => (
                    <span key={s.id} className="badge">
                      {s.position === "vorne" ? "Vorne" : s.position === "hinten" ? "Hinten" : ""} {s.width ? `${formatNumber(s.width)}x` : ""}
                      {formatNumber(s.diameter)} {s.tireSize}
                    </span>
                  ))
                )}
              </div>
            </div>
            <Suspense>
              <FitModeToggle />
            </Suspense>
          </div>
          <div className="flex items-start gap-2 border-t border-line bg-surface-2/50 px-4 py-2.5 text-xs text-muted sm:px-5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
            {gen.type === "auto"
              ? "Geprüft werden Lochkreis, Mittenloch, Zollgröße, Breite und Einpresstiefe gegen die Serienwerte. Angaben ohne Gewähr – maßgeblich sind Fahrzeugpapiere und Felgengutachten."
              : "Motorradfelgen passen meist nur modellspezifisch. „Nur passende“ zeigt Felgen, die der Verkäufer für dein Modell angegeben hat."}
          </div>
        </div>
      ) : (
        <details className="card reveal mb-6 overflow-hidden" open={res.total === 0 || undefined}>
          <summary className="cursor-pointer list-none px-5 py-4 font-semibold marker:hidden">
            <span className="inline-flex items-center gap-2">
              <CarFront className="h-5 w-5 text-gold" /> Nach Fahrzeug filtern: nur Felgen, die wirklich passen
            </span>
          </summary>
          <div className="border-t border-line p-1">
            <FitmentFinder compact />
          </div>
        </details>
      )}

      <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:block" aria-label="Filter">
          <Suspense>
            <FilterSidebar hasVehicle={!!gen} vehicleType={gen?.type} />
          </Suspense>
        </aside>
        <div>
          {res.items.length > 0 ? (
            <ListingGrid cols={3}>
              {res.items.map((l, i) => (
                <ListingCard key={l.id} l={l} favorite={favs.has(l.id)} index={i} priority={i < 3} headingLevel={2} />
              ))}
            </ListingGrid>
          ) : (
            <div className="card animate-fade-up flex flex-col items-center p-10 text-center">
              <CircleAlert className="h-10 w-10 text-gold" />
              <h2 className="mt-4 text-lg font-semibold">Keine passenden Inserate gefunden</h2>
              <p className="mt-2 max-w-md text-sm text-muted">
                {gen && f.modus === "streng"
                  ? "Versuche „Auch eventuell passende“ oder speichere die Suche – wir melden uns, sobald etwas Passendes eingestellt wird."
                  : "Passe die Filter an oder speichere die Suche als Suchauftrag."}
              </p>
            </div>
          )}
          <Pagination page={f.seite} pages={res.pages} makeHref={pageHref} />
        </div>
      </div>
    </div>
  );
}
