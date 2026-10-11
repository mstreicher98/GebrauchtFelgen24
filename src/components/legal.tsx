import Link from "next/link";
import { getLegalDoc, LEGAL_DOCS, LEGAL_SLUGS, type LegalSlug } from "@/lib/legal";
import { findPlaceholders, parseLegal } from "@/lib/legal-markdown";
import { LegalContent } from "./legal-content";

const NAV_LABEL: Record<LegalSlug, string> = { impressum: "Impressum", datenschutz: "Datenschutz", agb: "AGB" };
const STAND = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Vienna" });

/** Rechtsseite (Impressum, Datenschutz, AGB) – Inhalt kommt aus dem Admin-Bereich „Rechtliches“. */
export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = await getLegalDoc(slug);
  const { title, path } = LEGAL_DOCS[slug];
  const openPlaceholders = findPlaceholders(doc.content).length > 0;

  return (
    <div className="container-page max-w-3xl py-10 sm:py-12">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Rechtliches</p>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-faint">Stand: {doc.updatedAt ? STAND.format(doc.updatedAt) : "Oktober 2026"}</p>
      <nav aria-label="Rechtliches" className="mt-5 flex flex-wrap gap-2">
        {LEGAL_SLUGS.map((s) => (
          <Link key={s} href={LEGAL_DOCS[s].path} className="chip" data-active={LEGAL_DOCS[s].path === path} aria-current={LEGAL_DOCS[s].path === path ? "page" : undefined}>
            {NAV_LABEL[s]}
          </Link>
        ))}
      </nav>
      {openPlaceholders && (
        <div className="mt-6 rounded-xl border border-brand/40 bg-brand-soft px-4 py-3 text-sm text-brand">
          Vorlage – die blau hinterlegten Platzhalter in [eckigen Klammern] müssen vor dem Livegang mit den Firmendaten ersetzt und der Text rechtlich geprüft
          werden.
        </div>
      )}
      <div className="card prose-legal mt-6 p-5 sm:p-8">
        <LegalContent blocks={parseLegal(doc.content)} />
      </div>
    </div>
  );
}
