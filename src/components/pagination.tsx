import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const list = [...nums].sort((a, b) => a - b);
  const step = "btn btn-outline btn-sm gap-1 px-3";
  return (
    <nav className="mt-10 flex flex-col items-center gap-3" aria-label="Seiten">
      <div className="flex items-center gap-1 sm:gap-1.5">
        {page > 1 ? (
          <Link href={makeHref(page - 1)} className={step} aria-label="Vorherige Seite" rel="prev">
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Zurück</span>
          </Link>
        ) : (
          <span className={clsx(step, "pointer-events-none opacity-40")} aria-hidden>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Zurück</span>
          </span>
        )}
        {list.map((n, i) => (
          <span key={n} className="flex items-center gap-1 sm:gap-1.5">
            {i > 0 && n - list[i - 1] > 1 && (
              <span className="w-5 text-center text-faint" aria-hidden>
                …
              </span>
            )}
            <Link
              href={makeHref(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Seite ${n}`}
              className={clsx(
                "grid h-9 min-w-9 place-items-center rounded-full px-2 text-sm font-semibold tabular-nums transition-colors",
                n === page ? "bg-brand-fill text-on-brand" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              {n}
            </Link>
          </span>
        ))}
        {page < pages ? (
          <Link href={makeHref(page + 1)} className={step} aria-label="Nächste Seite" rel="next">
            <span className="hidden sm:inline">Weiter</span>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <span className={clsx(step, "pointer-events-none opacity-40")} aria-hidden>
            <span className="hidden sm:inline">Weiter</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="text-xs text-faint">
        Seite {page} von {pages}
      </p>
    </nav>
  );
}
