import { desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { listing, message, report, user } from "@/db/schema";
import { adminSetBanned, adminSetListingStatus, resolveReport } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin-buttons";
import { formatRelative, listingUrl } from "@/lib/format";

export default async function ReportsPage(props: PageProps<"/admin/meldungen">) {
  const all = (await props.searchParams).alle === "1";
  const rows = await db
    .select({ r: report, reporter: user.email })
    .from(report)
    .leftJoin(user, eq(user.id, report.reporterId))
    .where(all ? undefined : eq(report.status, "offen"))
    .orderBy(desc(report.createdAt))
    .limit(200);

  const listingIds = rows.filter((x) => x.r.targetType === "listing").map((x) => Number(x.r.targetId)).filter(Boolean);
  const userIds = rows.filter((x) => x.r.targetType === "user").map((x) => x.r.targetId);
  const msgIds = rows.filter((x) => x.r.targetType === "message").map((x) => Number(x.r.targetId)).filter(Boolean);
  const [listings, users, msgs] = await Promise.all([
    listingIds.length ? db.select({ id: listing.id, title: listing.title, status: listing.status, userId: listing.userId }).from(listing).where(inArray(listing.id, listingIds)) : [],
    userIds.length ? db.select({ id: user.id, name: user.name, email: user.email, banned: user.banned }).from(user).where(inArray(user.id, userIds)) : [],
    msgIds.length ? db.select().from(message).where(inArray(message.id, msgIds)) : [],
  ]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Link href="/admin/meldungen" className="chip" data-active={!all}>Offen</Link>
        <Link href="/admin/meldungen?alle=1" className="chip" data-active={all}>Alle</Link>
      </div>
      {rows.length === 0 && <div className="card p-8 text-center text-muted">Keine Meldungen 🎉</div>}
      <ul className="space-y-3">
        {rows.map(({ r, reporter }) => {
          const l = r.targetType === "listing" ? listings.find((x) => x.id === Number(r.targetId)) : null;
          const u = r.targetType === "user" ? users.find((x) => x.id === r.targetId) : null;
          const m = r.targetType === "message" ? msgs.find((x) => x.id === Number(r.targetId)) : null;
          return (
            <li key={r.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`badge ${r.status === "offen" ? "badge-red" : ""}`}>{r.status}</span>
                <span className="badge">{r.targetType}</span>
                <strong>{r.reason}</strong>
                <span className="text-faint">· {formatRelative(r.createdAt)} · von {reporter ?? "gelöscht"}</span>
              </div>
              {r.details && <p className="mt-2 text-sm text-muted">{r.details}</p>}
              <div className="mt-3 text-sm">
                {l && (
                  <Link href={listingUrl(l)} className="link" target="_blank">
                    Inserat #{l.id}: {l.title} ({l.status})
                  </Link>
                )}
                {u && (
                  <span>
                    Nutzer: {u.name} ({u.email}) {u.banned && <span className="badge badge-red">gesperrt</span>}
                  </span>
                )}
                {m && <span className="text-muted">Nachricht: „{m.body.slice(0, 200)}“</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "offen" && (
                  <ActionButton action={resolveReport.bind(null, r.id)} success="Erledigt">
                    Als erledigt markieren
                  </ActionButton>
                )}
                {l && l.status !== "gesperrt" && (
                  <ActionButton action={adminSetListingStatus.bind(null, l.id, "gesperrt")} confirmText="Inserat sperren?" success="Inserat gesperrt">
                    Inserat sperren
                  </ActionButton>
                )}
                {l && (
                  <ActionButton action={adminSetBanned.bind(null, l.userId, true)} confirmText="Verkäufer sperren? Alle aktiven Inserate werden gesperrt." className="btn btn-danger btn-sm">
                    Verkäufer sperren
                  </ActionButton>
                )}
                {u && !u.banned && (
                  <ActionButton action={adminSetBanned.bind(null, u.id, true)} confirmText="Nutzer sperren?" className="btn btn-danger btn-sm">
                    Nutzer sperren
                  </ActionButton>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
