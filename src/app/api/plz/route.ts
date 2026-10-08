import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { postalCode } from "@/db/schema";

/** PLZ/Ort-Vorschläge: ?q=10 oder ?q=Wien */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const q = p.get("q")?.trim() ?? "";
  const land = p.get("land");
  if (q.length < 2) return Response.json([]);
  const isZip = /^\d+$/.test(q);
  const cond = isZip ? ilike(postalCode.zip, `${q}%`) : or(ilike(postalCode.place, `${q.replace(/[%_]/g, "")}%`));
  const rows = await db
    .selectDistinctOn([postalCode.country, postalCode.zip], {
      country: postalCode.country,
      zip: postalCode.zip,
      place: postalCode.place,
    })
    .from(postalCode)
    .where(land ? and(cond, eq(postalCode.country, land)) : cond)
    .orderBy(postalCode.country, postalCode.zip)
    .limit(10);
  return Response.json(rows, { headers: { "Cache-Control": "public, max-age=86400" } });
}
