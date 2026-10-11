import { ArrowRight, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-ui";
import { adminPath } from "@/lib/admin-url";
import { env } from "@/lib/env";
import { formatRelative } from "@/lib/format";
import { getLegalDoc, LEGAL_DOCS, LEGAL_SLUGS } from "@/lib/legal";
import { findPlaceholders } from "@/lib/legal-markdown";

export const metadata: Metadata = { title: "Rechtliches" };

export default async function AdminLegalPage() {
  const docs = await Promise.all(LEGAL_SLUGS.map(async (slug) => ({ slug, ...LEGAL_DOCS[slug], doc: await getLegalDoc(slug) })));
  return (
    <div>
      <AdminPageHeader title="Rechtliches" sub="Impressum, Datenschutzerklärung und AGB bearbeiten. Änderungen sind nach dem Speichern sofort online." />
      <div className="grid gap-4 md:grid-cols-3">
        {docs.map(({ slug, title, path, doc }) => {
          const open = findPlaceholders(doc.content).length;
          return (
            <section key={slug} className="card flex flex-col p-5">
              <h2 className="font-display text-lg uppercase">{title}</h2>
              <p className="mt-1 text-sm text-muted">{doc.updatedAt ? `Zuletzt geändert ${formatRelative(doc.updatedAt)}` : "Noch die mitgelieferte Vorlage"}</p>
              <p className="mt-3">
                <span className={`badge ${open ? "badge-red" : "badge-green"}`}>{open ? `${open} Platzhalter offen` : "Vollständig ausgefüllt"}</span>
              </p>
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Link href={adminPath(`/rechtliches/${slug}`)} className="btn btn-brand btn-sm">
                  Bearbeiten <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href={`${env.appUrl}${path}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ansehen
                </a>
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-4 max-w-2xl text-xs text-faint">
        Hinweis: Die Vorlagen ersetzen keine Rechtsberatung. Bitte die Texte vor dem Livegang prüfen lassen. Bei Änderungen der AGB müssen registrierte Nutzer laut
        § 10 rechtzeitig informiert werden.
      </p>
    </div>
  );
}
