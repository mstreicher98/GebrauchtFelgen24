import "server-only";
import { eq } from "drizzle-orm";
import webpush from "web-push";
import { db } from "@/db";
import { pushSubscription } from "@/db/schema";
import { env } from "./env";
import { getSetting, setSetting } from "./settings";

let configured: Promise<{ publicKey: string } | null> | null = null;

/** VAPID-Schlüssel aus ENV oder (automatisch erzeugt) aus der Datenbank. */
export function getVapid() {
  configured ??= (async () => {
    let publicKey = process.env.VAPID_PUBLIC_KEY || null;
    let privateKey = process.env.VAPID_PRIVATE_KEY || null;
    try {
      if (!publicKey || !privateKey) {
        publicKey = await getSetting("vapid_public");
        privateKey = await getSetting("vapid_private");
        if (!publicKey || !privateKey) {
          const keys = webpush.generateVAPIDKeys();
          await setSetting("vapid_public", keys.publicKey);
          await setSetting("vapid_private", keys.privateKey);
          publicKey = keys.publicKey;
          privateKey = keys.privateKey;
        }
      }
      const subject = process.env.VAPID_SUBJECT || `mailto:${env.adminEmail || "office@gebrauchtfelgen24.at"}`;
      webpush.setVapidDetails(subject, publicKey, privateKey);
      return { publicKey };
    } catch (err) {
      console.error("[push] VAPID-Konfiguration fehlgeschlagen", err);
      configured = null;
      return null;
    }
  })();
  return configured;
}

export type PushPayload = { title: string; body: string; url: string; tag?: string };

export async function sendPush(userId: string, payload: PushPayload) {
  if (!(await getVapid())) return;
  const subs = await db.select().from(pushSubscription).where(eq(pushSubscription.userId, userId));
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 60 * 60 * 24 },
        );
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.delete(pushSubscription).where(eq(pushSubscription.id, s.id));
        } else {
          console.warn("[push] Versand fehlgeschlagen", code);
        }
      }
    }),
  );
}
