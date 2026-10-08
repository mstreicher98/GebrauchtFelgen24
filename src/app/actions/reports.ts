"use server";
import { db } from "@/db";
import { report } from "@/db/schema";
import { REPORT_REASONS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";

export async function createReport(
  targetType: "listing" | "user" | "message",
  targetId: string,
  reason: string,
  details: string,
): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Bitte melde dich an, um etwas zu melden." };
  if (!REPORT_REASONS.includes(reason)) return { error: "Bitte einen Grund wählen." };
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
