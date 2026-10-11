import { and, desc, eq, gt, ilike, or, sql, type SQL } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { listing, user } from "@/db/schema";
import { adminDeleteListing, adminFeatureListing, adminSetListingStatus } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin-buttons";
import { AdminPageHeader, AdminSearch, FilterTabs } from "@/components/admin-ui";
import { Pagination } from "@/components/pagination";
import { adminPath } from "@/lib/admin-url";
import { LISTING_STATUS } from "@/lib/constants";
import { env } from "@/lib/env";
import { formatDate, formatPrice, listingUrl } from "@/lib/format";

export const metadata: Metadata = { title: "Inserate" };

const PER_PAGE = 50;
type Status = keyof typeof LISTING_STATUS;
const STATUSES = Object.keys(LISTING_STATUS) as Status[];

export default async function AdminListingsPage(props: PageProps<"/admin/inserate">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const status = STATUSES.includes(sp.status as Status) ? (sp.status as Status) : sp.status === "top" ? "top" : null;
  const sellerId = typeof sp.nutzer === "string" ? sp.nutzer : null;
  const page = Math.max(1, Number(sp.seite) || 1);

  const conds: SQL[] = [];
  if (q) conds.push(/^\d+$/.test(q) ? eq(listing.id, Number(q)) : or(ilike(listing.title, `%${q}%`), ilike(user.email, `%${q}%`), ilike(user.companyName, `%${q}%`))!);
  if (status === "top") conds.push(eq(listing.status, "aktiv"), gt(listing.featuredUntil, new Date()));
  else if (status) conds.push(eq(listing.status, status));
  if (sellerId) conds.push(eq(listing.userId, sellerId));
  const where = conds.length ? and(...conds) : undefined;

  const [rows, [{ total }], counts, seller] = await Promise.all([
    db
      .select({ l: listing, email: user.email, sellerName: sql<string>`coalesce(${user.companyName}, ${user.name})` })
      .from(listing)
      .innerJoin(user, eq(user.id, listing.userId))
      .where(where)
      .orderBy(desc(listing.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: sql<number>`count(*)::int` }).from(listing).innerJoin(user, eq(user.id, listing.userId)).where(where),
    db.select({ s: listing.status, n: sql<number>`count(*)::int` }).from(listing).where(sellerId ? eq(listing.userId, sellerId) : undefined).groupBy(listing.status),
    sellerId ? db.select({ name: user.name, companyName: user.companyName }).from(user).where(eq(user.id, sellerId)).limit(1) : [],
  ]);

  const href = (p: { status?: string | null; seite?: number }) => {
    const s = new URLSearchParams();
    const st = p.status === undefined ? status : p.status;
    if (st) s.set("status", st);
    if (q) s.set("q", q);
    if (sellerId) s.set("nutzer", sellerId);
    if (p.seite && p.seite > 1) s.set("seite", String(p.seite));
    const str = s.toString();
    return `${adminPath("/inserate")}${str ? `?${str}` : ""}`;
  };
  const all = counts.reduce((s, c) => s + c.n, 0);

  return (
    <div>
      <AdminPageHeader
        title="Inserate"
        sub={
          seller[0] ? (
            <>
              Von {seller[0].companyName ?? seller[0].name} ·{" "}
              <Link href={adminPath("/inserate")} className="link">
                Filter entfernen
              </Link>
            </>
          ) : (
            `${total} Inserate in dieser Ansicht`
          )
        }
      />
      <AdminSearch q={q} placeholder="ID, Titel, E-Mail oder Firma" keep={{ status: status ?? undefined, nutzer: sellerId ?? undefined }} />
      <FilterTabs
        items={[
          { href: href({ status: null, seite: 1 }), label: "Alle", active: !status, count: all },
          ...STATUSES.map((s) => ({ href: href({ status: s, seite: 1 }), label: LISTING_STATUS[s], active: status === s, count: counts.find((c) => c.s === s)?.n ?? 0 })),
          { href: href({ status: "top", seite: 1 }), label: "TOP", active: status === "top" },
        ]}
      />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="p-3">#</th>
              <th className="p-3">Titel</th>
              <th className="p-3">Verkäufer</th>
              <th className="p-3 text-right">Preis</th>
              <th className="p-3">Status</th>
              <th className="p-3">Erstellt</th>
              <th className="p-3">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ l, email, sellerName }) => {
              const featured = l.featuredUntil && l.featuredUntil > new Date();
              return (
                <tr key={l.id} className="border-t border-line align-top">
                  <td className="p-3 text-faint">{l.id}</td>
                  <td className="max-w-xs p-3">
                    <a href={`${env.appUrl}${listingUrl(l)}`} className="hover:text-brand" target="_blank" rel="noreferrer">
                      {l.title}
                    </a>
                    {featured && <span className="badge badge-top ml-1">TOP bis {formatDate(l.featuredUntil!)}</span>}
                  </td>
                  <td className="p-3">
                    <Link href={adminPath(`/nutzer/${l.userId}`)} className="hover:text-brand">
                      {sellerName}
                    </Link>
                    <span className="block text-xs text-faint">{email}</span>
                  </td>
                  <td className="p-3 text-right tabular-nums">{formatPrice(l.priceCents)}</td>
                  <td className="p-3">{LISTING_STATUS[l.status]}</td>
                  <td className="p-3 text-muted">{formatDate(l.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {l.status === "gesperrt" ? (
                        <ActionButton action={adminSetListingStatus.bind(null, l.id, "aktiv")} success="Freigegeben">
                          Freigeben
                        </ActionButton>
                      ) : (
                        <ActionButton action={adminSetListingStatus.bind(null, l.id, "gesperrt")} confirmText="Inserat sperren?" success="Gesperrt">
                          Sperren
                        </ActionButton>
                      )}
                      {l.status === "aktiv" &&
                        (featured ? (
                          <ActionButton action={adminFeatureListing.bind(null, l.id, 0)} success="TOP entfernt">
                            TOP entfernen
                          </ActionButton>
                        ) : (
                          [7, 14, 30].map((d) => (
                            <ActionButton key={d} action={adminFeatureListing.bind(null, l.id, d)} success={`${d} Tage TOP`}>
                              TOP {d} T.
                            </ActionButton>
                          ))
                        ))}
                      <ActionButton action={adminDeleteListing.bind(null, l.id)} confirmText={`Inserat #${l.id} endgültig löschen (inkl. Fotos und Chats)?`} success="Gelöscht" className="btn btn-ghost btn-sm text-red">
                        Löschen
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-muted">Keine Inserate gefunden.</p>}
      </div>
      <p className="mt-3 text-xs text-faint">„TOP“ hebt ein Inserat auf der Startseite und ganz oben in der Suche hervor.</p>
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} makeHref={(p) => href({ seite: p })} />
    </div>
  );
}
