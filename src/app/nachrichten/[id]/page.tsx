import { and, asc, eq, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { block, conversation, listing, listingImage, message, user } from "@/db/schema";
import { ChatThread } from "@/components/chat-thread";
import { listingUrl } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function ConversationPage(props: PageProps<"/nachrichten/[id]">) {
  const { id } = await props.params;
  const me = await requireUser(`/nachrichten/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [c] = await db.select().from(conversation).where(eq(conversation.id, id)).limit(1);
  if (!c || (c.buyerId !== me.id && c.sellerId !== me.id)) notFound();
  const otherId = c.buyerId === me.id ? c.sellerId : c.buyerId;

  const [[l], [img], [other], msgs, blocks] = await Promise.all([
    db.select().from(listing).where(eq(listing.id, c.listingId)).limit(1),
    db.select({ key: listingImage.key }).from(listingImage).where(eq(listingImage.listingId, c.listingId)).orderBy(asc(listingImage.position)).limit(1),
    db.select().from(user).where(eq(user.id, otherId)).limit(1),
    db.select().from(message).where(eq(message.conversationId, id)).orderBy(asc(message.id)).limit(500),
    db
      .select()
      .from(block)
      .where(or(and(eq(block.blockerId, me.id), eq(block.blockedId, otherId)), and(eq(block.blockerId, otherId), eq(block.blockedId, me.id)))),
  ]);

  const otherReadAt = c.buyerId === me.id ? c.sellerLastReadAt : c.buyerLastReadAt;

  return (
    <ChatThread
      key={id}
      conversationId={id}
      meId={me.id}
      other={{
        id: otherId,
        name: other?.accountType === "haendler" && other.companyName ? other.companyName : (other?.name.split(" ")[0] ?? "Gelöschter Nutzer"),
        isDealer: other?.accountType === "haendler",
      }}
      listing={{ id: l.id, title: l.title, url: listingUrl(l), priceCents: l.priceCents, imageKey: img?.key ?? null, status: l.status }}
      initialMessages={msgs.map((m) => ({ id: m.id, senderId: m.senderId, body: m.body, imageKey: m.imageKey, createdAt: m.createdAt.toISOString() }))}
      otherLastReadAt={otherReadAt?.toISOString() ?? null}
      blocked={{ byMe: blocks.some((b) => b.blockerId === me.id), byOther: blocks.some((b) => b.blockerId === otherId) }}
    />
  );
}
