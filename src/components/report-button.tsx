"use client";
import { Flag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { createReport } from "@/app/actions/reports";
import { REPORT_REASONS } from "@/lib/constants";
import { toast } from "./toaster";

const TITLES = { listing: "Inserat melden", user: "Nutzer melden", message: "Nachricht melden", conversation: "Unterhaltung melden" } as const;

export function ReportButton({
  targetType,
  targetId,
  label = "Melden",
  loggedIn,
  iconOnly = false,
  className,
}: {
  targetType: "listing" | "user" | "message" | "conversation";
  targetId: string;
  label?: string;
  loggedIn: boolean;
  /** Nur das Fahnen-Symbol zeigen (Beschriftung als aria-label), z. B. neben Chat-Nachrichten */
  iconOnly?: boolean;
  /** Ersetzt die Standard-Optik des Auslösers komplett */
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        className={className ?? "inline-flex items-center gap-1.5 text-sm text-faint hover:text-red"}
        onClick={() => (loggedIn ? setOpen(true) : router.push(`/anmelden?weiter=${encodeURIComponent(location.pathname)}`))}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
      >
        <Flag className="h-4 w-4" aria-hidden="true" />
        {!iconOnly && label}
      </button>
      {/* Portal: der Dialog darf nicht in Menüs oder Chat-Blasen (Transform, overflow) eingesperrt sein */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="report-title">
            <div className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <form
              className="card animate-scale-in relative w-full max-w-md p-6"
              onSubmit={(e) => {
                e.preventDefault();
                start(async () => {
                  const r = await createReport(targetType, targetId, reason, details);
                  if (r.error) toast(r.error, "error");
                  else {
                    toast("Danke! Wir prüfen die Meldung.");
                    setOpen(false);
                  }
                });
              }}
            >
              <button type="button" className="btn btn-ghost btn-icon absolute right-2 top-2" onClick={() => setOpen(false)} aria-label="Schließen">
                <X className="h-5 w-5" />
              </button>
              <h2 id="report-title" className="font-display text-xl uppercase">
                {TITLES[targetType]}
              </h2>
              <div className="mt-4 space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label key={r} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                    <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--brand)]" required />
                    {r}
                  </label>
                ))}
              </div>
              {(targetType === "conversation" || targetType === "message") && (
                <p className="mt-3 text-xs text-muted">Mit der Meldung kann unser Team diese Unterhaltung einsehen, um sie zu prüfen.</p>
              )}
              <textarea className="textarea mt-3" placeholder="Details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} />
              <button className="btn btn-danger mt-4 w-full" disabled={pending || !reason}>
                Meldung absenden
              </button>
            </form>
          </div>,
          document.body,
        )}
    </>
  );
}
