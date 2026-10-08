import "server-only";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, pg } from "@/db";
import { user } from "@/db/schema";
import { env } from "@/lib/env";
import { getVapid } from "@/lib/push";
import { runCleanupJob } from "./cleanup-job";
import { runExpiryJob } from "./notify";
import { runSavedSearchJob } from "./saved-search-job";
import { seedDemo } from "./seed-demo";
import { seedPostalCodes } from "./seed-postal";
import { seedVehicles } from "./seed-vehicles";

const LOCK_ID = 7_240_024;

async function withLock<T>(fn: () => Promise<T>) {
  const [res] = await pg`select pg_try_advisory_lock(${LOCK_ID}) as ok`;
  if (!res.ok) return null;
  try {
    return await fn();
  } finally {
    await pg`select pg_advisory_unlock(${LOCK_ID})`;
  }
}

async function waitForDb(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await pg`select 1`;
      return;
    } catch {
      console.info(`[bootstrap] Warte auf Datenbank … (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error("Datenbank nicht erreichbar");
}

function every(ms: number, name: string, job: () => Promise<unknown>) {
  const run = () =>
    withLock(job).catch((err) => console.error(`[jobs] ${name} fehlgeschlagen`, err));
  setTimeout(run, 30_000);
  setInterval(run, ms).unref();
}

export async function bootstrap() {
  await waitForDb();
  // Migrationen laufen unter einer Sperre – mehrere Instanzen starten sicher.
  await pg`select pg_advisory_lock(${LOCK_ID})`;
  try {
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    await seedVehicles();
    await seedPostalCodes();
    if (env.adminEmail) {
      await db.update(user).set({ role: "admin" }).where(eq(sql`lower(${user.email})`, env.adminEmail));
    }
    await seedDemo();
  } finally {
    await pg`select pg_advisory_unlock(${LOCK_ID})`;
  }
  await getVapid();

  every(60 * 60 * 1000, "Ablauf", runExpiryJob);
  every(30 * 60 * 1000, "Suchaufträge", runSavedSearchJob);
  every(6 * 60 * 60 * 1000, "Aufräumen", runCleanupJob);
  console.info("[bootstrap] bereit");
}
