"use client";
import { RimMark } from "@/components/logo";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <RimMark className="h-20 w-20 text-red" />
      <h1 className="font-display mt-6 text-3xl font-bold uppercase">Da ist etwas schiefgelaufen</h1>
      <p className="mt-2 text-muted">Bitte versuche es gleich noch einmal.</p>
      <button type="button" className="btn btn-gold mt-6" onClick={reset}>
        Erneut versuchen
      </button>
    </div>
  );
}
