"use client";
import { Share2 } from "lucide-react";
import { toast } from "./toaster";

export function ShareButton({ title }: { title: string }) {
  return (
    <button
      type="button"
      className="btn btn-outline btn-icon"
      aria-label="Teilen"
      onClick={async () => {
        const url = location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch {}
        } else {
          await navigator.clipboard.writeText(url);
          toast("Link kopiert");
        }
      }}
    >
      <Share2 className="h-5 w-5" />
    </button>
  );
}
