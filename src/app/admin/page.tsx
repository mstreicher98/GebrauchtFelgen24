import { sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";

export default async function AdminDashboard() {
  const [s] = await db.execute<Record<string, number>>(sql`
    select
      (select count(*)::int from "user") as users,
      (select count(*)::int from "user" where created_at > now() - interval '7 days') as users7,
      (select count(*)::int from "user" where account_type = 'haendler') as dealers,
      (select count(*)::int from listing where status = 'aktiv') as active,
      (select count(*)::int from listing where published_at > now() - interval '7 days') as listings7,
      (select count(*)::int from listing where status = 'verkauft') as sold,
      (select count(*)::int from message where created_at > now() - interval '7 days') as messages7,
      (select count(*)::int from report where status = 'offen') as reports,
      (select count(*)::int from saved_search) as searches,
      (select count(*)::int from vehicle_generation) as gens`);
  const tiles: [string, number, string?][] = [
    ["Nutzer gesamt", s.users],
    ["Neue Nutzer (7 Tage)", s.users7],
    ["Händler", s.dealers],
    ["Aktive Inserate", s.active, "/admin/inserate"],
    ["Neue Inserate (7 Tage)", s.listings7],
    ["Verkauft", s.sold],
    ["Nachrichten (7 Tage)", s.messages7],
    ["Offene Meldungen", s.reports, "/admin/meldungen"],
    ["Suchaufträge", s.searches],
    ["Fahrzeug-Baureihen", s.gens, "/admin/fahrzeuge"],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {tiles.map(([label, value, href]) => {
        const inner = (
          <>
            <p className={`font-display text-3xl font-bold ${label === "Offene Meldungen" && value > 0 ? "text-red" : ""}`}>{value.toLocaleString("de-AT")}</p>
            <p className="text-sm text-muted">{label}</p>
          </>
        );
        return href ? (
          <Link key={label} href={href} className="card p-5 hover:border-gold">
            {inner}
          </Link>
        ) : (
          <div key={label} className="card p-5">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
