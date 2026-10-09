"use client";
import { clsx } from "clsx";
import { MessageCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startConversation } from "@/app/actions/chat";

const QUICK = ["Ist das noch verfügbar?", "Ist der Preis verhandelbar?", "Wäre Versand möglich?", "Kann ich die Felgen besichtigen?"];

const toMessage = (q: string) => `Hallo, ${q.charAt(0).toLowerCase()}${q.slice(1)}`;

export function ContactSeller({
  listingId,
  loggedIn,
  existingConversation,
  sellerName,
  textareaId = "msg",
}: {
  listingId: number;
  loggedIn: boolean;
  existingConversation?: string | null;
  /** Vorname bzw. Firmenname – für die Beschriftung „Deine Nachricht an …“ */
  sellerName?: string;
  /** Eigene ID für das Textfeld (z. B. wenn das Formular in einem Dialog steckt) */
  textareaId?: string;
}) {
  const [text, setText] = useState(toMessage(QUICK[0]));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (existingConversation) {
    return (
      <button type="button" className="btn btn-brand w-full" onClick={() => router.push(`/nachrichten/${existingConversation}`)}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Zum Chat mit dem Verkäufer
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!loggedIn) {
          router.push(`/anmelden?weiter=${encodeURIComponent(location.pathname)}`);
          return;
        }
        setError(null);
        start(async () => {
          const r = await startConversation(listingId, text);
          if (r.error === "login") router.push(`/anmelden?weiter=${encodeURIComponent(location.pathname)}`);
          else if (r.error) setError(r.error);
          else if (r.id) router.push(`/nachrichten/${r.id}`);
        });
      }}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint" id={`${textareaId}-quick`}>
        Schnellfragen
      </p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={`${textareaId}-quick`}>
        {QUICK.map((q) => {
          const active = text === toMessage(q);
          return (
            <button
              key={q}
              type="button"
              data-active={active}
              aria-pressed={active}
              className="chip px-3 py-1.5 text-[0.8125rem]"
              onClick={() => setText(toMessage(q))}
            >
              {q}
            </button>
          );
        })}
      </div>

      <label htmlFor={textareaId} className="label mt-4">
        {sellerName ? `Deine Nachricht an ${sellerName}` : "Nachricht an den Verkäufer"}
      </label>
      <textarea
        id={textareaId}
        className="textarea min-h-28 resize-y leading-relaxed"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={2000}
        required
      />
      <p className={clsx("mt-1 text-right text-xs tabular-nums", text.length > 1900 ? "text-red" : "text-faint")} aria-live="polite">
        {text.length} / 2000
      </p>
      {error && (
        <p className="mt-2 text-sm text-red" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-brand mt-3 h-12 w-full text-base" disabled={pending || !text.trim()}>
        <Send className="h-4 w-4" aria-hidden="true" />
        {pending ? "Wird gesendet …" : loggedIn ? "Nachricht senden" : "Anmelden & Nachricht senden"}
      </button>
    </form>
  );
}
