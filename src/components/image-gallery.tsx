"use client";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Images, Maximize2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { imageSrcSet, imageUrl } from "@/lib/image-url";
import { RimMark } from "./logo";

type GalleryImage = { key: string; width: number | null; height: number | null };

export function ImageGallery({
  images,
  title,
  overlay,
  className,
}: {
  images: GalleryImage[];
  title: string;
  /** Abzeichen o. Ä. oben links auf der Bildbühne */
  overlay?: React.ReactNode;
  className?: string;
}) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const n = images.length;

  const scrollTrack = useCallback((i: number, behavior: ScrollBehavior = "smooth") => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior });
  }, []);

  const go = useCallback(
    (i: number) => {
      const next = (i + n) % n;
      setIdx(next);
      scrollTrack(next);
    },
    [n, scrollTrack],
  );

  const closeZoom = useCallback(() => {
    setZoom(false);
    scrollTrack(idx, "instant");
  }, [idx, scrollTrack]);

  useEffect(() => {
    if (!zoom) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeZoom();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % n);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + n) % n);
      // Fokus im Vollbild halten (aria-modal), sonst springt Tab auf die verdeckte Seite
      if (e.key === "Tab" && zoomRef.current) {
        const items = [...zoomRef.current.querySelectorAll<HTMLElement>("button")].filter((b) => b.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (!zoomRef.current.contains(active) || (e.shiftKey && active === first)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", on);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", on);
      document.documentElement.style.overflow = prev;
    };
  }, [zoom, n, closeZoom]);

  if (n === 0) {
    return (
      <div className={clsx("relative grid aspect-[4/3] place-items-center overflow-hidden bg-surface-2 sm:rounded-2xl sm:border sm:border-line", className)}>
        <div className="flex flex-col items-center gap-3 text-faint">
          <RimMark className="h-20 w-20 opacity-40" />
          <span className="text-sm">Keine Bilder vorhanden</span>
        </div>
        {overlay && <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{overlay}</div>}
      </div>
    );
  }

  const arrow =
    "absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-surface/90 text-fg shadow-[var(--shadow-card)] backdrop-blur transition-[opacity,background-color] hover:bg-surface sm:grid sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100";

  return (
    <div className={className}>
      <div
        className="group relative overflow-hidden bg-surface-2 sm:rounded-2xl sm:border sm:border-line"
        role="region"
        aria-roledescription="Bildergalerie"
        aria-label={`Bilder zu ${title}`}
        onKeyDown={(e) => {
          if (n < 2) return;
          if (e.key === "ArrowRight") go(idx + 1);
          if (e.key === "ArrowLeft") go(idx - 1);
        }}
      >
        <div
          ref={track}
          className="scrollbar-none flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== idx && i >= 0 && i < n) setIdx(i);
          }}
        >
          {images.map((im, i) => (
            <button
              key={im.key}
              type="button"
              className="relative h-full w-full shrink-0 cursor-zoom-in snap-center"
              onClick={() => {
                setIdx(i);
                setZoom(true);
              }}
              aria-label={`Bild ${i + 1} von ${n} vergrößern`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(im.key, 1600)}
                srcSet={imageSrcSet(im.key)}
                sizes="(min-width: 1280px) 820px, (min-width: 1024px) 60vw, 100vw"
                alt={`${title} – Bild ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        {overlay && <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">{overlay}</div>}

        <button
          type="button"
          onClick={() => setZoom(true)}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          aria-label="Vollbild öffnen"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </button>

        {n > 1 && (
          <>
            <button type="button" onClick={() => go(idx - 1)} className={clsx(arrow, "left-3")} aria-label="Vorheriges Bild">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go(idx + 1)} className={clsx(arrow, "right-3")} aria-label="Nächstes Bild">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden" aria-hidden="true">
              {images.map((im, i) => (
                <span key={im.key} className={clsx("h-1.5 rounded-full bg-white shadow transition-all duration-300", i === idx ? "w-5" : "w-1.5 opacity-60")} />
              ))}
            </div>
          </>
        )}
        <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tabular-nums text-white backdrop-blur-sm" aria-live="polite">
          <Images className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Bild</span> {idx + 1} / {n}
        </span>
      </div>

      {n > 1 && (
        <div className="scrollbar-none mt-3 hidden gap-2 overflow-x-auto sm:flex">
          {images.map((im, i) => (
            <button
              key={im.key}
              type="button"
              onClick={() => go(i)}
              aria-current={i === idx ? "true" : undefined}
              className={clsx(
                "aspect-[4/3] w-[5.5rem] shrink-0 overflow-hidden rounded-xl border bg-surface-2 transition-[opacity,border-color,box-shadow]",
                i === idx ? "border-brand ring-2 ring-brand/40" : "border-line opacity-70 hover:opacity-100",
              )}
              aria-label={`Bild ${i + 1} anzeigen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(im.key, 400)} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div
          ref={zoomRef}
          className="animate-fade-in fixed inset-0 z-[90] flex flex-col bg-black/95 text-white"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} – Vollbild`}
          onClick={closeZoom}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current == null || n < 2) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 40) setIdx((i) => (dx < 0 ? (i + 1) % n : (i - 1 + n) % n));
          }}
        >
          <div className="flex items-center gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm tabular-nums">
              {idx + 1} / {n}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm text-white/80">{title}</p>
            <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20" aria-label="Schließen" autoFocus>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={images[idx].key}
              src={imageUrl(images[idx].key, 1600)}
              alt={`${title} – Bild ${idx + 1}`}
              className="animate-scale-in max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {n > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => (e.stopPropagation(), setIdx((idx - 1 + n) % n))}
                  className="absolute left-3 hidden h-12 w-12 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 sm:grid"
                  aria-label="Vorheriges Bild"
                >
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(e) => (e.stopPropagation(), setIdx((idx + 1) % n))}
                  className="absolute right-3 hidden h-12 w-12 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 sm:grid"
                  aria-label="Nächstes Bild"
                >
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
          {n > 1 && (
            <div className="scrollbar-none flex justify-center gap-2 overflow-x-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
              {images.map((im, i) => (
                <button
                  key={im.key}
                  type="button"
                  onClick={(e) => (e.stopPropagation(), setIdx(i))}
                  aria-label={`Bild ${i + 1} anzeigen`}
                  aria-current={i === idx ? "true" : undefined}
                  className={clsx("aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity", i === idx ? "border-white" : "border-transparent opacity-50 hover:opacity-90")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(im.key, 400)} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
