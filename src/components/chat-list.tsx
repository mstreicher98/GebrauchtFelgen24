"use client";
import { clsx } from "clsx";
import { ImageIcon, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { formatPrice, formatRelative } from "@/lib/format";
import type { ConversationSummary } from "@/lib/conversations";
import { imageUrl } from "@/lib/image-url";
import { RimMark } from "./logo";

export function ChatShell({ conversations, meId, children }: { conversations: ConversationSummary[]; meId: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeId = pathname.split("/")[2];

  // Liste aktualisieren, wenn irgendwo eine neue Nachricht eintrifft
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.type === "message" || d?.type === "read") router.refresh();
    };
    window.addEventListener("gf:rt", on);
    return () => window.removeEventListener("gf:rt", on);
  }, [router]);

  return (
    <div className="container-page py-4 md:py-8">
      <div className="card grid h-[calc(100dvh-8.5rem)] overflow-hidden md:h-[calc(100dvh-10rem)] md:grid-cols-[22rem_1fr]">
        <aside className={clsx("flex min-h-0 flex-col border-line md:border-r", activeId && "hidden md:flex")}>
          <div className="border-b border-line px-5 py-4">
            <h1 className="font-display text-2xl uppercase">Nachrichten</h1>
          </div>
          {conversations.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted">
              <MessageCircle className="h-10 w-10 text-faint" />
              <p className="mt-3 text-sm">Noch keine Unterhaltungen. Starte einen Chat direkt aus einem Inserat.</p>
              <Link href="/suche" className="btn btn-outline btn-sm mt-4">Felgen entdecken</Link>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/nachrichten/${c.id}`}
                    className={clsx(
                      "flex gap-3 border-b border-line/60 px-4 py-3.5 transition-colors hover:bg-surface-2",
                      activeId === c.id && "bg-surface-2",
                    )}
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-3">
                      {c.imageKey ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl(c.imageKey, 400)} alt="" className={clsx("h-full w-full object-cover", c.listingStatus !== "aktiv" && "grayscale")} />
                      ) : (
                        <RimMark className="m-3 h-8 w-8 text-faint" />
                      )}
                      {c.unread && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-solid ring-2 ring-surface" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={clsx("truncate text-sm", c.unread ? "font-bold" : "font-semibold")}>{c.otherName}</span>
                        <span className="shrink-0 text-[11px] text-faint">{formatRelative(c.lastMessageAt)}</span>
                      </div>
                      <p className="truncate text-xs text-muted">
                        {c.role === "seller" ? "Dein Inserat: " : ""}
                        {c.listingTitle} · {formatPrice(c.priceCents)}
                      </p>
                      <p className={clsx("mt-0.5 flex items-center gap-1 truncate text-sm", c.unread ? "text-fg" : "text-faint")}>
                        {c.lastSenderId === meId && <span className="text-faint">Du:</span>}
                        {c.lastImage && <ImageIcon className="h-3.5 w-3.5 shrink-0" />}
                        <span className="truncate">{c.lastBody || (c.lastImage ? "Bild" : "")}</span>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <section className={clsx("min-h-0", !activeId && "hidden md:block")}>{children}</section>
      </div>
    </div>
  );
}
