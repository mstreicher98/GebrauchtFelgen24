import { desc, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { listing, user } from "@/db/schema";
import { adminFeatureListing, adminSetListingStatus } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin-buttons";
import { LISTING_STATUS } from "@/lib/constants";
import { formatDate, formatPrice, listingUrl } from "@/lib/format";

export default async function AdminListingsPage(props: PageProps<"/admin/inserate">) {
  const q = ((await props.searchParams).q as string | undefined)?.trim();
  const rows = await db
    .select({ l: listing, email: user.email })
    .from(listing)
    .innerJoin(user, eq(user.id, listing.userId))
    .where(q ? (/^\d+$/.test(q) ? eq(listing.id, Number(q)) : or(ilike(listing.title, `%${q}%`), ilike(user.email, `%${q}%`))) : undefined)
    .orderBy(desc(listing.createdAt))
    .limit(100);
  return (
    <div>
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} className="input max-w-sm" placeholder="ID, Titel oder E-Mail" />
        <button className="btn btn-outline">Suchen</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Titel</th>
              <th className="p-3">Verkäufer</th>
              <th className="p-3">Preis</th>
              <th className="p-3">Status</th>
              <th className="p-3">Erstellt</th>
              <th className="p-3">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ l, email }) => {
              const featured = l.featuredUntil && l.featuredUntil > new Date();
              return (
                <tr key={l.id} className="border-t border-line align-top">
                  <td className="p-3 text-faint">{l.id}</td>
                  <td className="max-w-xs p-3">
                    <Link href={listingUrl(l)} className="hover:text-brand" target="_blank">
                      {l.title}
                    </Link>
                    {featured && <span className="badge badge-top ml-1">TOP bis {formatDate(l.featuredUntil!)}</span>}
                  </td>
                  <td className="p-3 text-muted">{email}</td>
                  <td className="p-3">{formatPrice(l.priceCents)}</td>
                  <td className="p-3">{LISTING_STATUS[l.status]}</td>
                  <td className="p-3 text-muted">{formatDate(l.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {l.status === "gesperrt" ? (
                        <ActionButton action={adminSetListingStatus.bind(null, l.id, "aktiv")} success="Freigegeben">Freigeben</ActionButton>
                      ) : (
                        <ActionButton action={adminSetListingStatus.bind(null, l.id, "gesperrt")} confirmText="Sperren?" success="Gesperrt">Sperren</ActionButton>
                      )}
                      {featured ? (
                        <ActionButton action={adminFeatureListing.bind(null, l.id, 0)} success="TOP entfernt">TOP entfernen</ActionButton>
                      ) : (
                        <ActionButton action={adminFeatureListing.bind(null, l.id, 14)} success="14 Tage TOP">TOP 14 Tage</ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-faint">
        „TOP“ hebt ein Inserat auf der Startseite und ganz oben in der Suche hervor. Eine kostenpflichtige Buchung durch Nutzer kann später angebunden werden.
      </p>
    </div>
  );
}
