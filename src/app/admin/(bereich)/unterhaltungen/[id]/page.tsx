import { clsx } from "clsx";
import { and, asc, desc, eq, gt, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { adminLog, conversation, listing, message, report, user } from "@/db/schema";
import { adminSetBanned, resolveConversationReports } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin-buttons";
import { AdminPageHeader } from "@/components/admin-ui";
import { adminPath } from "@/lib/admin-url";
import { env } from "@/lib/env";
import { formatRelative, listingUrl } from "@/lib/format";
import { imageUrl } from "@/lib/image-url";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Unterhaltung" };

const VIEW_ACTION = "Unterhaltung eingesehen";
const DT = new Intl.DateTimeFormat("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Einsicht protokollieren – höchstens einmal je 30 Minuten pro Admin, damit Neuladen nicht doppelt zählt. */
async function logView(adminId: string, conversationId: string) {
  const [recent] = await db
    .select({ id: adminLog.id })
    .from(adminLog)
    .where(and(eq(adminLog.adminId, adminId), eq(adminLog.action, VIEW_ACTION), eq(adminLog.targetId, conversationId), gt(adminLog.createdAt, new Date(Date.now() - 30 * 60_000))))
    .limit(1);
  if (!recent) await db.insert(adminLog).values({ adminId, action: VIEW_ACTION, targetType: "conversation", targetId: conversationId });
}

/**
 * Verlauf einer gemeldeten Unterhaltung. Datenschutz: nur einsehbar, wenn die Unterhaltung
 * oder eine ihrer Nachrichten gemeldet wurde; jede Einsicht wird im Protokoll vermerkt.
 */
export default async function ConversationPage(props: PageProps<"/admin/unterhaltungen/[id]">) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const buyer = alias(user, "buyer");
  const seller = alias(user, "seller");
  const [c] = await db
    .select({
      id: conversation.id,
      createdAt: conversation.createdAt,
      listingId: listing.id,
      listingTitle: listing.title,
      buyer: { id: buyer.id, name: buyer.name, email: buyer.email, banned: buyer.banned },
      seller: { id: seller.id, name: seller.name, email: seller.email, banned: seller.banned },
    })
    .from(conversation)
    .innerJoin(listing, eq(listing.id, conversation.listingId))
    .innerJoin(buyer, eq(buyer.id, conversation.buyerId))
    .innerJoin(seller, eq(seller.id, conversation.sellerId))
    .where(eq(conversation.id, id))
    .limit(1);
  if (!c) notFound();

  const msgIds = sql`(select m.id::text from message m where m.conversation_id = ${id})`;
  const reports = await db
    .select({ id: report.id, targetType: report.targetType, targetId: report.targetId, reason: report.reason, details: report.details, status: report.status, createdAt: report.createdAt, reporterId: report.reporterId })
    .from(report)
    .where(or(and(eq(report.targetType, "conversation"), eq(report.targetId, id)), and(eq(report.targetType, "message"), inArray(report.targetId, msgIds))))
    .orderBy(desc(report.createdAt));

  if (reports.length === 0) {
    return (
      <div>
        <AdminPageHeader title="Unterhaltung" />
        <div className="card flex max-w-xl items-start gap-3 p-6 text-sm text-muted">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-faint" aria-hidden="true" />
          <p>Aus Datenschutzgründen können nur Unterhaltungen eingesehen werden, die gemeldet wurden. Zu dieser Unterhaltung liegt keine Meldung vor.</p>
        </div>
      </div>
    );
  }

  const me = (await getCurrentUser())!;
  const [messages] = await Promise.all([db.select().from(message).where(eq(message.conversationId, id)).orderBy(asc(message.id)), logView(me.id, id)]);
  const reported = new Set(reports.filter((r) => r.targetType === "message").map((r) => Number(r.targetId)));
  const open = reports.filter((r) => r.status === "offen");
  const people = [
    { role: "Käufer", ...c.buyer },
    { role: "Verkäufer", ...c.seller },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Unterhaltung"
        sub={
          <>
            Zu{" "}
            <a href={`${env.appUrl}${listingUrl({ id: c.listingId, title: c.listingTitle })}`} target="_blank" rel="noreferrer" className="link">
              „{c.listingTitle}“
            </a>{" "}
            · begonnen {formatRelative(c.createdAt)} · {messages.length} {messages.length === 1 ? "Nachricht" : "Nachrichten"}
          </>
        }
      >
        <Link href={adminPath("/meldungen")} className="btn btn-outline btn-sm">
          ← Meldungen
        </Link>
      </AdminPageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <section aria-label="Verlauf" className="card min-w-0 p-3 sm:p-5">
          <ol className="space-y-2">
            {messages.map((m) => {
              const fromSeller = m.senderId === c.seller.id;
              const flagged = reported.has(m.id);
              return (
                <li key={m.id} id={`nachricht-${m.id}`} className={clsx("flex scroll-mt-24", fromSeller ? "justify-end" : "justify-start")}>
                  <div
                    className={clsx(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-[0.95rem] sm:max-w-[70%]",
                      fromSeller ? "rounded-br-md bg-brand-soft" : "rounded-bl-md bg-surface-2",
                      flagged && "ring-2 ring-[var(--red)]",
                    )}
                  >
                    <p className="mb-0.5 text-[11px] font-semibold text-muted">
                      {fromSeller ? c.seller.name : c.buyer.name} · {fromSeller ? "Verkäufer" : "Käufer"}
                      {flagged && <span className="badge badge-red ml-1.5">gemeldet</span>}
                    </p>
                    {m.imageKey && (
                      <a href={imageUrl(m.imageKey, 1600)} target="_blank" rel="noreferrer" className="mb-1 block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl(m.imageKey, 400)} alt="Gesendetes Bild" className="max-h-48 rounded-lg" />
                      </a>
                    )}
                    {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                    <p className="mt-0.5 text-right text-[10px] text-faint">{DT.format(m.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="space-y-4">
          <section className="card p-4">
            <h2 className="font-display mb-3 text-base uppercase">Beteiligte</h2>
            <ul className="space-y-3 text-sm">
              {people.map((p) => (
                <li key={p.id}>
                  <p className="text-xs text-faint">{p.role}</p>
                  <Link href={adminPath(`/nutzer/${p.id}`)} className="link font-semibold">
                    {p.name}
                  </Link>
                  {p.banned && <span className="badge badge-red ml-1">gesperrt</span>}
                  <p className="truncate text-xs text-muted">{p.email}</p>
                  {!p.banned && (
                    <ActionButton action={adminSetBanned.bind(null, p.id, true)} confirmText={`${p.name} sperren? Alle Sitzungen werden beendet und aktive Inserate gesperrt.`} className="btn btn-danger btn-sm mt-1.5">
                      Sperren
                    </ActionButton>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-4">
            <h2 className="font-display mb-3 text-base uppercase">Meldungen ({reports.length})</h2>
            <ul className="space-y-2.5 text-sm">
              {reports.map((r) => (
                <li key={r.id}>
                  <span className={`badge ${r.status === "offen" ? "badge-red" : "badge-green"} mr-1`}>{r.status}</span>
                  <strong>{r.reason}</strong>
                  <span className="text-xs text-faint">
                    {" "}
                    · {r.targetType === "message" ? "Nachricht" : "Unterhaltung"} · {formatRelative(r.createdAt)}
                    {r.reporterId === c.buyer.id ? " · vom Käufer" : r.reporterId === c.seller.id ? " · vom Verkäufer" : ""}
                  </span>
                  {r.details && <p className="mt-0.5 text-xs text-muted">„{r.details}“</p>}
                </li>
              ))}
            </ul>
            {open.length > 0 && (
              <ActionButton
                action={resolveConversationReports.bind(null, id)}
                success="Meldungen erledigt"
                className="btn btn-brand btn-sm mt-3 w-full"
              >
                Alle {open.length} offenen Meldungen erledigen
              </ActionButton>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
