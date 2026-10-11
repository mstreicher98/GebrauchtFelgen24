"use client";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminClearBanner, adminSaveBanner, adminSaveUserNote, resolveReport } from "@/app/actions/admin";
import { toast } from "./toaster";

/** „Erledigt“ mit optionaler interner Begründung. */
export function ResolveReportForm({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const submit = () =>
    start(async () => {
      try {
        await resolveReport(id, note);
        toast("Meldung erledigt");
        router.refresh();
      } catch (e) {
        toast((e as Error).message, "error");
      }
    });

  if (!open) {
    return (
      <span className="inline-flex gap-1.5">
        <button type="button" className="btn btn-brand btn-sm" disabled={pending} onClick={submit}>
          <Check className="h-4 w-4" aria-hidden="true" /> Erledigt
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
          Mit Notiz …
        </button>
      </span>
    );
  }
  return (
    <form
      className="flex w-full flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input className="input min-w-0 flex-1" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="z. B. Inserat gesperrt, Nutzer verwarnt" autoFocus aria-label="Interne Notiz" />
      <button className="btn btn-brand btn-sm" disabled={pending}>
        Speichern & erledigen
      </button>
    </form>
  );
}

/** Interne Notiz zu einem Nutzer (nur für Admins sichtbar). */
export function UserNoteForm({ userId, initial }: { userId: string; initial: string }) {
  const [note, setNote] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await adminSaveUserNote(userId, note);
          toast("Notiz gespeichert");
          router.refresh();
        });
      }}
    >
      <textarea className="textarea min-h-28" value={note} onChange={(e) => setNote(e.target.value)} maxLength={4000} placeholder="z. B. Verwarnung wegen Fake-Inseraten am …" aria-label="Interne Notiz" />
      <button className="btn btn-outline btn-sm mt-2" disabled={pending || note === initial}>
        Notiz speichern
      </button>
    </form>
  );
}

type Banner = { text: string; tone: "info" | "warnung" | "erfolg"; link: string; until: string };

/** Hinweis-Leiste für die Website pflegen. */
export function BannerForm({ initial, active }: { initial: Banner; active: boolean }) {
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const set = <K extends keyof Banner>(k: K, val: Banner[K]) => setV((s) => ({ ...s, [k]: val }));

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await adminSaveBanner(v);
          if (r.error) toast(r.error, "error");
          else {
            toast("Hinweis veröffentlicht");
            router.refresh();
          }
        });
      }}
    >
      <div className="sm:col-span-2">
        <label className="label" htmlFor="banner-text">Text</label>
        <input id="banner-text" className="input" value={v.text} onChange={(e) => set("text", e.target.value)} maxLength={240} placeholder="z. B. Am Sonntag 22–23 Uhr Wartungsarbeiten" />
      </div>
      <div>
        <label className="label" htmlFor="banner-tone">Art</label>
        <select id="banner-tone" className="select" value={v.tone} onChange={(e) => set("tone", e.target.value as Banner["tone"])}>
          <option value="info">Info (blau)</option>
          <option value="warnung">Warnung (rot)</option>
          <option value="erfolg">Erfolg (grün)</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="banner-until">Ausblenden ab (optional)</label>
        <input id="banner-until" type="datetime-local" className="input" value={v.until} onChange={(e) => set("until", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="banner-link">Link (optional)</label>
        <input id="banner-link" className="input" value={v.link} onChange={(e) => set("link", e.target.value)} placeholder="/sicherheit oder https://…" />
      </div>
      <div className="flex flex-wrap gap-2 sm:col-span-2">
        <button className="btn btn-brand" disabled={pending}>
          {active ? "Hinweis aktualisieren" : "Hinweis veröffentlichen"}
        </button>
        {active && (
          <button
            type="button"
            className="btn btn-outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await adminClearBanner();
                setV({ text: "", tone: "info", link: "", until: "" });
                toast("Hinweis entfernt");
                router.refresh();
              })
            }
          >
            Hinweis entfernen
          </button>
        )}
      </div>
    </form>
  );
}
