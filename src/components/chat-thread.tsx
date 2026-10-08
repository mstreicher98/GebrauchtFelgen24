"use client";
import { clsx } from "clsx";
import { ArrowLeft, Ban, Check, CheckCheck, EllipsisVertical, ImagePlus, Archive, Send, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { archiveConversation, markConversationRead, sendMessage, setBlocked } from "@/app/actions/chat";
import { formatPrice, formatTime } from "@/lib/format";
import { imageUrl } from "@/lib/image-url";
import { uploadImage } from "./image-uploader";
import { RimMark, Spinner } from "./logo";
import { PushOptIn } from "./push-opt-in";
import { ReportButton } from "./report-button";
import { toast } from "./toaster";

export type ChatMessage = { id: number; senderId: string; body: string; imageKey: string | null; createdAt: string; pending?: boolean };

type Props = {
  conversationId: string;
  meId: string;
  other: { id: string; name: string; isDealer: boolean };
  listing: { id: number; title: string; url: string; priceCents: number; imageKey: string | null; status: string };
  initialMessages: ChatMessage[];
  otherLastReadAt: string | null;
  blocked: { byMe: boolean; byOther: boolean };
};

function dayLabel(d: Date) {
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Heute";
  if (d.toDateString() === y.toDateString()) return "Gestern";
  return d.toLocaleDateString("de-AT", { weekday: "long", day: "2-digit", month: "long" });
}

export function ChatThread({ conversationId, meId, other, listing, initialMessages, otherLastReadAt, blocked }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [readAt, setReadAt] = useState(otherLastReadAt);
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ key: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [menu, setMenu] = useState(false);
  const [, start] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isBlocked = blocked.byMe || blocked.byOther;

  const scrollDown = useCallback((smooth = true) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useLayoutEffect(() => scrollDown(false), [scrollDown]);

  useEffect(() => {
    void markConversationRead(conversationId);
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.conversationId !== conversationId) return;
      if (d.type === "message") {
        setMessages((m) => {
          if (m.some((x) => x.id === d.message.id)) return m;
          // eigene, noch „pending" Nachricht ersetzen
          const idx = m.findIndex((x) => x.pending && x.senderId === d.message.senderId && x.body === d.message.body);
          if (idx >= 0) {
            const copy = [...m];
            copy[idx] = d.message;
            return copy;
          }
          return [...m, d.message];
        });
        if (d.message.senderId !== meId && document.visibilityState === "visible") void markConversationRead(conversationId);
        requestAnimationFrame(() => scrollDown());
      } else if (d.type === "read" && d.readerId !== meId) {
        setReadAt(d.at);
      }
    };
    const onVisible = () => document.visibilityState === "visible" && void markConversationRead(conversationId);
    window.addEventListener("gf:rt", on);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("gf:rt", on);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [conversationId, meId, scrollDown]);

  const send = () => {
    const body = text.trim();
    if ((!body && !image) || isBlocked) return;
    const tmpId = -Date.now();
    const optimistic: ChatMessage = { id: tmpId, senderId: meId, body, imageKey: image?.key ?? null, createdAt: new Date().toISOString(), pending: true };
    setMessages((m) => [...m, optimistic]);
    setText("");
    const img = image?.key ?? null;
    setImage(null);
    requestAnimationFrame(() => scrollDown());
    start(async () => {
      const r = await sendMessage(conversationId, body, img);
      if (r.error) {
        toast(r.error, "error");
        setMessages((m) => m.filter((x) => x.id !== tmpId));
        setText(body);
      } else if (r.message) {
        const real = r.message;
        setMessages((m) => {
          if (m.some((x) => x.id === real.id)) return m.filter((x) => x.id !== tmpId);
          return m.map((x) => (x.id === tmpId ? { ...x, id: real.id, createdAt: real.createdAt, pending: false } : x));
        });
      }
    });
  };

  const lastOwn = [...messages].reverse().find((m) => m.senderId === meId && !m.pending);

  return (
    <div className="flex h-full flex-col">
      {/* Kopf */}
      <header className="flex items-center gap-3 border-b border-line px-3 py-2.5 sm:px-4">
        <Link href="/nachrichten" className="btn btn-ghost btn-icon md:hidden" aria-label="Zurück">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <Link href={listing.url} className="flex min-w-0 flex-1 items-center gap-3">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-surface-3">
            {listing.imageKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl(listing.imageKey, 400)} alt="" className="h-full w-full object-cover" />
            ) : (
              <RimMark className="m-2 h-7 w-7 text-faint" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {other.name} {other.isDealer && <span className="badge badge-brand ml-1">Händler</span>}
            </p>
            <p className="truncate text-xs text-muted">
              {listing.title} · {formatPrice(listing.priceCents)}
              {listing.status !== "aktiv" && <span className="ml-1 text-red">({listing.status})</span>}
            </p>
          </div>
        </Link>
        <div className="relative">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setMenu((m) => !m)} aria-label="Optionen" aria-expanded={menu}>
            <EllipsisVertical className="h-5 w-5" />
          </button>
          {menu && (
            <div className="animate-scale-in absolute right-0 top-11 z-20 w-56 origin-top-right rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow)]">
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-fg"
                onClick={() =>
                  start(async () => {
                    await archiveConversation(conversationId);
                    router.push("/nachrichten");
                  })
                }
              >
                <Archive className="h-4 w-4" /> Unterhaltung archivieren
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-red"
                onClick={() =>
                  start(async () => {
                    if (!blocked.byMe && !confirm(`${other.name} blockieren? Ihr könnt euch dann keine Nachrichten mehr schicken.`)) return;
                    const r = await setBlocked(other.id, !blocked.byMe);
                    if (r.error) toast(r.error, "error");
                    else toast(blocked.byMe ? "Blockierung aufgehoben" : "Nutzer blockiert");
                    setMenu(false);
                    router.refresh();
                  })
                }
              >
                <Ban className="h-4 w-4" /> {blocked.byMe ? "Blockierung aufheben" : "Nutzer blockieren"}
              </button>
              <div className="px-3 py-2">
                <ReportButton targetType="user" targetId={other.id} label="Nutzer melden" loggedIn />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Nachrichten */}
      <div ref={scroller} className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 sm:px-6">
        <div className="mx-auto mb-4 max-w-sm">
          <PushOptIn />
        </div>
        <p className="mx-auto mb-4 max-w-md rounded-xl bg-surface-2 px-4 py-2.5 text-center text-xs text-muted">
          🔒 Tipp: Bezahle nie per Vorkasse an Unbekannte und schaue dir die Felgen wenn möglich vor Ort an.
        </p>
        {messages.map((m, i) => {
          const d = new Date(m.createdAt);
          const showDay = i === 0 || d.toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
          const mine = m.senderId === meId;
          return (
            <div key={m.id}>
              {showDay && (
                <div className="my-4 text-center">
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium text-faint">{dayLabel(d)}</span>
                </div>
              )}
              <div className={clsx("animate-msg-in flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={clsx(
                    "max-w-[82%] overflow-hidden rounded-2xl text-[0.95rem] leading-relaxed shadow-sm sm:max-w-[70%]",
                    mine ? "rounded-br-md bg-gradient-to-br from-brand-fill to-brand-fill-2 text-on-brand" : "rounded-bl-md bg-surface-2",
                    m.pending && "opacity-70",
                  )}
                >
                  {m.imageKey && (
                    <a href={imageUrl(m.imageKey, 1600)} target="_blank" rel="noreferrer" className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl(m.imageKey, 800)} alt="Bild" className="max-h-72 w-full object-cover" />
                    </a>
                  )}
                  {(m.body || !m.imageKey) && <p className="whitespace-pre-wrap break-words px-3.5 py-2">{m.body}</p>}
                  <p className={clsx("flex items-center justify-end gap-1 px-3 pb-1.5 text-[10px]", mine ? "text-on-brand/70" : "text-faint", !m.body && m.imageKey && "pt-1.5")}>
                    {formatTime(d)}
                    {mine &&
                      (m.pending ? (
                        <Spinner className="h-3 w-3" />
                      ) : readAt && new Date(readAt) >= d ? (
                        <CheckCheck className="h-3.5 w-3.5" aria-label="Gelesen" />
                      ) : (
                        <Check className="h-3.5 w-3.5" aria-label="Gesendet" />
                      ))}
                  </p>
                </div>
              </div>
              {mine && lastOwn?.id === m.id && readAt && new Date(readAt) >= d && <p className="mt-0.5 text-right text-[10px] text-faint">Gelesen</p>}
            </div>
          );
        })}
      </div>

      {/* Eingabe */}
      {isBlocked ? (
        <div className="border-t border-line p-4 text-center text-sm text-muted">
          {blocked.byMe ? "Du hast diesen Nutzer blockiert." : "Diese Unterhaltung ist nicht mehr möglich."}
        </div>
      ) : (
        <form
          className="border-t border-line p-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          {image && (
            <div className="relative mb-2 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(image.key, 400)} alt="" className="h-20 rounded-xl" />
              <button type="button" onClick={() => setImage(null)} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-black text-white" aria-label="Bild entfernen">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button type="button" className="btn btn-ghost btn-icon shrink-0" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Bild senden">
              {uploading ? <Spinner className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                setUploading(true);
                try {
                  setImage(await uploadImage(f, "chat"));
                } catch (err) {
                  toast((err as Error).message, "error");
                }
                setUploading(false);
              }}
            />
            <textarea
              className="textarea max-h-36 min-h-11 flex-1 resize-none py-2.5"
              rows={1}
              placeholder="Nachricht schreiben …"
              value={text}
              maxLength={2000}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 144)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !("ontouchstart" in window)) {
                  e.preventDefault();
                  send();
                }
              }}
              aria-label="Nachricht"
            />
            <button className="btn btn-brand btn-icon shrink-0" disabled={!text.trim() && !image} aria-label="Senden">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
