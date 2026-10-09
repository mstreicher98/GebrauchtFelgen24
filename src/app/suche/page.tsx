import { Bike, CarFront, ChevronDown, Info, SearchX, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FitmentFinder } from "@/components/fitment-finder";
import { ListingCard, ListingGrid, ListingList } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { FitModeToggle, SaveSearchButton, SortSelect } from "@/components/search-controls";
import { FilterSidebar, MobileFilterButton } from "@/components/search-filters";
import { ActiveFilters, QuickFilters, searchHref } from "@/components/search-quick-filters";
import { SearchBreadcrumbs, ViewToggle, type Crumb } from "@/components/search-toolbar";
import { PAGE_SIZE } from "@/lib/constants";
import { getFavoriteIds } from "@/lib/favorites";
import { describeFilters, filtersToParams, parseFilters, type SearchFilters } from "@/lib/filters";
import { formatNumber, formatPcd, yearRange, formatCount } from "@/lib/format";
import { searchListings } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";
import { getGeneration } from "@/lib/vehicles";

/** Überschrift passend zur Kategorie (Kopf-Navigation verlinkt auf diese Kombinationen). */
function headline(f: SearchFilters) {
  const onlySeason = f.saison?.length === 1 ? f.saison[0] : null;
  if (f.typ === "motorrad") return f.art === "komplettrad" ? "Motorrad-Kompletträder kaufen" : "Motorradfelgen kaufen";
  if (onlySeason === "winter") return "Winterräder kaufen";
  if (onlySeason === "sommer") return "Sommerräder kaufen";
  if (f.art === "komplettrad") return "Kompletträder kaufen";
  if (f.typ === "auto") return "Autofelgen kaufen";
  return "Felgen kaufen";
}

export async function generateMetadata(props: PageProps<"/suche">): Promise<Metadata> {
  const f = parseFilters(await props.searchParams);
  const gen = f.fahrzeug ? await getGeneration(f.fahrzeug) : null;
  const title = gen ? `Felgen für ${gen.fullName}` : `${describeFilters(f)} – gebraucht kaufen`;
  return {
    title,
    description: `Gebrauchte ${gen ? `Felgen und Kompletträder passend für ${gen.fullName}` : "Felgen und Kompletträder"} in Österreich, Deutschland und der Schweiz.`,
  };
}

