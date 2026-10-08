"use client";
import { Flag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createReport } from "@/app/actions/reports";
import { REPORT_REASONS } from "@/lib/constants";
import { toast } from "./toaster";

export function ReportButton({ targetType, targetId, label = "Melden", loggedIn }: { targetType: "listing" | "user" | "message"; targetId: string; label?: string; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-sm text-faint hover:text-red"
        onClick={() => (loggedIn ? setOpen(true) : router.push(`/anmelden?weiter=${encodeURIComponent(location.pathname)}`))}
      >
        <Flag className="h-4 w-4" />
        {label}
      </button>
      {open && (
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
              {targetType === "listing" ? "Inserat melden" : targetType === "user" ? "Nutzer melden" : "Nachricht melden"}
            </h2>
            <div className="mt-4 space-y-2">
              {REPORT_REASONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                  <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-[var(--brand)]" required />
                  {r}
                </label>
              ))}
            </div>
            <textarea className="textarea mt-3" placeholder="Details (optional)" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} />
            <button className="btn btn-danger mt-4 w-full" disabled={pending || !reason}>
              Meldung absenden
            </button>
          </form>
        </div>
      )}
    </>
  );
}
