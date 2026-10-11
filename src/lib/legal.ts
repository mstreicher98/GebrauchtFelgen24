import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { legalVersion, user } from "@/db/schema";
import { LEGAL_DEFAULTS } from "./legal-defaults";

export const LEGAL_DOCS = {
  impressum: { title: "Impressum", path: "/impressum" },
  datenschutz: { title: "Datenschutzerklärung", path: "/datenschutz" },
  agb: { title: "Nutzungsbedingungen (AGB)", path: "/agb" },
} as const;

export type LegalSlug = keyof typeof LEGAL_DOCS;
export const LEGAL_SLUGS = Object.keys(LEGAL_DOCS) as LegalSlug[];

export function isLegalSlug(s: string): s is LegalSlug {
  return s in LEGAL_DOCS;
}

/** Aktuelle Fassung (neueste Version) oder die Vorlage, solange nichts gespeichert wurde. */
export const getLegalDoc = cache(async (slug: LegalSlug) => {
  const [v] = await db
    .select({ id: legalVersion.id, content: legalVersion.content, createdAt: legalVersion.createdAt })
    .from(legalVersion)
    .where(eq(legalVersion.slug, slug))
    .orderBy(desc(legalVersion.id))
    .limit(1);
  return v ? { content: v.content, updatedAt: v.createdAt, versionId: v.id } : { content: LEGAL_DEFAULTS[slug], updatedAt: null, versionId: null };
});

export async function listLegalVersions(slug: LegalSlug, limit = 30) {
  return db
    .select({ id: legalVersion.id, createdAt: legalVersion.createdAt, chars: sql<number>`length(${legalVersion.content})::int`, author: user.name })
    .from(legalVersion)
    .leftJoin(user, eq(user.id, legalVersion.createdById))
    .where(eq(legalVersion.slug, slug))
    .orderBy(desc(legalVersion.id))
    .limit(limit);
}
