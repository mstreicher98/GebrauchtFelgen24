/** Platzhalter in Rechtstexten – deutlich markiert, bis die Firmendaten eingetragen sind. */
export function P({ children }: { children: React.ReactNode }) {
  return <span className="placeholder">[{children}]</span>;
}

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="font-display text-4xl font-bold uppercase">{title}</h1>
      <p className="mt-2 text-sm text-faint">Stand: {updated}</p>
      <div className="mt-4 rounded-xl border border-gold/40 bg-gold-soft px-4 py-3 text-sm text-gold">
        Vorlage – die gelb markierten Platzhalter müssen vor dem Livegang mit den Firmendaten ersetzt und der Text rechtlich geprüft werden.
      </div>
      <div className="prose-legal mt-8">{children}</div>
    </div>
  );
}
