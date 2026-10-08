"use client";
import { Bell, BellOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { deleteSavedSearch, setSavedSearchNotify } from "@/app/actions/saved-searches";

export function SavedSearchRow({ id, name, href, notify, created }: { id: number; name: string; href: string; notify: boolean; created: string }) {
  const [pending, start] = useTransition();
  return (
    <li className={`card reveal flex items-center gap-3 p-4 transition-opacity ${pending ? "opacity-50" : ""}`}>
      <div className="min-w-0 flex-1">
        <Link href={href} className="block truncate font-semibold hover:text-gold">
          {name}
        </Link>
        <p className="text-xs text-faint">gespeichert am {created}</p>
      </div>
      <button
        type="button"
        className={`btn btn-sm ${notify ? "btn-outline border-gold text-gold" : "btn-outline"}`}
        onClick={() => start(() => setSavedSearchNotify(id, !notify))}
        aria-pressed={notify}
        title={notify ? "Benachrichtigungen aus" : "Benachrichtigungen an"}
      >
        {notify ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        <span className="hidden sm:inline">{notify ? "Aktiv" : "Pausiert"}</span>
      </button>
      <button type="button" className="btn btn-ghost btn-icon hover:text-red" onClick={() => start(() => deleteSavedSearch(id))} aria-label="Suchauftrag löschen">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}
