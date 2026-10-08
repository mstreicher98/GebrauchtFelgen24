import "server-only";
import { EventEmitter } from "node:events";
import { pg } from "@/db";

/**
 * Echtzeit-Events für den Chat.
 * Verteilung über PostgreSQL LISTEN/NOTIFY, damit es auch mit mehreren App-Instanzen funktioniert;
 * an die Browser wird per Server-Sent-Events (SSE) ausgeliefert.
 */

export type RealtimeEvent =
  | {
      type: "message";
      conversationId: string;
      message: { id: number; senderId: string; body: string; imageKey: string | null; createdAt: string };
    }
  | { type: "read"; conversationId: string; readerId: string; at: string }
  | { type: "unread"; count: number };

type Envelope = { userIds: string[]; event: RealtimeEvent };

const CHANNEL = "gf_events";

type State = { emitter: EventEmitter; online: Map<string, number>; listening?: Promise<unknown> };
const g = globalThis as unknown as { __gfRealtime?: State };
const state: State = (g.__gfRealtime ??= { emitter: new EventEmitter().setMaxListeners(0), online: new Map() });

function ensureListening() {
  state.listening ??= pg
    .listen(CHANNEL, (payload) => {
      try {
        const env = JSON.parse(payload) as Envelope;
        for (const id of env.userIds) state.emitter.emit(`u:${id}`, env.event);
      } catch {
        /* ignorieren */
      }
    })
    .catch((err) => {
      console.error("[realtime] LISTEN fehlgeschlagen", err);
      state.listening = undefined;
    });
  return state.listening;
}

export async function publish(userIds: string[], event: RealtimeEvent) {
  await ensureListening();
  await pg.notify(CHANNEL, JSON.stringify({ userIds, event } satisfies Envelope));
}

export function subscribe(userId: string, fn: (e: RealtimeEvent) => void) {
  void ensureListening();
  state.emitter.on(`u:${userId}`, fn);
  state.online.set(userId, (state.online.get(userId) ?? 0) + 1);
  return () => {
    state.emitter.off(`u:${userId}`, fn);
    const n = (state.online.get(userId) ?? 1) - 1;
    if (n <= 0) state.online.delete(userId);
    else state.online.set(userId, n);
  };
}

/** Hat der Nutzer gerade ein offenes Browserfenster (auf dieser Instanz)? */
export function isOnline(userId: string) {
  return (state.online.get(userId) ?? 0) > 0;
}
