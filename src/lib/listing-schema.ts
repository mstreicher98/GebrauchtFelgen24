import { z } from "zod";
import { MAX_IMAGES } from "./constants";

const optNum = (schema: z.ZodNumber) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(String(v).replace(",", "."))), schema.optional());
const reqNum = (schema: z.ZodNumber, msg: string) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(String(v).replace(",", "."))),
    z.number({ error: msg }).pipe(schema),
  );
const bool = z.preprocess((v) => v === true || v === "true" || v === "on" || v === "1", z.boolean());

export const listingSchema = z
  .object({
    vehicleType: z.enum(["auto", "motorrad"], { error: "Bitte Fahrzeugart wählen" }),
    kind: z.enum(["felge", "komplettrad"], { error: "Bitte Felge oder Komplettrad wählen" }),
    title: z.string().trim().min(8, "Titel ist zu kurz (mind. 8 Zeichen)").max(90, "Titel ist zu lang (max. 90 Zeichen)"),
    description: z.string().trim().max(4000, "Beschreibung ist zu lang").default(""),
    material: z.enum(["alu", "stahl", "geschmiedet", "carbon", "magnesium", "speiche"], { error: "Bitte Material wählen" }),
    rimBrand: z.string().trim().min(2, "Bitte Felgenmarke angeben").max(60),
    rimModel: z.string().trim().max(60).optional().or(z.literal("")),
    diameter: reqNum(z.number().min(8).max(26), "Bitte Zollgröße angeben"),
    width: reqNum(z.number().min(1.5).max(14), "Bitte Felgenbreite angeben"),
    pcd: z.string().trim().optional().or(z.literal("")),
    et: optNum(z.number().int().min(-100).max(120)),
    centerBore: optNum(z.number().min(40).max(180)),
    quantity: reqNum(z.number().int().min(1).max(8), "Bitte Anzahl angeben"),
    wheelPosition: z.enum(["alle", "vorne", "hinten"]).default("alle"),
    condition: z.enum(["neu", "neuwertig", "gebraucht", "beschaedigt"], { error: "Bitte Zustand wählen" }),
    hasCertificate: bool.default(false),
    tireSize: z.string().trim().max(40).optional().or(z.literal("")),
    tireBrand: z.string().trim().max(40).optional().or(z.literal("")),
    season: z.enum(["sommer", "winter", "ganzjahr"]).optional().or(z.literal("")),
    treadDepth: optNum(z.number().min(0).max(20)),
    dot: z
      .string()
      .trim()
      .regex(/^(\d{4})?$/, "DOT bitte vierstellig angeben, z. B. 2321 (KW 23/2021)")
      .optional(),
    tpms: bool.default(false),
    price: reqNum(z.number().min(1, "Preis muss mindestens 1 € sein").max(100_000), "Bitte Preis angeben"),
    priceType: z.enum(["fest", "vb"]).default("vb"),
    shipping: bool.default(false),
    pickup: bool.default(true),
    shippingCost: optNum(z.number().min(0).max(1000)),
    zip: z.string().trim().regex(/^\d{4,5}$/, "Bitte gültige PLZ angeben"),
    country: z.enum(["AT", "DE", "CH"]).default("AT"),
    showPhone: bool.default(false),
    imageKeys: z.array(z.string().regex(/^[A-Za-z0-9_-]{16,40}$/)).min(1, "Bitte mindestens ein Foto hochladen").max(MAX_IMAGES),
    fitments: z.array(z.number().int().positive()).max(30).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.vehicleType === "auto") {
      if (!v.pcd || !/^\d{1,2}x\d{2,3}(\.\d)?$/.test(v.pcd.replace(",", "."))) {
        ctx.addIssue({ code: "custom", path: ["pcd"], message: "Bitte Lochkreis angeben, z. B. 5x112" });
      }
      if (v.et === undefined) ctx.addIssue({ code: "custom", path: ["et"], message: "Bitte Einpresstiefe (ET) angeben" });
    }
    if (v.vehicleType === "motorrad" && v.fitments.length === 0) {
      ctx.addIssue({ code: "custom", path: ["fitments"], message: "Bitte mindestens ein passendes Motorrad auswählen" });
    }
    if (v.kind === "komplettrad") {
      if (!v.tireSize) ctx.addIssue({ code: "custom", path: ["tireSize"], message: "Bitte Reifengröße angeben" });
      if (!v.season) ctx.addIssue({ code: "custom", path: ["season"], message: "Bitte Saison angeben" });
      if (v.treadDepth === undefined) ctx.addIssue({ code: "custom", path: ["treadDepth"], message: "Bitte Profiltiefe angeben" });
    }
    if (!v.shipping && !v.pickup) {
      ctx.addIssue({ code: "custom", path: ["pickup"], message: "Bitte Versand und/oder Abholung wählen" });
    }
  });

export type ListingInput = z.input<typeof listingSchema>;
export type ListingData = z.output<typeof listingSchema>;

export function fieldErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "_");
    out[k] ??= issue.message;
  }
  return out;
}
