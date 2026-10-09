"use client";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState } from "react";

/**
 * Horizontales Karussell mit Scroll-Snap (Touch/Trackpad) und Pfeil-Buttons.
 * Die Karten selbst bleiben Server-Komponenten und werden als `children` übergeben.
 */
export function HomeCarousel({ children, label, className }: { children: React.ReactNode; label: string; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [update]);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const item = el.firstElementChild as HTMLElement | null;
    const step = item ? item.offsetWidth + 16 : el.clientWidth * 0.8;
    const perView = Math.max(1, Math.floor((el.clientWidth + 16) / step));
    el.scrollBy({ left: dir * step * perView, behavior: "smooth" });
  };

  const items = Children.toArray(children);
  const arrows = !(edge.start && edge.end);

  return (
    <div className={clsx("relative", className)} role="region" aria-roledescription="Karussell" aria-label={label}>
      <div
        ref={track}
        className="scrollbar-none -mx-4 -my-2 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 py-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 xl:mx-0 xl:scroll-px-0 xl:px-0"
      >
        {items.map((child, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="Angebot"
            aria-label={`${i + 1} von ${items.length}`}
            className="w-[84%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)] [&>article]:h-full"
          >
            {child}
          </div>
        ))}
      </div>
      {arrows && (
        <>
          <ArrowButton dir={-1} disabled={edge.start} onClick={() => scroll(-1)} />
          <ArrowButton dir={1} disabled={edge.end} onClick={() => scroll(1)} />
        </>
      )}
    </div>
  );
}

function ArrowButton({ dir, disabled, onClick }: { dir: 1 | -1; disabled: boolean; onClick: () => void }) {
  const Icon = dir === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 1 ? "Weitere Angebote" : "Vorherige Angebote"}
      className={clsx(
        "absolute top-[30%] z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface text-fg shadow-card-hover transition-all hover:border-brand hover:text-brand disabled:pointer-events-none disabled:opacity-0 md:flex",
        dir === 1 ? "-right-3 xl:-right-5" : "-left-3 xl:-left-5",
      )}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </button>
  );
}
