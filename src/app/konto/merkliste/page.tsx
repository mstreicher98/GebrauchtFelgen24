import { desc, eq } from "drizzle-orm";
import { Heart } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { favorite, listing, user } from "@/db/schema";
import { ListingCard } from "@/components/listing-card";
import { listingCardColumns } from "@/lib/search";
import { requireUser } from "@/lib/session";

export default async function FavoritesPage() {
  const me = await requireUser("/konto/merkliste");
  const rows = await db
    .select(listingCardColumns)
    .from(favorite)
    .innerJoin(listing, eq(listing.id, favorite.listingId))
    .innerJoin(user, eq(user.id, listing.userId))
    .where(eq(favorite.userId, me.id))
    .orderBy(desc(favorite.createdAt));
  if (rows.length === 0) {
    return (
      <div className="card flex flex-col items-center p-10 text-center">
        <Heart className="h-10 w-10 text-faint" />
        <p className="mt-3 text-muted">Deine Merkliste ist leer. Tippe auf das Herz bei einem Inserat, um es dir zu merken.</p>
        <Link href="/suche" className="btn btn-outline btn-sm mt-4">Felgen entdecken</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((l, i) => (
        <ListingCard key={l.id} l={l} favorite index={i} headingLevel={2} />
      ))}
    </div>
  );
}
