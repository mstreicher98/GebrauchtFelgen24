import { desc, eq } from "drizzle-orm";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { savedSearch } from "@/db/schema";
import { SavedSearchRow } from "@/components/saved-search-row";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function SavedSearchesPage() {
  const me = await requireUser("/konto/suchauftraege");
  const rows = await db.select().from(savedSearch).where(eq(savedSearch.userId, me.id)).orderBy(desc(savedSearch.createdAt));
  if (rows.length === 0) {
    return (
      <div className="card flex flex-col items-center p-10 text-center">
        <Bell className="h-10 w-10 text-faint" />
        <p className="mt-3 max-w-md text-muted">
          Noch keine Suchaufträge. Speichere eine Suche mit „Suche speichern“ – wir benachrichtigen dich bei neuen passenden Felgen per E-Mail und Push.
        </p>
        <Link href="/suche" className="btn btn-outline btn-sm mt-4">
          <Search className="h-4 w-4" /> Zur Suche
        </Link>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {rows.map((s) => (
        <SavedSearchRow key={s.id} id={s.id} name={s.name} href={`/suche?${new URLSearchParams(s.query)}`} notify={s.notify} created={formatDate(s.createdAt)} />
      ))}
    </ul>
  );
}
