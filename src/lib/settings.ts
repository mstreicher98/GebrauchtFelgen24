import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSetting } from "@/db/schema";

export async function getSetting(key: string) {
  const [row] = await db.select().from(appSetting).where(eq(appSetting.key, key)).limit(1);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await db.insert(appSetting).values({ key, value }).onConflictDoUpdate({ target: appSetting.key, set: { value } });
}
