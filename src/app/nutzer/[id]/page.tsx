import { and, desc, eq } from "drizzle-orm";
import { BadgeCheck, Globe, MapPin, Store, User as UserIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { listing, user } from "@/db/schema";
import { ListingCard, ListingGrid } from "@/components/listing-card";
import { ReportButton } from "@/components/report-button";
import { getFavoriteIds } from "@/lib/favorites";
import { listingCardColumns } from "@/lib/search";
import { getCurrentUser } from "@/lib/session";

const getSeller = cache(async (id: string) => {
  const [u] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return u && !u.banned ? u : null;
});

const displayName = (u: { accountType: string; companyName: string | null; name: string }) =>
  u.accountType === "haendler" && u.companyName ? u.companyName : u.name.split(" ")[0];

export async function generateMetadata(props: PageProps<"/nutzer/[id]">): Promise<Metadata> {
  const u = await getSeller((await props.params).id);
  return u ? { title: `Felgen von ${displayName(u)}` } : { title: "Nutzer nicht gefunden" };
}

export default async function SellerPage(props: PageProps<"/nutzer/[id]">) {
  const { id } = await props.params;
  const [u, me] = await Promise.all([getSeller(id), getCurrentUser()]);
  if (!u) notFound();
  const items = await db
    .select(listingCardColumns)
    .from(listing)
    .innerJoin(user, eq(user.id, listing.userId))
    .where(and(eq(listing.userId, u.id), eq(listing.status, "aktiv")))
    .orderBy(desc(listing.publishedAt))
    .limit(100);
  const favs = await getFavoriteIds(me?.id, items.map((i) => i.id));
  const dealer = u.accountType === "haendler";

  return (
    <div className="container-page py-8">
      <div className="card carbon mb-8 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-brand-soft text-3xl font-bold text-brand">
          {dealer ? <Store className="h-9 w-9" /> : displayName(u).slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold uppercase">{displayName(u)}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1">
              {dealer ? <BadgeCheck className="h-4 w-4 text-brand" /> : <UserIcon className="h-4 w-4" />}
              {dealer ? "Gewerblicher Händler" : "Privatverkäufer"}
            </span>
            {u.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {u.zip} {u.city}
              </span>
            )}
            <span>dabei seit {u.createdAt.toLocaleDateString("de-AT", { month: "long", year: "numeric" })}</span>
            {dealer && u.companyWebsite && (
              <a href={u.companyWebsite} target="_blank" rel="noopener nofollow" className="link flex items-center gap-1">
                <Globe className="h-4 w-4" /> Website
              </a>
            )}
          </p>
          {u.bio && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm text-muted">{u.bio}</p>}
        </div>
        {me?.id !== u.id && <ReportButton targetType="user" targetId={u.id} label="Melden" loggedIn={!!me} />}
      </div>
      <h2 className="font-display mb-5 text-2xl font-bold uppercase">{items.length} aktive Inserate</h2>
      <ListingGrid>
        {items.map((l, i) => (
          <ListingCard key={l.id} l={l} favorite={favs.has(l.id)} index={i} />
        ))}
      </ListingGrid>
    </div>
  );
}
