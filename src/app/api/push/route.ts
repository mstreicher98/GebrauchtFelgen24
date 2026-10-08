import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscription } from "@/db/schema";
import { getVapid } from "@/lib/push";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const v = await getVapid();
  return Response.json({ publicKey: v?.publicKey ?? null });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys.auth || !/^https:\/\//.test(body.endpoint)) {
    return Response.json({ error: "Ungültiges Abo" }, { status: 400 });
  }
  await db
    .insert(pushSubscription)
    .values({ userId: user.id, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth })
    .onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: { userId: user.id, p256dh: body.keys.p256dh, auth: body.keys.auth },
    });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Nicht angemeldet" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (body?.endpoint) {
    await db.delete(pushSubscription).where(and(eq(pushSubscription.userId, user.id), eq(pushSubscription.endpoint, body.endpoint)));
  }
  return Response.json({ ok: true });
}
