import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "./auth";

/** Aktueller Nutzer inkl. aller eigenen Felder (oder null). Pro Request gecacht. */
export const getCurrentUser = cache(async () => {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const [u] = await db.select().from(user).where(eq(user.id, s.user.id)).limit(1);
  if (!u || u.banned) return null;
  return u;
});

export async function requireUser(next?: string) {
  const u = await getCurrentUser();
  if (!u) redirect(`/anmelden${next ? `?weiter=${encodeURIComponent(next)}` : ""}`);
  return u;
}

export async function requireAdmin() {
  const u = await requireUser("/admin");
  if (u.role !== "admin") redirect("/");
  return u;
}
