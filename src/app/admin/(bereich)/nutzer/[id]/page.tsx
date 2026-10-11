import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { account, adminLog, listing, message, report, session, user } from "@/db/schema";
import { adminDeleteUser, adminRevokeSessions, adminSetBanned, adminSetRole, adminVerifyEmail } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin-buttons";
import { UserNoteForm } from "@/components/admin-forms";
import { AdminPageHeader, StatTile, TARGET_LABEL } from "@/components/admin-ui";
import { adminPath } from "@/lib/admin-url";
import { COUNTRIES, LISTING_STATUS } from "@/lib/constants";
import { env } from "@/lib/env";
import { formatDate, formatPrice, formatRelative, listingUrl } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Nutzer" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2 py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default async function AdminUserPage(props: PageProps<"/admin/nutzer/[id]">) {
  const { id } = await props.params;
  const [[u], me] = await Promise.all([db.select().from(user).where(eq(user.id, id)).limit(1), getCurrentUser()]);
  if (!u) notFound();
  const self = me?.id === u.id;

  const ownListingIds = db.select({ id: sql<string>`${listing.id}::text` }).from(listing).where(eq(listing.userId, id));
  const ownMessageIds = db.select({ id: sql<string>`${message.id}::text` }).from(message).where(eq(message.senderId, id));

  const [[stats], listings, providers, sessions, against, filed, logs] = await Promise.all([
    db.execute<Record<string, number>>(sql`
      select
        (select count(*)::int from listing where user_id = ${id}) as listings,
        (select count(*)::int from listing where user_id = ${id} and status = 'aktiv') as active,
        (select count(*)::int from listing where user_id = ${id} and status = 'verkauft') as sold,
        (select count(*)::int from conversation where buyer_id = ${id} or seller_id = ${id}) as conversations,
        (select count(*)::int from message where sender_id = ${id}) as messages,
        (select count(*)::int from favorite where user_id = ${id}) as favorites,
        (select count(*)::int from saved_search where user_id = ${id}) as searches,
        (select count(*)::int from block where blocked_id = ${id}) as blocked_by`),
    db
      .select({ id: listing.id, title: listing.title, status: listing.status, priceCents: listing.priceCents, createdAt: listing.createdAt, featuredUntil: listing.featuredUntil })
      .from(listing)
      .where(eq(listing.userId, id))
      .orderBy(desc(listing.createdAt))
      .limit(20),
    db.select({ providerId: account.providerId }).from(account).where(eq(account.userId, id)),
    db.select({ n: sql<number>`count(*)::int`, last: sql<Date | null>`max(${session.updatedAt})` }).from(session).where(eq(session.userId, id)),
    db
      .select()
      .from(report)
      .where(
        or(
          and(eq(report.targetType, "user"), eq(report.targetId, id)),
          and(eq(report.targetType, "listing"), inArray(report.targetId, ownListingIds)),
          and(eq(report.targetType, "message"), inArray(report.targetId, ownMessageIds)),
        ),
      )
      .orderBy(desc(report.createdAt))
      .limit(20),
    db.select({ n: sql<number>`count(*)::int` }).from(report).where(eq(report.reporterId, id)),
    db
      .select({ id: adminLog.id, action: adminLog.action, details: adminLog.details, createdAt: adminLog.createdAt, admin: user.name })
      .from(adminLog)
      .leftJoin(user, eq(user.id, adminLog.adminId))
      .where(and(eq(adminLog.targetType, "user"), eq(adminLog.targetId, id)))
      .orderBy(desc(adminLog.createdAt))
      .limit(15),
  ]);
  const dealer = u.accountType === "haendler";
  const loginMethods = providers.map((p) => (p.providerId === "credential" ? "E-Mail/Passwort" : p.providerId === "google" ? "Google" : p.providerId === "apple" ? "Apple" : p.providerId));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={u.companyName ?? u.name}
        sub={
          <span className="flex flex-wrap items-center gap-1.5">
            {u.email}
            {u.role === "admin" && <span className="badge badge-brand">Admin</span>}
            {dealer && <span className="badge badge-brand">Händler</span>}
            {u.banned && <span className="badge badge-red">gesperrt</span>}
            {!u.emailVerified && <span className="badge">E-Mail unbestätigt</span>}
          </span>
        }
      >
        <Link href={adminPath("/nutzer")} className="btn btn-outline btn-sm">
          ← Alle Nutzer
        </Link>
        {!u.banned && (
          <a href={`${env.appUrl}/nutzer/${u.id}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> Öffentliches Profil
          </a>
        )}
      </AdminPageHeader>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Kennzahlen">
        <StatTile label="Inserate" value={stats.listings} href={adminPath(`/inserate?nutzer=${u.id}`)} hint={`${stats.active} aktiv · ${stats.sold} verkauft`} />
        <StatTile label="Unterhaltungen" value={stats.conversations} hint={`${stats.messages} ${stats.messages === 1 ? "Nachricht" : "Nachrichten"} gesendet`} />
        <StatTile label="Meldungen gegen" value={against.length} alert={against.some((r) => r.status === "offen")} hint={`${filed[0].n} selbst gemeldet`} />
        <StatTile label="Blockiert von" value={stats.blocked_by} hint={`${stats.favorites} gemerkt · ${stats.searches} Suchaufträge`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display mb-2 text-lg uppercase">Profil</h2>
          <dl className="text-sm">
            <Row label="Name">{u.name}</Row>
            {dealer && <Row label="Firma">{u.companyName ?? "–"}</Row>}
            {dealer && u.companyUid && <Row label="UID">{u.companyUid}</Row>}
            {dealer && u.companyWebsite && (
              <Row label="Website">
                <a href={u.companyWebsite} target="_blank" rel="noopener nofollow" className="link">
                  {u.companyWebsite}
                </a>
              </Row>
            )}
            <Row label="Telefon">{u.phone ?? "–"}</Row>
            <Row label="Standort">{u.zip ? `${u.zip} ${u.city ?? ""} (${COUNTRIES[(u.country as keyof typeof COUNTRIES) ?? "AT"] ?? u.country})` : "–"}</Row>
            <Row label="Registriert">{formatDate(u.createdAt)}</Row>
            <Row label="Zuletzt aktiv">{u.lastSeenAt ? formatRelative(u.lastSeenAt) : "–"}</Row>
            <Row label="Anmeldung über">{loginMethods.join(", ") || "–"}</Row>
            <Row label="Sitzungen">
              {sessions[0].n} aktiv{sessions[0].last ? ` · zuletzt ${formatRelative(sessions[0].last)}` : ""}
            </Row>
            <Row label="Benachrichtigung">
              {[u.notifyEmail && "E-Mail", u.notifyPush && "Push"].filter(Boolean).join(", ") || "aus"}
            </Row>
            <Row label="Nutzer-ID">
              <code className="text-xs">{u.id}</code>
            </Row>
          </dl>
          {u.bio && <p className="mt-3 whitespace-pre-line rounded-xl bg-surface-2 p-3 text-sm text-muted">{u.bio}</p>}
        </section>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="font-display mb-3 text-lg uppercase">Aktionen</h2>
            {self ? (
              <p className="text-sm text-muted">Das ist dein eigenes Konto.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  action={adminSetBanned.bind(null, u.id, !u.banned)}
                  confirmText={u.banned ? undefined : "Nutzer sperren? Alle Sitzungen werden beendet und aktive Inserate gesperrt."}
                  success={u.banned ? "Entsperrt" : "Gesperrt"}
                  className={u.banned ? "btn btn-outline btn-sm" : "btn btn-danger btn-sm"}
                >
                  {u.banned ? "Entsperren" : "Sperren"}
                </ActionButton>
                {!u.emailVerified && (
                  <ActionButton action={adminVerifyEmail.bind(null, u.id)} success="E-Mail bestätigt">
                    E-Mail manuell bestätigen
                  </ActionButton>
                )}
                <ActionButton action={adminRevokeSessions.bind(null, u.id)} confirmText="Alle Sitzungen beenden? Der Nutzer muss sich neu anmelden." success="Sitzungen beendet">
                  Abmelden erzwingen
                </ActionButton>
                <ActionButton action={adminSetRole.bind(null, u.id, u.role === "admin" ? "user" : "admin")} confirmText={u.role === "admin" ? "Admin-Rechte entziehen?" : "Diesem Nutzer Admin-Rechte geben?"} success="Rolle geändert">
                  {u.role === "admin" ? "Admin-Rechte entziehen" : "Zum Admin machen"}
                </ActionButton>
              </div>
            )}
            {u.banned && <p className="mt-3 text-xs text-muted">Beim Entsperren bleiben gesperrte Inserate gesperrt – sie können unter „Inserate“ einzeln freigegeben werden.</p>}
          </section>

          <section className="card p-5">
            <h2 className="font-display mb-1 text-lg uppercase">Interne Notiz</h2>
            <p className="mb-3 text-xs text-muted">Nur für das Admin-Team sichtbar.</p>
            <UserNoteForm userId={u.id} initial={u.adminNote ?? ""} />
          </section>
        </div>
      </div>

      <section className="card overflow-x-auto">
        <div className="flex items-center justify-between p-4 pb-0">
          <h2 className="font-display text-lg uppercase">Inserate</h2>
          {stats.listings > listings.length && (
            <Link href={adminPath(`/inserate?nutzer=${u.id}`)} className="link text-sm">
              Alle {stats.listings} anzeigen
            </Link>
          )}
        </div>
        {listings.length === 0 ? (
          <p className="p-4 text-sm text-muted">Keine Inserate.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-t border-line">
                  <td className="p-3 text-faint">#{l.id}</td>
                  <td className="p-3">
                    <a href={`${env.appUrl}${listingUrl(l)}`} target="_blank" rel="noreferrer" className="hover:text-brand">
                      {l.title}
                    </a>
                    {l.featuredUntil && l.featuredUntil > new Date() && <span className="badge badge-top ml-1">TOP</span>}
                  </td>
                  <td className="p-3 tabular-nums">{formatPrice(l.priceCents)}</td>
                  <td className="p-3">{LISTING_STATUS[l.status]}</td>
                  <td className="p-3 text-muted">{formatDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display mb-3 text-lg uppercase">Meldungen gegen diesen Nutzer</h2>
          {against.length === 0 ? (
            <p className="text-sm text-muted">Keine Meldungen.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)] text-sm">
              {against.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className={`badge ${r.status === "offen" ? "badge-red" : "badge-green"}`}>{r.status}</span>
                  <span className="badge">{TARGET_LABEL[r.targetType]}</span>
                  <Link href={`${adminPath(`/meldungen?status=alle&typ=${r.targetType}`)}#meldung-${r.id}`} className="min-w-0 flex-1 truncate hover:text-brand">
                    {r.reason}
                  </Link>
                  <span className="text-xs text-faint">{formatRelative(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="font-display mb-3 text-lg uppercase">Verlauf (Admin)</h2>
          {logs.length === 0 ? (
            <p className="text-sm text-muted">Noch keine Admin-Aktionen.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)] text-sm">
              {logs.map((l) => (
                <li key={l.id} className="py-2">
                  <span className="font-medium">{l.action}</span>
                  {l.details && <span className="text-muted"> – {l.details}</span>}
                  <span className="block text-xs text-faint">
                    {formatRelative(l.createdAt)} · {l.admin ?? "gelöschtes Konto"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {!self && u.role !== "admin" && (
        <section className="card border-[var(--red)] p-5">
          <h2 className="font-display text-lg uppercase text-red">Konto löschen</h2>
          <p className="mt-1 text-sm text-muted">Löscht das Konto endgültig mit allen Inseraten, Fotos, Chats und Merklisten (z. B. auf DSGVO-Anfrage). Nicht rückgängig zu machen.</p>
          <ActionButton
            action={adminDeleteUser.bind(null, u.id)}
            confirmText={`Konto ${u.email} endgültig löschen? Das kann nicht rückgängig gemacht werden.`}
            success="Konto gelöscht"
            redirectTo={adminPath("/nutzer")}
            className="btn btn-danger btn-sm mt-3"
          >
            Konto endgültig löschen
          </ActionButton>
        </section>
      )}
    </div>
  );
}
