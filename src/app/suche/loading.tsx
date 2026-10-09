import { ListingCardSkeleton } from "@/components/listing-card";

export default function SearchLoading() {
  return (
    <div className="container-page pb-12 pt-4 sm:pt-6" aria-busy="true" aria-label="Suchergebnisse werden geladen">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-4 h-9 w-72 max-w-full" />
      <div className="skeleton mt-3 h-6 w-48" />
      <div className="mt-5 flex gap-2 overflow-hidden">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className="skeleton h-9 w-16 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="skeleton mt-5 h-20 rounded-2xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
        <div className="hidden h-[40rem] overflow-hidden rounded-2xl border border-line bg-surface lg:block">
          <div className="border-b border-line px-5 py-4">
            <div className="skeleton h-5 w-24" />
          </div>
          <div className="space-y-6 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2.5">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-10" />
              </div>
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="skeleton h-9 w-28 rounded-full" />
            <div className="skeleton h-9 w-52 rounded-full" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
