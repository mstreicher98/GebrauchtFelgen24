import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type ConversationSummary = {
  id: string;
  listingId: number;
  listingTitle: string;
  listingStatus: string;
  priceCents: number;
  imageKey: string | null;
  otherId: string;
  otherName: string;
  role: "buyer" | "seller";
  lastBody: string | null;
  lastImage: boolean;
  lastSenderId: string | null;
  lastMessageAt: string;
  unread: boolean;
};

export async function listConversations(userId: string): Promise<ConversationSummary[]> {
  const rows = await db.execute<Record<string, unknown>>(sql`
    select c.id, c.listing_id, l.title as listing_title, l.status as listing_status, l.price_cents,
      (select key from listing_image li where li.listing_id = l.id order by position limit 1) as image_key,
      case when c.buyer_id = ${userId} then c.seller_id else c.buyer_id end as other_id,
      case when c.buyer_id = ${userId} then 'buyer' else 'seller' end as role,
      coalesce(case when ou.account_type = 'haendler' then ou.company_name end, split_part(ou.name, ' ', 1)) as other_name,
      lm.body as last_body, lm.image_key is not null as last_image, lm.sender_id as last_sender_id, c.last_message_at,
      (lm.sender_id <> ${userId} and lm.created_at > coalesce(case when c.buyer_id = ${userId} then c.buyer_last_read_at else c.seller_last_read_at end, 'epoch'::timestamptz)) as unread
    from conversation c
    join listing l on l.id = c.listing_id
    join "user" ou on ou.id = case when c.buyer_id = ${userId} then c.seller_id else c.buyer_id end
    left join lateral (select body, image_key, sender_id, created_at from message m where m.conversation_id = c.id order by m.id desc limit 1) lm on true
    where (c.buyer_id = ${userId} and not c.buyer_archived) or (c.seller_id = ${userId} and not c.seller_archived)
    order by c.last_message_at desc
    limit 200`);
  return rows.map((r) => ({
    id: r.id as string,
    listingId: r.listing_id as number,
    listingTitle: r.listing_title as string,
    listingStatus: r.listing_status as string,
    priceCents: r.price_cents as number,
    imageKey: (r.image_key as string) ?? null,
    otherId: r.other_id as string,
    otherName: r.other_name as string,
    role: r.role as "buyer" | "seller",
    lastBody: (r.last_body as string) ?? null,
    lastImage: !!r.last_image,
    lastSenderId: (r.last_sender_id as string) ?? null,
    lastMessageAt: new Date(r.last_message_at as string).toISOString(),
    unread: !!r.unread,
  }));
}
