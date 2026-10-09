import Link from "next/link";

/** Platzhalter in Rechtstexten – deutlich markiert, bis die Firmendaten eingetragen sind. */
export function P({ children }: { children: React.ReactNode }) {
  return <span className="placeholder">[{children}]</span>;
}

const LEGAL_NAV = [
  { href: "/impressum", label: "Impressum" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/agb", label: "AGB" },
] as const;

export function LegalPage({
  title,
  updated,
  current,
  children,
}: {
  title: string;
  updated: string;
  current: (typeof LEGAL_NAV)[number]["href"];
  children: React.ReactNode;
}) {
  return (
    <div className="container-page max-w-3xl py-10 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Rechtliches</p>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-faint">Stand: {updated}</p>
      <nav aria-label="Rechtliches" className="mt-5 flex flex-wrap gap-2">
        {LEGAL_NAV.map((n) => (
          <Link key={n.href} href={n.href} className="chip" data-active={current === n.href} aria-current={current === n.href ? "page" : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6 rounded-xl border border-brand/40 bg-brand-soft px-4 py-3 text-sm text-brand">
        Vorlage – die blau hinterlegten Platzhalter in [eckigen Klammern] müssen vor dem Livegang mit den Firmendaten ersetzt und der Text rechtlich geprüft
        werden.
      </div>
      <div className="card prose-legal mt-6 p-5 sm:p-8">{children}</div>
    </div>
  );
}
