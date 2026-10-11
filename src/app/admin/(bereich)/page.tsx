import { desc, eq, sql } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { listing, report, user } from "@/db/schema";
import { AdminPageHeader, DailyBars, StatTile, TARGET_LABEL } from "@/components/admin-ui";
import { adminPath } from "@/lib/admin-url";
import { LISTING_STATUS } from "@/lib/constants";
import { formatPrice, formatRelative } from "@/lib/format";

export const metadata = { title: "Dashboard" };

const DAYS = 30;

/** Tageswerte der letzten 30 Tage (inkl. heute, Lücken = 0) */
async function daily(table: "user" | "listing" | "message", column: "created_at" | "published_at") {
  const rows = await db.execute<{ day: string; n: number }>(sql`
    select to_char(d, 'YYYY-MM-DD') as day, coalesce(c.n, 0)::int as n
    from generate_series(current_date - ${DAYS - 1}::int, current_date, interval '1 day') d
    left join (
      select date_trunc('day', ${sql.identifier(column)})::date as day, count(*) as n
      from ${sql.identifier(table)}
      where ${sql.identifier(column)} >= current_date - ${DAYS - 1}::int
      group by 1
    ) c on c.day = d::date
    order by d`);
  return rows.map((r) => ({ day: new Date(`${r.day}T12:00:00`), value: Number(r.n) }));
}

export default async function AdminDashboard() {
  const [[s], users, listings, messages, openReports, newUsers, newListings] = await Promise.all([
    db.execute<Record<string, number>>(sql`
      select
        (select count(*)::int from "user") as users,
        (select count(*)::int from "user" where created_at > now() - interval '7 days') as users7,
        (select count(*)::int from "user" where account_type = 'haendler') as dealers,
        (select count(*)::int from "user" where banned) as banned,
        (select count(*)::int from listing where status = 'aktiv') as active,
        (select count(*)::int from listing where published_at > now() - interval '7 days') as listings7,
        (select count(*)::int from listing where status = 'verkauft') as sold,
        (select count(*)::int from listing where status = 'aktiv' and featured_until > now()) as featured,
        (select count(*)::int from conversation where created_at > now() - interval '7 days') as convs7,
        (select count(*)::int from report where status = 'offen') as reports,
        (select count(*)::int from saved_search) as searches,
        (select count(*)::int from listing where status = 'aktiv' and expires_at < now() + interval '7 days') as expiring`),
    daily("user", "created_at"),
    daily("listing", "published_at"),
    daily("message", "created_at"),
    db.select().from(report).where(eq(report.status, "offen")).orderBy(desc(report.createdAt)).limit(5),
    db.select({ id: user.id, name: user.name, companyName: user.companyName, email: user.email, createdAt: user.createdAt, accountType: user.accountType }).from(user).orderBy(desc(user.createdAt)).limit(6),
    db.select({ id: listing.id, title: listing.title, priceCents: listing.priceCents, status: listing.status, createdAt: listing.createdAt }).from(listing).orderBy(desc(listing.createdAt)).limit(6),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader title="Dashboard" sub="Überblick über Marktplatz, Nutzer und offene Aufgaben." />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Kennzahlen">
        <StatTile label="Offene Meldungen" value={s.reports} href={adminPath("/meldungen")} alert={s.reports > 0} />
        <StatTile label="Aktive Inserate" value={s.active} href={adminPath("/inserate")} hint={`${s.featured} davon TOP`} />
        <StatTile label="Nutzer" value={s.users} href={adminPath("/nutzer")} hint={`+${s.users7} in 7 Tagen`} />
        <StatTile label="Händler" value={s.dealers} href={adminPath("/nutzer?typ=haendler")} />
        <StatTile label="Neue Chats (7 Tage)" value={s.convs7} />
        <StatTile label="Laufen in 7 Tagen ab" value={s.expiring} href={adminPath("/inserate?status=aktiv")} />
      </section>

      <section aria-labelledby="trend-title">
        <h2 id="trend-title" className="font-display mb-3 text-lg uppercase">Letzte {DAYS} Tage</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <DailyBars title="Neue Nutzer" data={users} />
          <DailyBars title="Neue Inserate" data={listings} />
          <DailyBars title="Nachrichten" data={messages} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-5" aria-labelledby="reports-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="reports-title" className="font-display text-lg uppercase">Offene Meldungen</h2>
            <Link href={adminPath("/meldungen")} className="link inline-flex items-center gap-1 text-sm">
              Alle <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
          {openReports.length === 0 ? (
            <p className="text-sm text-muted">Keine offenen Meldungen.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)] text-sm">
              {openReports.map((r) => (
                <li key={r.id} className="flex items-center gap-2 py-2.5">
                  <span className="badge shrink-0">{TARGET_LABEL[r.targetType]}</span>
                  <Link href={`${adminPath("/meldungen")}#meldung-${r.id}`} className="min-w-0 flex-1 truncate hover:text-brand">
                    {r.reason}
                  </Link>
                  <span className="shrink-0 text-xs text-faint">{formatRelative(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5" aria-labelledby="users-title">
          <h2 id="users-title" className="font-display mb-3 text-lg uppercase">Neue Nutzer</h2>
          <ul className="divide-y divide-[var(--border)] text-sm">
            {newUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-2 py-2.5">
                <Link href={adminPath(`/nutzer/${u.id}`)} className="min-w-0 flex-1 truncate hover:text-brand">
                  {u.companyName ?? u.name} <span className="text-faint">· {u.email}</span>
                </Link>
                {u.accountType === "haendler" && <span className="badge badge-brand shrink-0">Händler</span>}
                <span className="shrink-0 text-xs text-faint">{formatRelative(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5" aria-labelledby="listings-title">
          <h2 id="listings-title" className="font-display mb-3 text-lg uppercase">Neue Inserate</h2>
          <ul className="divide-y divide-[var(--border)] text-sm">
            {newListings.map((l) => (
              <li key={l.id} className="flex items-center gap-2 py-2.5">
                <Link href={adminPath(`/inserate?q=${l.id}`)} className="min-w-0 flex-1 truncate hover:text-brand">
                  {l.title}
                </Link>
                <span className="shrink-0 tabular-nums text-muted">{formatPrice(l.priceCents)}</span>
                {l.status !== "aktiv" && <span className="badge shrink-0">{LISTING_STATUS[l.status]}</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
