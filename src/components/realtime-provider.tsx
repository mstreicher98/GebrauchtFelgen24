"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Ctx = { unread: number };
const RealtimeContext = createContext<Ctx>({ unread: 0 });

export function useUnread() {
  return useContext(RealtimeContext).unread;
}

/**
 * Eine SSE-Verbindung pro Tab. Events werden zusätzlich als `gf:rt` auf `window` verteilt,
 * damit z. B. der Chat sie empfangen kann.
 */
export function RealtimeProvider({ initialUnread, children }: { initialUnread: number; children: React.ReactNode }) {
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    let es: EventSource | null = null;
    let retry = 1000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;

    const connect = () => {
      es = new EventSource("/api/stream");
      es.onopen = () => (retry = 1000);
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data.type === "unread") setUnread(data.count);
          window.dispatchEvent(new CustomEvent("gf:rt", { detail: data }));
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        if (closed) return;
        timer = setTimeout(connect, retry);
        retry = Math.min(retry * 2, 30_000);
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      es?.close();
    };
  }, []);

  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = unread > 0 ? `(${unread}) ${base}` : base;
  }, [unread]);

  return <RealtimeContext.Provider value={{ unread }}>{children}</RealtimeContext.Provider>;
}
