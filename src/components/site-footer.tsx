import { Check } from "lucide-react";
import Link from "next/link";
import { Logo } from "./logo";

const MARKTPLATZ = [
  { href: "/suche?typ=auto&art=felge", label: "Autofelgen" },
  { href: "/suche?art=komplettrad", label: "Kompletträder" },
  { href: "/suche?saison=winter", label: "Winterräder" },
  { href: "/suche?saison=sommer", label: "Sommerräder" },
  { href: "/suche?typ=motorrad", label: "Motorradfelgen" },
  { href: "/inserat/neu", label: "Felgen verkaufen" },
];

const ZOLL = [16, 17, 18, 19, 20];
const LOCHKREISE = ["5x112", "5x120"];

const SERVICE = [
  { href: "/ratgeber", label: "Felgen-Ratgeber" },
  { href: "/sicherheit", label: "Sicher handeln" },
  { href: "/registrieren", label: "Für Händler" },
  { href: "/fahrzeuge", label: "Fahrzeug-Datenbank" },
];

const RECHTLICHES = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
];

const VORTEILE = ["Passungsprüfung für dein Fahrzeug", "Kostenlos inserieren", "Sicher chatten – Kontaktdaten bleiben privat"];

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-[0.8125rem] uppercase tracking-[0.12em] text-fg">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function LinkList({ links }: { links: { href: string; label: string }[] }) {
  return (
    <ul className="space-y-1 text-sm md:space-y-2.5">
      {links.map((l) => (
        <li key={l.href}>
          <Link className="inline-block py-1 text-muted transition-colors hover:text-brand md:py-0" href={l.href}>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const tagBase =
  "flex h-8 items-center justify-center rounded-lg border border-line bg-bg px-2 text-sm font-medium tabular-nums transition-colors hover:border-brand hover:text-brand";
const tagClass = `${tagBase} text-muted`;

export function SiteFooter() {
  return (
    // Am Handy Platz für die feste Tab-Leiste (rund 3,6 rem + Safe-Area)
    <footer className="mt-24 border-t border-line bg-surface pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-4 md:gap-x-8 lg:py-14 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
        {/* Marke: am Handy gestapelt, md–xl Text und Vorteile nebeneinander, ab xl eigene Spalte */}
        <div className="col-span-2 md:col-span-4 md:grid md:grid-cols-2 md:items-end md:gap-x-8 xl:col-span-1 xl:block xl:pr-6">
          <div>
            <Link href="/" aria-label="GebrauchtFelgen24 – Startseite" className="inline-block">
              <Logo id="gf24-ftr" className="h-10" />
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Der Marktplatz für gebrauchte Felgen und Kompletträder für Auto und Motorrad in Österreich, Deutschland und der Schweiz.
            </p>
          </div>
          <ul className="mt-5 space-y-2 text-sm md:mt-0 xl:mt-5">
            {VORTEILE.map((v) => (
              <li key={v} className="flex items-start gap-2 text-fg">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2.5} aria-hidden="true" />
                {v}
              </li>
            ))}
          </ul>
        </div>

        <Column title="Marktplatz">
          <LinkList links={MARKTPLATZ} />
        </Column>

        <Column title="Beliebte Größen">
          <p className="mb-2 text-xs font-medium text-muted">Felgengröße</p>
          <ul className="grid max-w-56 grid-cols-3 gap-2">
            {ZOLL.map((z) => (
              <li key={z}>
                <Link href={`/suche?zoll=${z}`} className={tagClass} aria-label={`${z} Zoll Felgen`}>
                  {z}&Prime;
                </Link>
              </li>
            ))}
            <li>
              <Link href="/suche" className={`${tagBase} text-brand`} aria-label="Alle Felgengrößen anzeigen">
                Alle
              </Link>
            </li>
          </ul>
          <p className="mb-2 mt-4 text-xs font-medium text-muted">Lochkreis</p>
          <ul className="grid max-w-56 grid-cols-2 gap-2">
            {LOCHKREISE.map((lk) => (
              <li key={lk}>
                <Link href={`/suche?lk=${lk}`} className={tagClass} aria-label={`Felgen mit Lochkreis ${lk.replace("x", " × ")}`}>
                  {lk.replace("x", "×")}
                </Link>
              </li>
            ))}
          </ul>
        </Column>

        <Column title="Service">
          <LinkList links={SERVICE} />
        </Column>

        <Column title="Rechtliches">
          <LinkList links={RECHTLICHES} />
        </Column>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-faint lg:flex-row lg:items-center lg:justify-between">
          <span>© {new Date().getFullYear()} GebrauchtFelgen24 · Alle Angaben zu Fahrzeugen ohne Gewähr</span>
          <span>Österreich · Deutschland · Schweiz · Postleitzahl-Daten: GeoNames (CC BY 4.0)</span>
        </div>
      </div>
    </footer>
  );
}
