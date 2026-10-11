import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { user } from "@/db/schema";
import { AdminPageHeader, AdminSearch, FilterTabs } from "@/components/admin-ui";
import { Pagination } from "@/components/pagination";
import { adminPath } from "@/lib/admin-url";
import { formatDate, formatRelative } from "@/lib/format";

export const metadata: Metadata = { title: "Nutzer" };

const PER_PAGE = 50;
const FILTERS = {
  alle: { label: "Alle", where: undefined },
  privat: { label: "Privat", where: eq(user.accountType, "privat") },
  haendler: { label: "Händler", where: eq(user.accountType, "haendler") },
  admins: { label: "Admins", where: eq(user.role, "admin") },
  gesperrt: { label: "Gesperrt", where: eq(user.banned, true) },
  unbestaetigt: { label: "E-Mail unbestätigt", where: eq(user.emailVerified, false) },
} satisfies Record<string, { label: string; where: SQL | undefined }>;
type Filter = keyof typeof FILTERS;

export default async function AdminUsersPage(props: PageProps<"/admin/nutzer">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const typ: Filter = typeof sp.typ === "string" && sp.typ in FILTERS ? (sp.typ as Filter) : "alle";
  const page = Math.max(1, Number(sp.seite) || 1);
  const conds = [FILTERS[typ].where, q ? or(ilike(user.email, `%${q}%`), ilike(user.name, `%${q}%`), ilike(user.companyName, `%${q}%`), eq(user.id, q)) : undefined].filter(Boolean) as SQL[];
  const where = conds.length ? and(...conds) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        u: user,
        listings: sql<number>`(select count(*)::int from listing l where l.user_id = "user"."id" and l.status = 'aktiv')`,
        reports: sql<number>`(select count(*)::int from report r where r.target_type = 'user' and r.target_id = "user"."id")`,
      })
      .from(user)
      .where(where)
      .orderBy(desc(user.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: sql<number>`count(*)::int` }).from(user).where(where),
  ]);

  const href = (p: { typ?: Filter; seite?: number }) => {
    const s = new URLSearchParams();
    const t = p.typ ?? typ;
    if (t !== "alle") s.set("typ", t);
    if (q) s.set("q", q);
    if (p.seite && p.seite > 1) s.set("seite", String(p.seite));
    const str = s.toString();
    return `${adminPath("/nutzer")}${str ? `?${str}` : ""}`;
  };

  return (
    <div>
      <AdminPageHeader title="Nutzer" sub={`${total} Konten in dieser Ansicht`} />
      <AdminSearch q={q} placeholder="Name, Firma, E-Mail oder ID" keep={{ typ: typ === "alle" ? undefined : typ }} />
      <FilterTabs items={(Object.keys(FILTERS) as Filter[]).map((k) => ({ href: href({ typ: k, seite: 1 }), label: FILTERS[k].label, active: typ === k }))} />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">E-Mail</th>
              <th className="p-3">Typ</th>
              <th className="p-3 text-right">Aktive Inserate</th>
              <th className="p-3 text-right">Meldungen</th>
              <th className="p-3">Registriert</th>
              <th className="p-3">Zuletzt aktiv</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ u, listings, reports }) => (
              <tr key={u.id} className="border-t border-line hover:bg-surface-2">
                <td className="p-3">
                  <Link href={adminPath(`/nutzer/${u.id}`)} className="font-medium hover:text-brand">
                    {u.companyName ?? u.name}
                  </Link>
                  {u.role === "admin" && <span className="badge badge-brand ml-1">Admin</span>}
                  {u.banned && <span className="badge badge-red ml-1">gesperrt</span>}
                  {u.adminNote && <span className="badge ml-1" title={u.adminNote}>Notiz</span>}
                </td>
                <td className="p-3 text-muted">
                  {u.email} {!u.emailVerified && <span className="badge">unbestätigt</span>}
                </td>
                <td className="p-3">{u.accountType === "haendler" ? "Händler" : "Privat"}</td>
                <td className="p-3 text-right tabular-nums">{listings}</td>
                <td className={`p-3 text-right tabular-nums ${reports > 0 ? "font-semibold text-red" : "text-faint"}`}>{reports}</td>
                <td className="p-3 text-muted">{formatDate(u.createdAt)}</td>
                <td className="p-3 text-muted">{u.lastSeenAt ? formatRelative(u.lastSeenAt) : "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-muted">Keine Nutzer gefunden.</p>}
      </div>
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} makeHref={(p) => href({ seite: p })} />
    </div>
  );
}
