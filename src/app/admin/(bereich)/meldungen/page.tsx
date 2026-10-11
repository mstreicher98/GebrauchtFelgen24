import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { MessagesSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { conversation, listing, message, report, user } from "@/db/schema";
import { adminSetBanned, adminSetListingStatus, reopenReport } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin-buttons";
import { ResolveReportForm } from "@/components/admin-forms";
import { AdminPageHeader, FilterTabs, TARGET_LABEL } from "@/components/admin-ui";
import { Pagination } from "@/components/pagination";
import { adminPath } from "@/lib/admin-url";
import { env } from "@/lib/env";
import { formatRelative, listingUrl } from "@/lib/format";
import { imageUrl } from "@/lib/image-url";

export const metadata: Metadata = { title: "Meldungen" };

const PER_PAGE = 30;
const TYPES = ["listing", "user", "message", "conversation"] as const;
type TargetType = (typeof TYPES)[number];

export default async function ReportsPage(props: PageProps<"/admin/meldungen">) {
  const sp = await props.searchParams;
  const status = sp.status === "alle" ? "alle" : sp.status === "erledigt" ? "erledigt" : "offen";
  const typ = TYPES.includes(sp.typ as TargetType) ? (sp.typ as TargetType) : null;
  const page = Math.max(1, Number(sp.seite) || 1);

  const where: SQL[] = [];
  if (status !== "alle") where.push(eq(report.status, status));
  if (typ) where.push(eq(report.targetType, typ));
  const handler = alias(user, "handler");

  const [rows, [{ total }], counts] = await Promise.all([
    db
      .select({ r: report, reporter: user.email, reporterId: user.id, handler: handler.name })
      .from(report)
      .leftJoin(user, eq(user.id, report.reporterId))
      .leftJoin(handler, eq(handler.id, report.handledById))
      .where(where.length ? and(...where) : undefined)
      .orderBy(desc(report.createdAt))
      .limit(PER_PAGE)
      .offset((page - 1) * PER_PAGE),
    db.select({ total: sql<number>`count(*)::int` }).from(report).where(where.length ? and(...where) : undefined),
    db
      .select({ t: report.targetType, n: sql<number>`count(*)::int` })
      .from(report)
      .where(status !== "alle" ? eq(report.status, status) : undefined)
      .groupBy(report.targetType),
  ]);

  const ids = (t: TargetType) => rows.filter((x) => x.r.targetType === t).map((x) => x.r.targetId);
  const listingIds = ids("listing").map(Number).filter(Boolean);
  const userIds = ids("user");
  const msgIds = ids("message").map(Number).filter(Boolean);
  const convIds = ids("conversation").filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const buyer = alias(user, "buyer");
  const seller = alias(user, "seller");

  const [listings, users, msgs, convs] = await Promise.all([
    listingIds.length ? db.select({ id: listing.id, title: listing.title, status: listing.status, userId: listing.userId }).from(listing).where(inArray(listing.id, listingIds)) : [],
    userIds.length ? db.select({ id: user.id, name: user.name, email: user.email, banned: user.banned }).from(user).where(inArray(user.id, userIds)) : [],
    msgIds.length
      ? db
          .select({ id: message.id, body: message.body, imageKey: message.imageKey, conversationId: message.conversationId, senderId: message.senderId, senderName: user.name, senderEmail: user.email, senderBanned: user.banned })
          .from(message)
          .innerJoin(user, eq(user.id, message.senderId))
          .where(inArray(message.id, msgIds))
      : [],
    convIds.length
      ? db
          .select({
            id: conversation.id,
            listingTitle: listing.title,
            buyerId: buyer.id,
            buyerName: buyer.name,
            buyerBanned: buyer.banned,
            sellerId: seller.id,
            sellerName: seller.name,
            sellerBanned: seller.banned,
            messages: sql<number>`(select count(*)::int from message m where m.conversation_id = ${conversation.id})`,
          })
          .from(conversation)
          .innerJoin(listing, eq(listing.id, conversation.listingId))
          .innerJoin(buyer, eq(buyer.id, conversation.buyerId))
          .innerJoin(seller, eq(seller.id, conversation.sellerId))
          .where(inArray(conversation.id, convIds))
      : [],
  ]);

  const countOf = (t: TargetType) => counts.find((c) => c.t === t)?.n ?? 0;
  const all = counts.reduce((s, c) => s + c.n, 0);
  const href = (p: { status?: string; typ?: string | null; seite?: number }) => {
    const q = new URLSearchParams();
    const st = p.status ?? status;
    if (st !== "offen") q.set("status", st);
    const t = p.typ === undefined ? typ : p.typ;
    if (t) q.set("typ", t);
    if (p.seite && p.seite > 1) q.set("seite", String(p.seite));
    const s = q.toString();
    return `${adminPath("/meldungen")}${s ? `?${s}` : ""}`;
  };
  const userLink = (id: string, label: string, banned?: boolean) => (
    <Link href={adminPath(`/nutzer/${id}`)} className="link">
      {label}
      {banned && <span className="badge badge-red ml-1">gesperrt</span>}
    </Link>
  );

  return (
    <div>
      <AdminPageHeader title="Meldungen" sub="Gemeldete Inserate, Nutzer, Nachrichten und Unterhaltungen prüfen." />
      <FilterTabs
        items={[
          { href: href({ status: "offen", seite: 1 }), label: "Offen", active: status === "offen" },
          { href: href({ status: "erledigt", seite: 1 }), label: "Erledigt", active: status === "erledigt" },
          { href: href({ status: "alle", seite: 1 }), label: "Alle", active: status === "alle" },
        ]}
      />
      <FilterTabs
        items={[
          { href: href({ typ: null, seite: 1 }), label: "Alle Arten", active: !typ, count: all },
          ...TYPES.map((t) => ({ href: href({ typ: t, seite: 1 }), label: TARGET_LABEL[t], active: typ === t, count: countOf(t) })),
        ]}
      />

      {rows.length === 0 && <div className="card p-8 text-center text-muted">Keine Meldungen in dieser Ansicht.</div>}
      <ul className="space-y-3">
        {rows.map(({ r, reporter, reporterId, handler: handlerName }) => {
          const l = r.targetType === "listing" ? listings.find((x) => x.id === Number(r.targetId)) : null;
          const u = r.targetType === "user" ? users.find((x) => x.id === r.targetId) : null;
          const m = r.targetType === "message" ? msgs.find((x) => x.id === Number(r.targetId)) : null;
          const c = r.targetType === "conversation" ? convs.find((x) => x.id === r.targetId) : null;
          const gone = !l && !u && !m && !c;
          return (
            <li key={r.id} id={`meldung-${r.id}`} className="card scroll-mt-24 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`badge ${r.status === "offen" ? "badge-red" : "badge-green"}`}>{r.status}</span>
                <span className="badge">{TARGET_LABEL[r.targetType]}</span>
                <strong>{r.reason}</strong>
                <span className="text-faint">
                  · {formatRelative(r.createdAt)} · von {reporterId ? userLink(reporterId, reporter ?? "?") : "gelöschtem Konto"}
                </span>
              </div>
              {r.details && <p className="mt-2 whitespace-pre-line text-sm text-muted">„{r.details}“</p>}

              <div className="mt-3 rounded-xl bg-surface-2 p-3 text-sm">
                {l && (
                  <p>
                    Inserat #{l.id}:{" "}
                    <a href={`${env.appUrl}${listingUrl(l)}`} className="link" target="_blank" rel="noreferrer">
                      {l.title}
                    </a>{" "}
                    <span className="text-faint">({l.status})</span> · Verkäufer: {userLink(l.userId, "Profil")}
                  </p>
                )}
                {u && <p>Nutzer: {userLink(u.id, `${u.name} (${u.email})`, u.banned)}</p>}
                {m && (
                  <div className="space-y-1">
                    <p>Absender: {userLink(m.senderId, `${m.senderName} (${m.senderEmail})`, m.senderBanned)}</p>
                    {m.body && <p className="text-muted">Nachricht: „{m.body.slice(0, 500)}“</p>}
                    {m.imageKey && (
                      <a href={imageUrl(m.imageKey, 1600)} target="_blank" rel="noreferrer" className="link">
                        Gesendetes Bild ansehen
                      </a>
                    )}
                  </div>
                )}
                {c && (
                  <div className="space-y-1">
                    <p>
                      Unterhaltung zu „{c.listingTitle}“ · {c.messages} {c.messages === 1 ? "Nachricht" : "Nachrichten"}
                    </p>
                    <p>
                      Käufer: {userLink(c.buyerId, c.buyerName, c.buyerBanned)} · Verkäufer: {userLink(c.sellerId, c.sellerName, c.sellerBanned)}
                    </p>
                  </div>
                )}
                {gone && <p className="text-faint">Das gemeldete Element wurde inzwischen gelöscht.</p>}
              </div>

              {r.status === "erledigt" && (r.handledAt || r.resolution) && (
                <p className="mt-2 text-xs text-faint">
                  Erledigt {r.handledAt ? formatRelative(r.handledAt) : ""} {handlerName ? `von ${handlerName}` : ""}
                  {r.resolution ? ` – ${r.resolution}` : ""}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {r.status === "offen" ? (
                  <ResolveReportForm id={r.id} />
                ) : (
                  <ActionButton action={reopenReport.bind(null, r.id)} success="Wieder geöffnet">
                    Wieder öffnen
                  </ActionButton>
                )}
                {(m || c) && (
                  <Link href={adminPath(`/unterhaltungen/${m ? m.conversationId : c!.id}${m ? `#nachricht-${m.id}` : ""}`)} className="btn btn-outline btn-sm">
                    <MessagesSquare className="h-4 w-4" aria-hidden="true" /> Unterhaltung ansehen
                  </Link>
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
                {m && !m.senderBanned && (
                  <ActionButton action={adminSetBanned.bind(null, m.senderId, true)} confirmText="Absender sperren?" className="btn btn-danger btn-sm">
                    Absender sperren
                  </ActionButton>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} makeHref={(p) => href({ seite: p })} />
    </div>
  );
}
