import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgres://felgen:felgen@localhost:5432/felgen";

const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

export const pg =
  globalForDb.pgClient ??
  postgres(url, {
    max: Number(process.env.DATABASE_POOL_SIZE ?? 10),
    idle_timeout: 30,
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = pg;

export const db = drizzle(pg, { schema });
export type Db = typeof db;
