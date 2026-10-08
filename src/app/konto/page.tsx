import { and, eq, sql } from "drizzle-orm";
import { ArrowRight, Bell, Eye, Heart, LayoutList, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { favorite, listing, savedSearch } from "@/db/schema";
import { PushOptIn } from "@/components/push-opt-in";
import { VerifyEmailNotice } from "@/components/verify-email-notice";
import { requireUser } from "@/lib/session";
import { countUnread } from "@/lib/unread";

export default async function AccountPage() {
  const me = await requireUser("/konto");
  const [[stats], [favs], [searches], unread] = await Promise.all([
    db
      .select({
        active: sql<number>`count(*) filter (where ${listing.status} = 'aktiv')::int`,
        total: sql<number>`count(*)::int`,
        views: sql<number>`coalesce(sum(${listing.viewCount}), 0)::int`,
      })
      .from(listing)
      .where(eq(listing.userId, me.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(favorite).where(eq(favorite.userId, me.id)),
    db.select({ n: sql<number>`count(*)::int` }).from(savedSearch).where(and(eq(savedSearch.userId, me.id))),
    countUnread(me.id),
  ]);

  if (!me.emailVerified) return <VerifyEmailNotice email={me.email} />;

  const tiles = [
    { href: "/konto/inserate", label: "Aktive Inserate", value: `${stats.active} / ${stats.total}`, icon: LayoutList },
    { href: "/nachrichten", label: "Ungelesene Chats", value: unread, icon: MessageCircle, highlight: unread > 0 },
    { href: "/konto/merkliste", label: "Gemerkt", value: favs.n, icon: Heart },
    { href: "/konto/suchauftraege", label: "Suchaufträge", value: searches.n, icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {tiles.map((t, i) => (
          <Link key={t.href} href={t.href} className="card reveal group p-5 transition-colors hover:border-brand" style={{ ["--reveal-delay" as string]: `${i * 60}ms` }}>
            <t.icon className={t.highlight ? "h-5 w-5 text-red" : "h-5 w-5 text-brand"} />
            <p className="font-display mt-3 text-3xl font-bold">{t.value}</p>
            <p className="text-sm text-muted">{t.label}</p>
          </Link>
        ))}
      </div>
      <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Deine Inserate wurden {stats.views.toLocaleString("de-AT")}× angesehen</h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted">
            <Eye className="h-4 w-4" /> Mehr Fotos und genaue Daten (ET, Mittenloch) bringen mehr Anfragen.
          </p>
        </div>
        <Link href="/inserat/neu" className="btn btn-brand">
          <Plus className="h-4 w-4" /> Neues Inserat
        </Link>
      </div>
      <PushOptIn />
      <Link href="/konto/einstellungen" className="flex items-center justify-between rounded-2xl border border-line px-5 py-4 text-sm text-muted hover:border-brand hover:text-fg">
        Profil, Händlerdaten und Benachrichtigungen bearbeiten <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
