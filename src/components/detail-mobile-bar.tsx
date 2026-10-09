"use client";
import { clsx } from "clsx";
import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { DetailContactButton } from "./detail-contact";

/**
 * Feste Kaufleiste am Handy/Tablet (unter lg): Preis + „Nachricht“.
 * Sitzt über der mobilen Tab-Leiste (Höhe wird gemessen) und erscheint nur,
 * solange der Kontakt-Button der Kaufbox nicht sichtbar ist und das Seitenende
 * noch nicht erreicht wurde – so verdeckt sie weder Kaufbox noch Fußbereich.
 */
export function DetailMobileBar({
  price,
  priceType,
  priceNote,
  ctaId,
  endId,
  phone,
  existingConversation,
}: {
  price: string;
  /** „VB“ bzw. „Festpreis“ */
  priceType?: string;
  priceNote: string;
  /** ID des Kontakt-Buttons in der Kaufbox */
  ctaId: string;
  /** ID eines Markers am Ende des Inhalts */
  endId: string;
  phone?: string | null;
  existingConversation?: string | null;
}) {
  const [show, setShow] = useState(false);
  const [tabBar, setTabBar] = useState(0);

  useEffect(() => {
    const cta = document.getElementById(ctaId);
    const end = document.getElementById(endId);
    const nav = document.querySelector('nav[aria-label="Mobile Navigation"]');
    let frame = 0;
    // Per Scroll-Position statt IntersectionObserver: so stimmt der Zustand auch nach Sprüngen (Anker, „nach oben“).
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const tab = nav ? nav.getBoundingClientRect().height : 0;
      let ctaVisible = false;
      if (cta) {
        const r = cta.getBoundingClientRect();
        // Oben verdeckt die feste Kopfzeile (64 px), unten die Tab-Leiste.
        ctaVisible = r.width > 0 && r.bottom > 64 && r.top < vh - tab;
      }
      const endReached = end ? end.getBoundingClientRect().top < vh : false;
      setShow(!ctaVisible && !endReached);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const ro = nav ? new ResizeObserver(() => setTabBar(Math.round(nav.getBoundingClientRect().height))) : null;
    if (nav) ro?.observe(nav);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      ro?.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ctaId, endId]);

  return (
    <div
      className={clsx(
        "fixed inset-x-0 z-40 border-t border-line bg-surface shadow-[0_-8px_24px_-12px_rgb(0_0_0/0.35)] transition-[transform,opacity,visibility] duration-300 lg:hidden",
        show ? "visible translate-y-0 opacity-100" : "invisible translate-y-3 opacity-0",
      )}
      style={{ bottom: tabBar, paddingBottom: tabBar ? undefined : "env(safe-area-inset-bottom)" }}
      aria-hidden={!show}
      inert={!show}
    >
      <div className="container-page flex h-16 items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-1.5 leading-none">
            <span className="font-display text-xl font-extrabold tabular-nums">{price}</span>
            {priceType && <span className="text-xs font-semibold text-muted">{priceType}</span>}
          </p>
          <p className="mt-1 truncate text-xs text-muted">{priceNote}</p>
        </div>
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="btn btn-outline btn-icon shrink-0" aria-label={`Anrufen: ${phone}`}>
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
        )}
        <DetailContactButton existingConversation={existingConversation} label="Nachricht" className="shrink-0 px-5" />
      </div>
    </div>
  );
}
