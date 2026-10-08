import "server-only";

const buckets = new Map<string, { count: number; reset: number }>();

/** Einfache In-Memory-Begrenzung (pro Instanz). Gibt `false` zurück, wenn das Limit erreicht ist. */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 50_000) {
      for (const [k, v] of buckets) if (v.reset < now) buckets.delete(k);
    }
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}
