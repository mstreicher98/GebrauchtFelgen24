import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { listingImage } from "@/db/schema";
import { MAX_IMAGES } from "@/lib/constants";
import { MAX_UPLOAD_BYTES, processAndStoreImage } from "@/lib/images";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Bild-Upload für Inserate & Chat. Liefert einen Bild-Schlüssel zurück. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Bitte melde dich an." }, { status: 401 });
  if (!user.emailVerified) return Response.json({ error: "Bitte bestätige zuerst deine E-Mail-Adresse." }, { status: 403 });
  if (!rateLimit(`upload:${user.id}`, 60, 10 * 60 * 1000)) {
    return Response.json({ error: "Zu viele Uploads – bitte kurz warten." }, { status: 429 });
  }

  const [{ pending }] = await db
    .select({ pending: sql<number>`count(*)::int` })
    .from(listingImage)
    .where(and(eq(listingImage.userId, user.id), isNull(listingImage.listingId)));
  if (pending > MAX_IMAGES * 4) {
    return Response.json({ error: "Zu viele nicht zugeordnete Bilder. Bitte speichere zuerst dein Inserat." }, { status: 429 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Keine Datei erhalten." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return Response.json({ error: "Datei ist zu groß (max. 15 MB)." }, { status: 413 });

  try {
    const img = await processAndStoreImage(Buffer.from(await file.arrayBuffer()));
    // Chat-Bilder werden direkt der Nachricht zugeordnet, Inseratsbilder zunächst „frei" gespeichert
    if (new URL(req.url).searchParams.get("zweck") !== "chat") {
      await db.insert(listingImage).values({ key: img.key, userId: user.id, width: img.width, height: img.height });
    }
    return Response.json(img);
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Bild konnte nicht verarbeitet werden." }, { status: 400 });
  }
}
