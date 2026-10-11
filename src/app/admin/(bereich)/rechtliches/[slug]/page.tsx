import { and, eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { legalVersion } from "@/db/schema";
import { LegalEditor } from "@/components/admin-legal-editor";
import { AdminPageHeader } from "@/components/admin-ui";
import { adminPath } from "@/lib/admin-url";
import { env } from "@/lib/env";
import { getLegalDoc, isLegalSlug, LEGAL_DOCS, listLegalVersions } from "@/lib/legal";
import { LEGAL_DEFAULTS } from "@/lib/legal-defaults";

export const metadata: Metadata = { title: "Rechtstext bearbeiten" };

const DT = new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });

export default async function AdminLegalEditPage(props: PageProps<"/admin/rechtliches/[slug]">) {
  const { slug } = await props.params;
  if (!isLegalSlug(slug)) notFound();
  const sp = await props.searchParams;
  const [doc, versions] = await Promise.all([getLegalDoc(slug), listLegalVersions(slug)]);

  // Ältere Fassung oder Vorlage in den Editor laden (wird erst beim Speichern wieder aktiv)
  let initial = doc.content;
  let sourceNote: string | undefined;
  const versionId = Number(sp.version);
  if (versionId) {
    const [v] = await db
      .select({ content: legalVersion.content, createdAt: legalVersion.createdAt })
      .from(legalVersion)
      .where(and(eq(legalVersion.id, versionId), eq(legalVersion.slug, slug)))
      .limit(1);
    if (v) {
      initial = v.content;
      sourceNote = `Fassung vom ${DT.format(v.createdAt)} geladen – mit „Speichern“ wird sie wieder aktuell.`;
    }
  } else if (sp.vorlage === "1") {
    initial = LEGAL_DEFAULTS[slug];
    sourceNote = "Vorlage geladen – mit „Speichern“ wird sie wieder aktuell.";
  }
  const base = adminPath(`/rechtliches/${slug}`);

  return (
    <div>
      <AdminPageHeader title={LEGAL_DOCS[slug].title} sub={doc.updatedAt ? `Aktuelle Fassung vom ${DT.format(doc.updatedAt)}` : "Noch die mitgelieferte Vorlage"}>
        <Link href={adminPath("/rechtliches")} className="btn btn-outline btn-sm">
          ← Rechtliches
        </Link>
        <a href={`${env.appUrl}${LEGAL_DOCS[slug].path}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Seite ansehen
        </a>
      </AdminPageHeader>

      {/* key: beim Laden einer anderen Fassung den Editor neu aufbauen */}
      <LegalEditor key={`${versionId || ""}-${sp.vorlage ?? ""}-${doc.versionId ?? 0}`} slug={slug} initial={initial} saved={doc.content} sourceNote={sourceNote} />

      <section className="card mt-6 p-5">
        <h2 className="font-display mb-3 text-lg uppercase">Verlauf</h2>
        {versions.length === 0 ? (
          <p className="text-sm text-muted">Noch keine eigene Fassung gespeichert – aktuell gilt die Vorlage.</p>
        ) : (
          <ul className="divide-y divide-[var(--border)] text-sm">
            {versions.map((v, i) => (
              <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="tabular-nums">{DT.format(v.createdAt)}</span>
                <span className="text-muted">{v.author ?? "gelöschtes Konto"}</span>
                <span className="text-xs text-faint">{v.chars.toLocaleString("de-AT")} Zeichen</span>
                {i === 0 ? (
                  <span className="badge badge-green ml-auto">aktuell</span>
                ) : (
                  <Link href={`${base}?version=${v.id}`} className="link ml-auto">
                    In Editor laden
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted">
          Zur mitgelieferten Fassung zurück?{" "}
          <Link href={`${base}?vorlage=1`} className="link">
            Vorlage in den Editor laden
          </Link>
        </p>
      </section>
    </div>
  );
}
