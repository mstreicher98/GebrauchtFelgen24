import Link from "next/link";
import { RimMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="relative">
        <RimMark className="animate-spin-slow h-28 w-28 text-fg" />
      </div>
      <h1 className="font-display mt-6 text-5xl font-bold uppercase">404</h1>
      <p className="mt-2 text-muted">Hier ist uns wohl ein Rad abgefallen – diese Seite gibt es nicht (mehr).</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn btn-outline">Zur Startseite</Link>
        <Link href="/suche" className="btn btn-gold">Felgen suchen</Link>
      </div>
    </div>
  );
}
