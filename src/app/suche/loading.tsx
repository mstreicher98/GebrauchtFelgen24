import { ListingCardSkeleton } from "@/components/listing-card";

export default function SearchLoading() {
  return (
    <div className="container-page py-8">
      <div className="skeleton mb-2 h-10 w-64" />
      <div className="skeleton mb-8 h-5 w-32" />
      <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <div className="hidden space-y-4 lg:block">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
