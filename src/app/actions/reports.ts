"use server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { conversation, message, report } from "@/db/schema";
import { REPORT_REASONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

export async function createReport(
  targetType: "listing" | "user" | "message" | "conversation",
  targetId: string,
  reason: string,
  details: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte melde dich an, um etwas zu melden." };
  if (!REPORT_REASONS.includes(reason)) return { error: "Bitte einen Grund wählen." };
  if (targetType === "message") {
    // Nur empfangene Nachrichten aus eigenen Unterhaltungen dürfen gemeldet werden
    const id = Number(targetId);
    const [m] = Number.isInteger(id)
      ? await db
          .select({ senderId: message.senderId, buyerId: conversation.buyerId, sellerId: conversation.sellerId })
          .from(message)
          .innerJoin(conversation, eq(conversation.id, message.conversationId))
          .where(eq(message.id, id))
          .limit(1)
      : [];
    if (!m || m.senderId === user.id || (m.buyerId !== user.id && m.sellerId !== user.id)) return { error: "Diese Nachricht kann nicht gemeldet werden." };
  }
  if (targetType === "conversation") {
    // Nur eigene Unterhaltungen dürfen gemeldet werden
    const [c] = /^[0-9a-f-]{36}$/i.test(targetId)
      ? await db.select({ buyerId: conversation.buyerId, sellerId: conversation.sellerId }).from(conversation).where(eq(conversation.id, targetId)).limit(1)
      : [];
    if (!c || (c.buyerId !== user.id && c.sellerId !== user.id)) return { error: "Diese Unterhaltung kann nicht gemeldet werden." };
  }
  if (!rateLimit(`report:${user.id}`, 10, 60 * 60 * 1000)) return { error: "Zu viele Meldungen – bitte später erneut versuchen." };
  await db.insert(report).values({
    reporterId: user.id,
    targetType,
    targetId: targetId.slice(0, 64),
    reason,
    details: details.trim().slice(0, 2000) || null,
  });
  return {};
}
