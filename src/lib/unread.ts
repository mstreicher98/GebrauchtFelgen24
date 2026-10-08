import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/** Anzahl der Unterhaltungen mit ungelesenen Nachrichten für einen Nutzer. */
export async function countUnread(userId: string) {
  const rows = await db.execute<{ n: number }>(sql`
    select count(*)::int as n from conversation c
    where (
      (c.buyer_id = ${userId} and not c.buyer_archived and exists (
        select 1 from message m where m.conversation_id = c.id and m.sender_id <> ${userId}
          and (c.buyer_last_read_at is null or m.created_at > c.buyer_last_read_at)))
      or
      (c.seller_id = ${userId} and not c.seller_archived and exists (
        select 1 from message m where m.conversation_id = c.id and m.sender_id <> ${userId}
          and (c.seller_last_read_at is null or m.created_at > c.seller_last_read_at)))
    )`);
  return rows[0]?.n ?? 0;
}
