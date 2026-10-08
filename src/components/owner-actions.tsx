"use client";
import { CalendarPlus, CheckCheck, EyeOff, Pencil, PlayCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteListing, extendListing, setListingStatus } from "@/app/actions/listings";
import { toast } from "./toaster";

export function OwnerActions({ id, status, compact = false }: { id: number; status: string; compact?: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<{ error?: string }>, ok: string) =>
    start(async () => {
      const r = await fn();
      if (r.error) toast(r.error, "error");
      else {
        toast(ok);
        router.refresh();
      }
    });
  const cls = compact ? "btn btn-outline btn-sm" : "btn btn-outline btn-sm flex-1";

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "gesperrt" && (
        <Link href={`/inserat/${id}/bearbeiten`} className={cls}>
          <Pencil className="h-4 w-4" /> Bearbeiten
        </Link>
      )}
      {status === "aktiv" && (
        <>
          <button type="button" className={cls} disabled={pending} onClick={() => run(() => setListingStatus(id, "verkauft"), "Als verkauft markiert")}>
            <CheckCheck className="h-4 w-4" /> Verkauft
          </button>
          <button type="button" className={cls} disabled={pending} onClick={() => run(() => setListingStatus(id, "deaktiviert"), "Inserat deaktiviert")}>
            <EyeOff className="h-4 w-4" /> Deaktivieren
          </button>
          <button type="button" className={cls} disabled={pending} onClick={() => run(() => extendListing(id), "Laufzeit verlängert")}>
            <CalendarPlus className="h-4 w-4" /> Verlängern
          </button>
        </>
      )}
      {(status === "deaktiviert" || status === "abgelaufen") && (
        <button type="button" className={cls} disabled={pending} onClick={() => run(() => extendListing(id), "Inserat wieder aktiv")}>
          <PlayCircle className="h-4 w-4" /> Wieder aktivieren
        </button>
      )}
      <button
        type="button"
        className={`${cls} hover:!border-red hover:!text-red`}
        disabled={pending}
        onClick={() => {
          if (!confirm("Inserat endgültig löschen? Laufende Chats werden ebenfalls gelöscht.")) return;
          start(async () => {
            const r = await deleteListing(id);
            if (r.error) toast(r.error, "error");
            else {
              toast("Inserat gelöscht");
              router.push("/konto/inserate");
              router.refresh();
            }
          });
        }}
      >
        <Trash2 className="h-4 w-4" /> Löschen
      </button>
    </div>
  );
}
