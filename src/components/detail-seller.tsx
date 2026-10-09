import { clsx } from "clsx";
import { ArrowRight, BadgeCheck, Clock, MailCheck, MapPin, Phone, PhoneCall, Store, UserRound } from "lucide-react";
import Link from "next/link";
import type { user } from "@/db/schema";
import { formatRelative } from "@/lib/format";

type Seller = typeof user.$inferSelect;

/** „Zuletzt aktiv …“ nur anzeigen, wenn es aussagekräftig ist (letzte 30 Tage) */
function recentActivity(d: Date | null) {
  if (!d || Date.now() - d.getTime() > 1000 * 60 * 60 * 24 * 30) return null;
  return formatRelative(d);
}

/** Verkäuferkarte (Marktplatz): wer verkauft, wo, wie vertrauenswürdig. */
export function DetailSeller({
  seller,
  displayName,
  location,
  activeListings,
  phone,
  className,
}: {
  seller: Seller;
  displayName: string;
  location: string;
  activeListings: number;
  /** Nur gesetzt, wenn der Verkäufer die Nummer in diesem Inserat freigegeben hat */
  phone?: string | null;
  className?: string;
}) {
  const dealer = seller.accountType === "haendler";
  const lastSeen = recentActivity(seller.lastSeenAt);

  return (
    <section id="anbieter" aria-labelledby="anbieter-title" className={clsx("card scroll-mt-24 p-5 sm:p-6", className)}>
      <h2 id="anbieter-title" className="font-display text-lg uppercase tracking-wide sm:text-xl">
        Anbieter
      </h2>

      <div className="mt-4 flex items-center gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-soft text-xl font-bold text-brand">
          {dealer ? <Store className="h-6 w-6" aria-hidden="true" /> : displayName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <Link href={`/nutzer/${seller.id}`} className="block text-lg font-bold leading-tight text-balance hover:text-brand">
            {displayName}
          </Link>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            {dealer ? (
              <span className="badge badge-brand">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Gewerblicher Händler
              </span>
            ) : (
              <span className="badge">
                <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> Privat
              </span>
            )}
            <span>Mitglied seit {seller.createdAt.getFullYear()}</span>
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-x-6 gap-y-2.5 text-sm text-muted sm:grid-cols-2">
        <li className="flex items-center gap-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
          <span className="truncate">{location}</span>
        </li>
        {lastSeen && (
          <li className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
            Zuletzt aktiv {lastSeen}
          </li>
        )}
        {seller.emailVerified && (
          <li className="flex items-center gap-2.5">
            <MailCheck className="h-4 w-4 shrink-0 text-green" aria-hidden="true" />
            E-Mail-Adresse bestätigt
          </li>
        )}
        {seller.phoneVerified && (
          <li className="flex items-center gap-2.5">
            <PhoneCall className="h-4 w-4 shrink-0 text-green" aria-hidden="true" />
            Telefonnummer bestätigt
          </li>
        )}
      </ul>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <Link href={`/nutzer/${seller.id}`} className="btn btn-outline flex-1">
          {activeListings > 1 ? `Alle ${activeListings} Inserate ansehen` : "Profil ansehen"}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="btn btn-outline flex-1">
            <Phone className="h-4 w-4" aria-hidden="true" /> {phone}
          </a>
        )}
      </div>
    </section>
  );
}
