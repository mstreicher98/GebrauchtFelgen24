import { desc, eq, sql } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { adminLog, user } from "@/db/schema";
import { AdminPageHeader, TARGET_LABEL } from "@/components/admin-ui";
import { Pagination } from "@/components/pagination";
import { adminPath } from "@/lib/admin-url";

export const metadata: Metadata = { title: "Protokoll" };

const PER_PAGE = 50;
const DT = new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Wohin ein Protokolleintrag verlinkt (sofern es das Ziel als Seite gibt). */
function targetHref(type: string | null, id: string | null) {
  if (!type || !id) return null;
  if (type === "user") return adminPath(`/nutzer/${id}`);
  if (type === "listing") return adminPath(`/inserate?q=${id}`);
  if (type === "conversation") return adminPath(`/unterhaltungen/${id}`);
  if (type === "vehicle_make") return adminPath(`/fahrzeuge/${id}`);
  if (type === "legal") return adminPath(`/rechtliches/${id}`);
  return null;
}

export default async function AdminLogPage(props: PageProps<"/admin/protokoll">) {
  const page = Math.max(1, Number((await props.searchParams).seite) || 1);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ l: adminLog, admin: user.name })
      .from(adminLog)
      .leftJoin(user, eq(user.id, adminLog.adminId))
      .orderBy(desc(adminLog.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: sql<number>`count(*)::int` }).from(adminLog),
  ]);

  return (
    <div>
      <AdminPageHeader title="Protokoll" sub="Alle Aktionen im Admin-Bereich – wer hat wann was geändert oder eingesehen." />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-faint">
            <tr>
              <th className="p-3">Zeitpunkt</th>
              <th className="p-3">Admin</th>
              <th className="p-3">Aktion</th>
              <th className="p-3">Ziel</th>
              <th className="p-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ l, admin }) => {
              const href = targetHref(l.targetType, l.targetId);
              const label = l.targetType ? `${TARGET_LABEL[l.targetType] ?? l.targetType}${l.targetId ? ` ${l.targetId.length > 12 ? `${l.targetId.slice(0, 8)}…` : `#${l.targetId}`}` : ""}` : "–";
              return (
                <tr key={l.id} className="border-t border-line">
                  <td className="whitespace-nowrap p-3 text-muted tabular-nums">{DT.format(l.createdAt)}</td>
                  <td className="p-3">{admin ?? "gelöschtes Konto"}</td>
                  <td className="p-3 font-medium">{l.action}</td>
                  <td className="whitespace-nowrap p-3">
                    {href ? (
                      <Link href={href} className="link">
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </td>
                  <td className="max-w-sm truncate p-3 text-muted" title={l.details ?? undefined}>
                    {l.details ?? ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-sm text-muted">Noch keine Einträge.</p>}
      </div>
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} makeHref={(p) => `${adminPath("/protokoll")}${p > 1 ? `?seite=${p}` : ""}`} />
    </div>
  );
}
