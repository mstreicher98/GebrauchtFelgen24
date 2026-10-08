import { and, desc, eq } from "drizzle-orm";
import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { listing, user } from "@/db/schema";
import { OwnerActions } from "@/components/owner-actions";
import { LISTING_STATUS } from "@/lib/constants";
import { formatDate, formatPrice, listingUrl } from "@/lib/format";
import { imageUrl } from "@/lib/image-url";
import { listingCardColumns } from "@/lib/search";
import { requireUser } from "@/lib/session";
import { RimMark } from "@/components/logo";

const TABS = [
  ["aktiv", "Aktiv"],
  ["inaktiv", "Inaktiv / abgelaufen"],
  ["verkauft", "Verkauft"],
] as const;

export default async function MyListingsPage(props: PageProps<"/konto/inserate">) {
  const me = await requireUser("/konto/inserate");
  const tab = ((await props.searchParams).status as string) ?? "aktiv";
  const statusCond =
    tab === "verkauft" ? eq(listing.status, "verkauft") : tab === "inaktiv" ? undefined : eq(listing.status, "aktiv");
  const rows = await db
    .select({ ...listingCardColumns, viewCount: listing.viewCount, expiresAt: listing.expiresAt })
    .from(listing)
    .innerJoin(user, eq(user.id, listing.userId))
    .where(and(eq(listing.userId, me.id), statusCond))
    .orderBy(desc(listing.publishedAt));
  const list = tab === "inaktiv" ? rows.filter((r) => ["deaktiviert", "abgelaufen", "gesperrt"].includes(r.status)) : rows;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-line p-1 text-sm">
          {TABS.map(([k, l]) => (
            <Link key={k} href={`/konto/inserate?status=${k}`} className={`rounded-full px-3.5 py-1.5 font-semibold transition-colors ${tab === k ? "bg-gold text-on-gold" : "text-muted hover:text-fg"}`}>
              {l}
            </Link>
          ))}
        </div>
        <Link href="/inserat/neu" className="btn btn-gold btn-sm">
          <Plus className="h-4 w-4" /> Neues Inserat
        </Link>
      </div>
      {list.length === 0 ? (
        <div className="card p-10 text-center text-muted">Hier ist noch nichts.</div>
      ) : (
        <ul className="space-y-3">
          {list.map((l, i) => (
            <li key={l.id} className="card reveal flex flex-col gap-4 p-4 sm:flex-row" style={{ ["--reveal-delay" as string]: `${(i % 6) * 50}ms` }}>
              <Link href={listingUrl(l)} className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-surface-2 sm:w-36">
                {l.imageKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl(l.imageKey, 400)} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <RimMark className="m-auto mt-8 h-12 w-12 text-faint" />
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${l.status === "aktiv" ? "badge-green" : l.status === "gesperrt" ? "badge-red" : ""}`}>{LISTING_STATUS[l.status]}</span>
                  <span className="flex items-center gap-1 text-xs text-faint">
                    <Eye className="h-3.5 w-3.5" /> {l.viewCount}
                  </span>
                  {l.status === "aktiv" && <span className="text-xs text-faint">läuft bis {formatDate(l.expiresAt)}</span>}
                </div>
                <Link href={listingUrl(l)} className="mt-1 block truncate font-semibold hover:text-gold">
                  {l.title}
                </Link>
                <p className="text-sm text-muted">{formatPrice(l.priceCents)}</p>
                <div className="mt-3">
                  <OwnerActions id={l.id} status={l.status} compact />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
