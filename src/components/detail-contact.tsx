"use client";
import { clsx } from "clsx";
import { MessageCircle, MessageSquareText, Share2, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ContactSeller } from "./contact-seller";
import { toast } from "./toaster";

const DIALOG_ID = "kontakt-dialog";
const TEXTAREA_ID = "kontakt-nachricht";

/** Öffnet das Kontaktformular (Dialog) und setzt den Fokus ins Textfeld. */
export function openContactDialog() {
  const dlg = document.getElementById(DIALOG_ID);
  if (!(dlg instanceof HTMLDialogElement)) return;
  if (!dlg.open) dlg.showModal();
  document.documentElement.style.overflow = "hidden";
  const ta = document.getElementById(TEXTAREA_ID);
  if (ta instanceof HTMLTextAreaElement) {
    ta.focus({ preventScroll: true });
    ta.setSelectionRange(ta.value.length, ta.value.length);
  }
}

/**
 * Primärer Kontakt-Button. Gibt es schon einen Chat zum Inserat, führt er direkt dorthin,
 * sonst öffnet er das Kontaktformular.
 */
export function DetailContactButton({
  existingConversation,
  label = "Nachricht schreiben",
  className,
  id,
}: {
  existingConversation?: string | null;
  label?: string;
  className?: string;
  id?: string;
}) {
  if (existingConversation) {
    return (
      <Link id={id} href={`/nachrichten/${existingConversation}`} className={clsx("btn btn-brand", className)}>
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        Zum Chat
      </Link>
    );
  }
  return (
    <button id={id} type="button" className={clsx("btn btn-brand", className)} onClick={openContactDialog} aria-haspopup="dialog" aria-controls={DIALOG_ID}>
      <MessageSquareText className="h-5 w-5" aria-hidden="true" />
      {label}
    </button>
  );
}

/** Teilen mit Beschriftung (Web-Share, sonst Link kopieren). */
export function DetailShareButton({ title, className }: { title: string; className?: string }) {
  return (
    <button
      type="button"
      className={clsx("btn btn-outline", className)}
      onClick={async () => {
        const url = location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch {}
        } else {
          try {
            await navigator.clipboard.writeText(url);
            toast("Link kopiert");
          } catch {
            toast("Link konnte nicht kopiert werden", "error");
          }
        }
      }}
    >
      <Share2 className="h-5 w-5" aria-hidden="true" />
      Teilen
    </button>
  );
}

/** Kontaktformular als Dialog – am Handy als Blatt von unten, am Desktop zentriert. */
export function DetailContactDialog({
  listingId,
  loggedIn,
  sellerName,
  sellerType,
  title,
  price,
  imageSrc,
}: {
  listingId: number;
  loggedIn: boolean;
  sellerName: string;
  sellerType: string;
  title: string;
  price: string;
  imageSrc?: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = () => ref.current?.close();
  // Seitenwechsel bei offenem Dialog (z. B. nach dem Senden): Scroll-Sperre wieder lösen
  useEffect(
    () => () => {
      document.documentElement.style.overflow = "";
    },
    [],
  );

  return (
    <dialog
      ref={ref}
      id={DIALOG_ID}
      aria-labelledby={`${DIALOG_ID}-title`}
      className={clsx(
        "fixed inset-0 m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-2xl border border-line bg-surface p-0 text-fg shadow-[var(--shadow)]",
        "sm:m-auto sm:w-[min(100%-2rem,32rem)] sm:rounded-2xl",
        "backdrop:bg-black/60",
      )}
      onClose={() => {
        document.documentElement.style.overflow = "";
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="animate-scale-in">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-surface-3 sm:hidden" aria-hidden="true" />
        <div className="flex items-start gap-3 border-b border-line px-5 pb-4 pt-3 sm:pt-5">
          <div className="min-w-0 flex-1">
            <h2 id={`${DIALOG_ID}-title`} className="font-display text-lg uppercase tracking-wide">
              Nachricht an {sellerName}
            </h2>
            <p className="mt-0.5 text-xs text-muted">{sellerType} · antwortet direkt im Chat</p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon -mr-2 -mt-1 shrink-0" onClick={close} aria-label="Schließen">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-surface-2 px-5 py-3">
          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-3">
            {imageSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="font-display text-base font-extrabold tabular-nums">{price}</p>
          </div>
        </div>

        <div className="px-5 pt-4 [padding-bottom:max(1.25rem,env(safe-area-inset-bottom))]">
          <ContactSeller listingId={listingId} loggedIn={loggedIn} sellerName={sellerName} textareaId={TEXTAREA_ID} />
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-xs leading-5 text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green" aria-hidden="true" />
            <span>
              Deine Kontaktdaten bleiben privat. Zahle nie im Voraus an Unbekannte –{" "}
              <Link href="/sicherheit" className="link">
                Tipps für sicheren Handel
              </Link>
            </span>
          </p>
        </div>
      </div>
    </dialog>
  );
}
