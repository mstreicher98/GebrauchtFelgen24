"use server";
import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { block, conversation, listing, message, user } from "@/db/schema";
import { isValidKey } from "@/lib/images";
import { rateLimit } from "@/lib/rate-limit";
import { publish } from "@/lib/realtime";
import { getCurrentUser } from "@/lib/session";
import { countUnread } from "@/lib/unread";
import { notifyNewMessage } from "@/server/notify";

const MAX_LEN = 2000;

async function isBlocked(a: string, b: string) {
  const rows = await db
    .select({ x: block.blockerId })
    .from(block)
    .where(or(and(eq(block.blockerId, a), eq(block.blockedId, b)), and(eq(block.blockerId, b), eq(block.blockedId, a))))
    .limit(1);
  return rows.length > 0;
}

export async function startConversation(listingId: number, body: string): Promise<{ error?: string; id?: string }> {
  const me = await getCurrentUser();
  if (!me) return { error: "login" };
  if (!me.emailVerified) return { error: "Bitte bestätige zuerst deine E-Mail-Adresse." };
  const [l] = await db.select().from(listing).where(eq(listing.id, listingId)).limit(1);
  if (!l || l.status !== "aktiv") return { error: "Dieses Inserat ist nicht mehr aktiv." };
  if (l.userId === me.id) return { error: "Das ist dein eigenes Inserat." };
  if (await isBlocked(me.id, l.userId)) return { error: "Eine Kontaktaufnahme ist nicht möglich." };

  const [conv] = await db
    .insert(conversation)
    .values({ listingId, buyerId: me.id, sellerId: l.userId })
    .onConflictDoUpdate({
      target: [conversation.listingId, conversation.buyerId],
      set: { buyerArchived: false },
    })
    .returning({ id: conversation.id });

  const res = await sendMessage(conv.id, body, null);
  if (res.error) return res;
  return { id: conv.id };
}

export async function sendMessage(
  conversationId: string,
  body: string,
  imageKey: string | null,
): Promise<{ error?: string; message?: { id: number; createdAt: string } }> {
  const me = await getCurrentUser();
  if (!me) return { error: "login" };
  const text = body.trim().slice(0, MAX_LEN);
  if (!text && !imageKey) return { error: "Nachricht ist leer." };
  if (imageKey && !isValidKey(imageKey)) return { error: "Ungültiges Bild." };
  if (!rateLimit(`msg:${me.id}`, 30, 60_000)) return { error: "Du sendest zu schnell – bitte kurz warten." };

  const [c] = await db
    .select({ c: conversation, listingTitle: listing.title })
    .from(conversation)
    .innerJoin(listing, eq(listing.id, conversation.listingId))
    .where(eq(conversation.id, conversationId))
    .limit(1);
  if (!c || (c.c.buyerId !== me.id && c.c.sellerId !== me.id)) return { error: "Unterhaltung nicht gefunden." };
  const isBuyer = c.c.buyerId === me.id;
  const otherId = isBuyer ? c.c.sellerId : c.c.buyerId;
  if (await isBlocked(me.id, otherId)) return { error: "Diese Unterhaltung ist blockiert." };

  const now = new Date();
  const [m] = await db.insert(message).values({ conversationId, senderId: me.id, body: text, imageKey }).returning();
  await db
    .update(conversation)
    .set({
      lastMessageAt: now,
      buyerArchived: false,
      sellerArchived: false,
      ...(isBuyer ? { buyerLastReadAt: now } : { sellerLastReadAt: now }),
    })
    .where(eq(conversation.id, conversationId));

  const payload = {
    type: "message" as const,
    conversationId,
    message: { id: m.id, senderId: me.id, body: m.body, imageKey: m.imageKey, createdAt: m.createdAt.toISOString() },
  };
  await publish([me.id, otherId], payload);
  await publish([otherId], { type: "unread", count: await countUnread(otherId) });

  void notifyNewMessage({
    conversationId,
    recipientId: otherId,
    recipientRole: isBuyer ? "seller" : "buyer",
    senderName: me.accountType === "haendler" && me.companyName ? me.companyName : me.name.split(" ")[0],
    listingTitle: c.listingTitle,
    preview: text || "📷 Bild",
  }).catch((err) => console.error("[notify]", err));

  return { message: { id: m.id, createdAt: m.createdAt.toISOString() } };
}

export async function markConversationRead(conversationId: string) {
  const me = await getCurrentUser();
  if (!me) return;
  const [c] = await db.select().from(conversation).where(eq(conversation.id, conversationId)).limit(1);
  if (!c || (c.buyerId !== me.id && c.sellerId !== me.id)) return;
  const now = new Date();
  await db
    .update(conversation)
    .set(c.buyerId === me.id ? { buyerLastReadAt: now } : { sellerLastReadAt: now })
    .where(eq(conversation.id, conversationId));
  const otherId = c.buyerId === me.id ? c.sellerId : c.buyerId;
  await publish([otherId], { type: "read", conversationId, readerId: me.id, at: now.toISOString() });
  await publish([me.id], { type: "unread", count: await countUnread(me.id) });
}

export async function archiveConversation(conversationId: string) {
  const me = await getCurrentUser();
  if (!me) return;
  const [c] = await db.select().from(conversation).where(eq(conversation.id, conversationId)).limit(1);
  if (!c || (c.buyerId !== me.id && c.sellerId !== me.id)) return;
  await db
    .update(conversation)
    .set(c.buyerId === me.id ? { buyerArchived: true } : { sellerArchived: true })
    .where(eq(conversation.id, conversationId));
  await publish([me.id], { type: "unread", count: await countUnread(me.id) });
  revalidatePath("/nachrichten");
}

export async function setBlocked(otherUserId: string, blocked: boolean): Promise<{ error?: string }> {
  const me = await getCurrentUser();
  if (!me) return { error: "login" };
  if (otherUserId === me.id) return { error: "Das geht nicht." };
  const [other] = await db.select({ id: user.id }).from(user).where(eq(user.id, otherUserId)).limit(1);
  if (!other) return { error: "Nutzer nicht gefunden" };
  if (blocked) await db.insert(block).values({ blockerId: me.id, blockedId: otherUserId }).onConflictDoNothing();
  else await db.delete(block).where(and(eq(block.blockerId, me.id), eq(block.blockedId, otherUserId)));
  revalidatePath("/nachrichten");
  revalidatePath("/konto/einstellungen");
  return {};
}
