import { asc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { listing, listingFitment, listingImage } from "@/db/schema";
import { ListingForm } from "@/components/listing-form";
import type { ListingFormValues } from "@/lib/listing-form-values";
import { formatPcd } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { generationLabel, getGenerationNames } from "@/lib/vehicles";

export const metadata: Metadata = { title: "Inserat bearbeiten", robots: { index: false } };

const str = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

export default async function EditListingPage(props: PageProps<"/inserat/[slug]/bearbeiten">) {
  const id = Number((await props.params).slug.match(/^\d+/)?.[0]);
  const me = await requireUser(`/inserat/${id}/bearbeiten`);
  if (!id) notFound();
  const [l] = await db.select().from(listing).where(eq(listing.id, id)).limit(1);
  if (!l || (l.userId !== me.id && me.role !== "admin")) notFound();

  const [images, fits] = await Promise.all([
    db.select({ key: listingImage.key }).from(listingImage).where(eq(listingImage.listingId, id)).orderBy(asc(listingImage.position)),
    db.select({ g: listingFitment.generationId }).from(listingFitment).where(eq(listingFitment.listingId, id)),
  ]);
  const names = await getGenerationNames(fits.map((f) => f.g));

  const initial: ListingFormValues = {
    vehicleType: l.vehicleType,
    kind: l.kind,
    title: l.title,
    description: l.description,
    material: l.material,
    rimBrand: l.rimBrand,
    rimModel: l.rimModel ?? "",
    diameter: String(l.diameter),
    width: str(l.width),
    pcd: formatPcd(l.boltCount, l.boltCircle) ?? "",
    et: l.et == null ? "" : String(l.et),
    centerBore: str(l.centerBore),
    quantity: String(l.quantity),
    wheelPosition: l.wheelPosition,
    condition: l.condition,
    hasCertificate: l.hasCertificate,
    tireSize: l.tireSize ?? "",
    tireBrand: l.tireBrand ?? "",
    season: l.season ?? "",
    treadDepth: str(l.treadDepth),
    dot: l.dot ?? "",
    tpms: !!l.tpms,
    price: str(l.priceCents / 100),
    priceType: l.priceType,
    shipping: l.shipping,
    pickup: l.pickup,
    shippingCost: l.shippingCostCents == null ? "" : str(l.shippingCostCents / 100),
    zip: l.zip,
    zipLabel: `${l.zip} ${l.city}`,
    country: l.country as ListingFormValues["country"],
    showPhone: l.showPhone,
    imageKeys: images.map((i) => i.key),
    fitments: names.map((n) => ({ id: n.id, label: `${n.makeName} ${generationLabel(n.modelName, n.name)}` })),
  };

  return (
    <div className="container-page py-8">
      <div className="mx-auto mb-8 max-w-3xl">
        <h1 className="font-display text-3xl font-bold uppercase">Inserat bearbeiten</h1>
        <p className="mt-1 text-muted">{l.title}</p>
      </div>
      <ListingForm initial={initial} listingId={l.id} userPhone={me.phone} />
    </div>
  );
}
