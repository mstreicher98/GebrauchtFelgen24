import "server-only";
import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { conversation, listing, user } from "@/db/schema";
import { emailLayout, escapeHtml, sendMail } from "@/lib/email";
import { env } from "@/lib/env";
import { sendPush } from "@/lib/push";
import { isOnline } from "@/lib/realtime";

const EMAIL_THROTTLE_MS = 15 * 60 * 1000;

/** Benachrichtigt den Empfänger einer Chat-Nachricht per Push und E-Mail (falls offline). */
export async function notifyNewMessage(opts: {
  conversationId: string;
  recipientId: string;
  recipientRole: "buyer" | "seller";
  senderName: string;
  listingTitle: string;
  preview: string;
}) {
  if (isOnline(opts.recipientId)) return;
  const [rcpt] = await db.select().from(user).where(eq(user.id, opts.recipientId)).limit(1);
  if (!rcpt || rcpt.banned) return;
  const url = `${env.appUrl}/nachrichten/${opts.conversationId}`;

  if (rcpt.notifyPush) {
    await sendPush(rcpt.id, {
      title: `Neue Nachricht von ${opts.senderName}`,
      body: `${opts.listingTitle}: ${opts.preview}`.slice(0, 180),
      url: `/nachrichten/${opts.conversationId}`,
      tag: `chat-${opts.conversationId}`,
    });
  }

  if (rcpt.notifyEmail) {
    const col = opts.recipientRole === "buyer" ? conversation.buyerNotifiedAt : conversation.sellerNotifiedAt;
    const colName = opts.recipientRole === "buyer" ? "buyerNotifiedAt" : "sellerNotifiedAt";
    // Atomar „reservieren", damit pro 15 Minuten höchstens eine E-Mail pro Unterhaltung rausgeht
    const updated = await db
      .update(conversation)
      .set({ [colName]: new Date() })
      .where(
        and(
          eq(conversation.id, opts.conversationId),
          sql`(${col} is null or ${col} < ${new Date(Date.now() - EMAIL_THROTTLE_MS)})`,
        ),
      )
      .returning({ id: conversation.id });
    if (updated.length) {
      await sendMail(
        rcpt.email,
        `Neue Nachricht zu „${opts.listingTitle}"`,
        emailLayout({
          title: `${opts.senderName} hat dir geschrieben`,
          bodyHtml: `<p>Zu deinem Inserat bzw. deiner Anfrage <strong>${escapeHtml(opts.listingTitle)}</strong>:</p>
            <blockquote style="border-left:3px solid #0d47a1;margin:16px 0;padding:8px 14px;color:#444">${escapeHtml(opts.preview)}</blockquote>`,
          cta: { label: "Nachricht beantworten", url },
          footerNote: "Antworte bitte direkt im Chat – Antworten auf diese E-Mail kommen nicht an.",
        }),
      );
    }
  }
}

/** Abgelaufene Inserate deaktivieren und 3 Tage vorher erinnern. */
export async function runExpiryJob() {
  const expired = await db
    .update(listing)
    .set({ status: "abgelaufen" })
    .where(and(eq(listing.status, "aktiv"), lt(listing.expiresAt, new Date())))
    .returning({ id: listing.id });

  const soon = await db
    .select({ id: listing.id, title: listing.title, expiresAt: listing.expiresAt, email: user.email, name: user.name, notify: user.notifyEmail })
    .from(listing)
    .innerJoin(user, eq(user.id, listing.userId))
    .where(
      and(
        eq(listing.status, "aktiv"),
        isNull(listing.expiryReminderSentAt),
        lt(listing.expiresAt, new Date(Date.now() + 3 * 86400_000)),
      ),
    )
    .limit(500);
  for (const l of soon) {
    await db.update(listing).set({ expiryReminderSentAt: new Date() }).where(eq(listing.id, l.id));
    if (!l.notify) continue;
    await sendMail(
      l.email,
      `Dein Inserat „${l.title}" läuft bald ab`,
      emailLayout({
        title: "Dein Inserat läuft bald ab",
        bodyHtml: `<p>Hallo ${escapeHtml(l.name)},</p><p>dein Inserat <strong>${escapeHtml(l.title)}</strong> läuft am ${l.expiresAt.toLocaleDateString("de-AT")} ab. Mit einem Klick kannst du es kostenlos um weitere ${env.listingLifetimeDays} Tage verlängern.</p>`,
        cta: { label: "Inserat verlängern", url: `${env.appUrl}/konto/inserate` },
      }),
    );
  }
  if (expired.length) console.info(`[jobs] ${expired.length} Inserate abgelaufen`);
}
