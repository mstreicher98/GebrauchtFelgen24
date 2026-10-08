"use client";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startConversation } from "@/app/actions/chat";

const QUICK = ["Ist das noch verfügbar?", "Ist der Preis verhandelbar?", "Wäre Versand möglich?", "Kann ich die Felgen besichtigen?"];

export function ContactSeller({ listingId, loggedIn, existingConversation }: { listingId: number; loggedIn: boolean; existingConversation?: string | null }) {
  const [text, setText] = useState("Hallo, ist das noch verfügbar?");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (existingConversation) {
    return (
      <button type="button" className="btn btn-gold w-full" onClick={() => router.push(`/nachrichten/${existingConversation}`)}>
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
      <label htmlFor="msg" className="label">
        Nachricht an den Verkäufer
      </label>
      <textarea id="msg" className="textarea min-h-24 resize-y" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} required />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button key={q} type="button" className="chip px-2.5 py-1 text-xs" onClick={() => setText(`Hallo, ${q.charAt(0).toLowerCase()}${q.slice(1)}`)}>
            {q}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red">{error}</p>}
      <button className="btn btn-gold mt-4 w-full" disabled={pending || !text.trim()}>
        <Send className="h-4 w-4" />
        {loggedIn ? "Chat starten" : "Anmelden & Chat starten"}
      </button>
    </form>
  );
}