export default async function SearchPage(props: PageProps<"/suche">) {
  const f = parseFilters(await props.searchParams);
  const [me, res] = await Promise.all([getCurrentUser(), searchListings(f)]);
  const favs = await getFavoriteIds(me?.id, res.items.map((i) => i.id));
  const gen = res.gen;
  const view = f.ansicht === "liste" ? "list" : "grid";
  const pageHref = (p: number) => {
    const qs = filtersToParams({ ...f, seite: p }).toString();
    return qs ? `/suche?${qs}` : "/suche";
  };
  // Seite existiert nicht (mehr), z. B. nach Filteränderung oder veraltetem Link → letzte vorhandene Seite
  if (res.total > 0 && res.items.length === 0 && f.seite > res.pages) redirect(pageHref(res.pages));
  const viewHref = (ansicht: SearchFilters["ansicht"]) => {
    const qs = filtersToParams({ ...f, ansicht }).toString();
    return qs ? `/suche?${qs}` : "/suche";
  };

  const title = headline(f);
  const crumbs: Crumb[] = [{ label: "Startseite", href: "/" }];
  if (gen) crumbs.push({ label: "Felgen kaufen", href: "/suche" }, { label: gen.fullName });
  else if (title !== "Felgen kaufen") crumbs.push({ label: "Felgen kaufen", href: "/suche" }, { label: title.replace(/ kaufen$/, "") });
  else crumbs.push({ label: "Felgen kaufen" });

  const first = res.total === 0 ? 0 : (f.seite - 1) * PAGE_SIZE + 1;
  const last = (f.seite - 1) * PAGE_SIZE + res.items.length;
  const unit = res.total === 1 ? "Angebot" : "Angebote";
  const cards = res.items.map((l, i) => (
    <ListingCard key={l.id} l={l} favorite={favs.has(l.id)} index={i} priority={i < (view === "list" ? 2 : 3)} headingLevel={2} layout={view} />
  ));

  return (
    <div className="container-page pb-12 pt-4 sm:pt-6">
      <SearchBreadcrumbs items={crumbs} />

      {/* Kopf: Überschrift + Trefferzahl */}
      <header className="mt-3 flex items-start justify-between gap-4 sm:items-end sm:gap-6">
        <div className="min-w-0">
          <h1 className="font-display text-[1.75rem] uppercase leading-tight sm:text-4xl">
            {gen ? (
              <>
                Felgen für <span className="text-brand">{gen.fullName}</span>
              </>
            ) : (
              title
            )}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            <span className="mr-1.5 font-display text-2xl leading-none text-fg tabular-nums">{formatCount(res.total)}</span>
            {unit}
            {res.origin && f.umkreis ? (
              ` im Umkreis von ${f.umkreis} km um ${f.plz} ${res.origin.place}`
            ) : (
              <span className="hidden sm:inline"> in Österreich, Deutschland und der Schweiz</span>
            )}
          </p>
        </div>
        <Suspense>
          <SaveSearchButton compact className="h-10 shrink-0 rounded-full" />
        </Suspense>
      </header>

      <div className="mt-4 sm:mt-5">
        <QuickFilters
          f={f}
          vehicleType={gen?.type}
          sizeRange={gen?.type === "auto" && f.modus === "streng" && gen.diameterMin && gen.diameterMax ? [gen.diameterMin, gen.diameterMax] : undefined}
        />
      </div>

      {gen ? (
        <section aria-label="Dein Fahrzeug" className="mt-4 overflow-hidden sm:mt-5 rounded-2xl border border-line bg-surface">
          <div className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                {gen.type === "auto" ? <CarFront className="h-6 w-6" aria-hidden /> : <Bike className="h-6 w-6" aria-hidden />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-brand">{gen.type === "auto" ? "Dein Auto" : "Dein Motorrad"}</p>
                <p className="mt-1 font-semibold">
                  {gen.fullName} <span className="whitespace-nowrap font-normal text-muted">{yearRange(gen.yearFrom, gen.yearTo)}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {gen.type === "auto" ? (
                    <>
                      <span className="badge">LK {formatPcd(gen.boltCount, gen.boltCircle)}</span>
                      {gen.centerBore && <span className="badge">ML {formatNumber(gen.centerBore)} mm</span>}
                      {gen.etMin != null && (
                        <span className="badge">
                          ET {gen.etMin}–{gen.etMax}
                        </span>
                      )}
                      {gen.diameterMin && (
                        <span className="badge">
                          {gen.diameterMin}–{gen.diameterMax} Zoll
                        </span>
                      )}
                      {gen.thread && (
                        <span className="badge">
                          {gen.thread} {gen.fastener}
                        </span>
                      )}
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
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Suspense>
                <FitModeToggle />
              </Suspense>
              <Link href={searchHref(f, { fahrzeug: undefined, modus: "streng" })} className="btn btn-ghost btn-sm text-muted hover:text-red">
                <X className="h-4 w-4" aria-hidden />
                Fahrzeug entfernen
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-2 border-t border-line bg-surface-2/60 px-4 py-2.5 text-xs leading-relaxed text-muted sm:px-5">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
            {gen.type === "auto" ? (
              <p>
                <span className="sm:hidden">Geprüft gegen die Serienwerte: Lochkreis, Mittenloch, Zoll, Breite und ET. Ohne Gewähr.</span>
                <span className="hidden sm:inline">
                  Geprüft werden Lochkreis, Mittenloch, Zollgröße, Breite und Einpresstiefe gegen die Serienwerte. Angaben ohne Gewähr – maßgeblich sind
                  Fahrzeugpapiere und Felgengutachten.
                </span>
              </p>
            ) : (
              <p>Motorradfelgen passen meist nur modellspezifisch. „Nur passende“ zeigt Felgen, die der Verkäufer für dein Modell angegeben hat.</p>
            )}
          </div>
        </section>
      ) : (
        <details className="group mt-4 overflow-hidden rounded-2xl border border-line bg-surface sm:mt-5">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4 [&::-webkit-details-marker]:hidden">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand sm:h-11 sm:w-11">
              <CarFront className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Nach Fahrzeug filtern</span>
              <span className="mt-0.5 block text-[0.8125rem] text-muted sm:text-sm">
                <span className="sm:hidden">Nur Felgen, die wirklich passen</span>
                <span className="hidden sm:inline">Marke, Modell und Baureihe wählen – wir zeigen nur Felgen, die wirklich passen.</span>
              </span>
            </span>
            <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180" aria-hidden />
          </summary>
          <div className="border-t border-line [&>.card]:rounded-none [&>.card]:border-0 [&>.card]:bg-transparent">
            <FitmentFinder compact />
          </div>
        </details>
      )}

      <div className="mt-4 grid gap-6 sm:mt-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block" aria-label="Filter">
          <Suspense>
            <FilterSidebar hasVehicle={!!gen} vehicleType={gen?.type} />
          </Suspense>
        </aside>

        <section aria-label="Suchergebnisse" className="min-w-0">
          {/* Werkzeugleiste */}
          <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex shrink-0 items-center gap-3 sm:min-w-0 sm:shrink">
              <Suspense>
                <MobileFilterButton hasVehicle={!!gen} vehicleType={gen?.type} />
              </Suspense>
              <p className="hidden text-sm text-muted sm:block">
                {res.total > 0 ? (
                  <>
                    <span className="font-semibold text-fg tabular-nums">
                      {first}–{last}
                    </span>{" "}
                    von <span className="tabular-nums">{formatCount(res.total)}</span> {res.total === 1 ? "Angebot" : "Angeboten"}
                  </>
                ) : (
                  "Keine Treffer"
                )}
              </p>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Suspense>
                <SortSelect hasOrigin={!!res.origin} />
              </Suspense>
              <ViewToggle view={view} gridHref={viewHref(undefined)} listHref={viewHref("liste")} />
            </div>
          </div>

          <div className="empty:hidden mt-3">
            <ActiveFilters f={f} />
          </div>

          <div className="mt-4">
            {res.items.length > 0 ? (
              view === "list" ? (
                <ListingList>{cards}</ListingList>
              ) : (
                <ListingGrid cols={3}>{cards}</ListingGrid>
              )
            ) : (
              <div className="animate-fade-up flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-12 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-brand">
                  <SearchX className="h-7 w-7" aria-hidden />
                </span>
                <h2 className="mt-4 text-lg font-semibold">Keine passenden Angebote gefunden</h2>
                <p className="mt-2 max-w-md text-sm text-muted">
                  {gen && f.modus === "streng"
                    ? "Versuche „Auch eventuell passende“ oder speichere die Suche – wir melden uns, sobald etwas Passendes eingestellt wird."
                    : "Passe die Filter an oder speichere die Suche als Suchauftrag – wir benachrichtigen dich bei neuen Treffern."}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Suspense>
                    <SaveSearchButton />
                  </Suspense>
                  {gen && f.modus === "streng" ? (
                    <Link href={searchHref(f, { modus: "locker" })} className="btn btn-ghost btn-sm">
                      Auch eventuell passende zeigen
                    </Link>
                  ) : (
                    <Link href={gen ? `/suche?fahrzeug=${gen.id}` : "/suche"} className="btn btn-ghost btn-sm">
                      Alle Filter zurücksetzen
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          <Pagination page={f.seite} pages={res.pages} makeHref={pageHref} />
        </section>
      </div>
    </div>
  );
}
