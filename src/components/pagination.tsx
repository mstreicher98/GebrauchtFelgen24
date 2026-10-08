import { clsx } from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const list = [...nums].sort((a, b) => a - b);
  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Seiten">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className="btn btn-outline btn-sm btn-icon" aria-label="Vorherige Seite">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
      {list.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - list[i - 1] > 1 && <span className="px-1 text-faint">…</span>}
          <Link
            href={makeHref(n)}
            aria-current={n === page ? "page" : undefined}
            className={clsx("btn btn-sm min-w-9 px-3", n === page ? "btn-gold" : "btn-outline")}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={makeHref(page + 1)} className="btn btn-outline btn-sm btn-icon" aria-label="Nächste Seite">
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
