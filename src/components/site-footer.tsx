import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="carbon mt-24 border-t border-line bg-bg-elev pb-24 md:pb-0">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            Der Marktplatz für gebrauchte Felgen und Kompletträder für Auto und Motorrad in Österreich, Deutschland und der
            Schweiz. Mit Passungsprüfung für dein Fahrzeug.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-faint">Marktplatz</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="text-muted hover:text-brand" href="/suche?typ=auto">Autofelgen</Link></li>
            <li><Link className="text-muted hover:text-brand" href="/suche?typ=motorrad">Motorradfelgen</Link></li>
            <li><Link className="text-muted hover:text-brand" href="/suche?art=komplettrad">Kompletträder</Link></li>
            <li><Link className="text-muted hover:text-brand" href="/fahrzeuge">Fahrzeug-Datenbank</Link></li>
            <li><Link className="text-muted hover:text-brand" href="/inserat/neu">Felgen verkaufen</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm uppercase tracking-widest text-faint">Info</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="text-muted hover:text-brand" href="/ratgeber">Felgen-Ratgeber</Link></li>
            <li><Link className="text-muted hover:text-brand" href="/sicherheit">Sicher handeln</Link></li>
            <li><Link className="text-muted hover:text-brand" href="/impressum">Impressum</Link></li>
            <li><Link className="text-muted hover:text-brand" href="/datenschutz">Datenschutz</Link></li>
            <li><Link className="text-muted hover:text-brand" href="/agb">AGB</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-faint sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} GebrauchtFelgen24 · Alle Angaben zu Fahrzeugen ohne Gewähr</span>
          <span>Postleitzahl-Daten: GeoNames (CC BY 4.0)</span>
        </div>
      </div>
    </footer>
  );
}
