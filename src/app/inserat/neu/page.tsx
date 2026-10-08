import type { Metadata } from "next";
import { ListingForm } from "@/components/listing-form";
import { env } from "@/lib/env";
import { emptyListingForm } from "@/lib/listing-form-values";
import { VerifyEmailNotice } from "@/components/verify-email-notice";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Felgen inserieren", robots: { index: false } };

export default async function NewListingPage() {
  const me = await requireUser("/inserat/neu");
  if (!me.emailVerified) {
    return (
      <div className="container-page py-16">
        <VerifyEmailNotice email={me.email} />
      </div>
    );
  }
  const country = (["AT", "DE", "CH"].includes(me.country ?? "") ? me.country : "AT") as "AT" | "DE" | "CH";
  return (
    <div className="container-page py-8">
      <div className="mx-auto mb-8 max-w-3xl">
        <h1 className="font-display text-3xl font-bold uppercase sm:text-4xl">
          Felgen <span className="text-gradient-gold">inserieren</span>
        </h1>
        <p className="mt-2 text-muted">Kostenlos, in wenigen Minuten online und {env.listingLifetimeDays} Tage sichtbar.</p>
      </div>
      <ListingForm initial={emptyListingForm(me.zip ?? "", country, me.zip ? `${me.zip} ${me.city ?? ""}`.trim() : "")} userPhone={me.phone} />
    </div>
  );
}
