import { desc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { adminSetBanned, adminSetRole } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin-buttons";
import { formatDate } from "@/lib/format";

export default async function AdminUsersPage(props: PageProps<"/admin/nutzer">) {
  const q = ((await props.searchParams).q as string | undefined)?.trim();
  const rows = await db
    .select({
      u: user,
      listings: sql<number>`(select count(*)::int from listing l where l.user_id = "user"."id")`,
    })
    .from(user)
    .where(q ? or(ilike(user.email, `%${q}%`), ilike(user.name, `%${q}%`), ilike(user.companyName, `%${q}%`)) : undefined)
    .orderBy(desc(user.createdAt))
    .limit(100);
  return (
    <div>
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} className="input max-w-sm" placeholder="Name, Firma oder E-Mail" />
        <button className="btn btn-outline">Suchen</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">E-Mail</th>
              <th className="p-3">Typ</th>
              <th className="p-3">Inserate</th>
              <th className="p-3">Seit</th>
              <th className="p-3">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ u, listings }) => (
              <tr key={u.id} className="border-t border-line">
                <td className="p-3">
                  {u.companyName ?? u.name}
                  {u.role === "admin" && <span className="badge badge-brand ml-1">Admin</span>}
                  {u.banned && <span className="badge badge-red ml-1">gesperrt</span>}
                </td>
                <td className="p-3 text-muted">
                  {u.email} {!u.emailVerified && <span className="badge">unbestätigt</span>}
                </td>
                <td className="p-3">{u.accountType === "haendler" ? "Händler" : "Privat"}</td>
                <td className="p-3">{listings}</td>
                <td className="p-3 text-muted">{formatDate(u.createdAt)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    <ActionButton
                      action={adminSetBanned.bind(null, u.id, !u.banned)}
                      confirmText={u.banned ? undefined : "Nutzer sperren? Alle Sitzungen werden beendet und aktive Inserate gesperrt."}
                      success={u.banned ? "Entsperrt" : "Gesperrt"}
                    >
                      {u.banned ? "Entsperren" : "Sperren"}
                    </ActionButton>
                    <ActionButton action={adminSetRole.bind(null, u.id, u.role === "admin" ? "user" : "admin")} confirmText="Rolle ändern?">
                      {u.role === "admin" ? "Admin entziehen" : "Zum Admin machen"}
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
