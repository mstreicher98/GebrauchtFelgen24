import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { subscribe } from "@/lib/realtime";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Server-Sent-Events: Echtzeit-Updates für den angemeldeten Nutzer. */
export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!me) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      send("retry: 3000\n\n");
      const unsubscribe = subscribe(me.id, (event) => send(`data: ${JSON.stringify(event)}\n\n`));
      const ping = setInterval(() => send(": ping\n\n"), 25_000);
      void db.update(user).set({ lastSeenAt: new Date() }).where(eq(user.id, me.id)).catch(() => {});
      cleanup = () => {
        clearInterval(ping);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      };
      req.signal.addEventListener("abort", () => cleanup());
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
