"use client";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { imageSrcSet, imageUrl } from "@/lib/image-url";
import { RimMark } from "./logo";

export function ImageGallery({ images, title }: { images: { key: string; width: number | null; height: number | null }[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const n = images.length;

  const go = useCallback(
    (i: number) => {
      const next = (i + n) % n;
      setIdx(next);
      track.current?.scrollTo({ left: next * (track.current.clientWidth || 0), behavior: "smooth" });
    },
    [n],
  );

  useEffect(() => {
    if (!zoom) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % n);
      if (e.key === "ArrowLeft") setIdx((i) => (i - 1 + n) % n);
    };
    document.addEventListener("keydown", on);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", on);
      document.body.style.overflow = "";
    };
  }, [zoom, n]);

  if (n === 0) {
    return (
      <div className="card grid aspect-[4/3] place-items-center">
        <RimMark className="h-20 w-20 text-faint opacity-40" />
      </div>
    );
  }

  return (
    <div>
      <div className="card group relative overflow-hidden">
        <div
          ref={track}
          className="scrollbar-none flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== idx) setIdx(i);
          }}
        >
          {images.map((im, i) => (
            <button key={im.key} type="button" className="relative h-full w-full shrink-0 snap-center" onClick={() => setZoom(true)} aria-label={`Bild ${i + 1} vergrößern`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl(im.key, 1600)}
                srcSet={imageSrcSet(im.key)}
                sizes="(min-width: 1024px) 60vw, 100vw"
                alt={`${title} – Bild ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(idx - 1)} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 sm:grid" aria-label="Vorheriges Bild">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(idx + 1)} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 sm:grid" aria-label="Nächstes Bild">
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((im, i) => (
            <span key={im.key} className={clsx("h-1.5 rounded-full bg-white/80 transition-all duration-300", i === idx ? "w-5" : "w-1.5 opacity-50")} />
          ))}
        </div>
        <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white backdrop-blur">
          <Expand className="h-3.5 w-3.5" /> {idx + 1}/{n}
        </span>
      </div>

      {n > 1 && (
        <div className="scrollbar-none mt-3 flex gap-2 overflow-x-auto">
          {images.map((im, i) => (
            <button
              key={im.key}
              type="button"
              onClick={() => go(i)}
              className={clsx("h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all", i === idx ? "border-brand" : "border-transparent opacity-60 hover:opacity-100")}
              aria-label={`Bild ${i + 1} anzeigen`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(im.key, 400)} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div className="animate-fade-in fixed inset-0 z-[90] flex items-center justify-center bg-black/95" role="dialog" aria-modal="true" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(images[idx].key, 1600)} alt={title} className="animate-scale-in max-h-[92vh] max-w-[96vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button type="button" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white" aria-label="Schließen">
            <X className="h-6 w-6" />
          </button>
          {n > 1 && (
            <>
              <button type="button" onClick={(e) => (e.stopPropagation(), setIdx((idx - 1 + n) % n))} className="absolute left-3 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white" aria-label="Vorheriges Bild">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" onClick={(e) => (e.stopPropagation(), setIdx((idx + 1) % n))} className="absolute right-3 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white" aria-label="Nächstes Bild">
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
