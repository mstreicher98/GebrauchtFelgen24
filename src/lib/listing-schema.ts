import { z } from "zod";
import { MAX_IMAGES } from "./constants";
import { parseTireSize } from "./fitment";

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
    kind: z.enum(["felge", "komplettrad", "reifen"], { error: "Bitte wählen, was du verkaufst" }),
    title: z.string().trim().min(8, "Titel ist zu kurz (mind. 8 Zeichen)").max(90, "Titel ist zu lang (max. 90 Zeichen)"),
    description: z.string().trim().max(4000, "Beschreibung ist zu lang").default(""),
    // Felgenangaben – Pflicht außer bei „nur Reifen“ (siehe superRefine)
    material: z.enum(["alu", "stahl", "geschmiedet", "carbon", "magnesium", "speiche"]).optional().or(z.literal("")),
    rimBrand: z.string().trim().max(60).optional().or(z.literal("")),
    rimModel: z.string().trim().max(60).optional().or(z.literal("")),
    diameter: optNum(z.number().min(8, "Ungültige Zollgröße").max(26, "Ungültige Zollgröße")),
    width: optNum(z.number().min(1.5, "Ungültige Felgenbreite").max(14, "Ungültige Felgenbreite")),
    pcd: z.string().trim().optional().or(z.literal("")),
    et: optNum(z.number().int().min(-100).max(120)),
    centerBore: optNum(z.number().min(40).max(180)),
    quantity: reqNum(z.number().int().min(1).max(8), "Bitte Anzahl angeben"),
    wheelPosition: z.enum(["alle", "vorne", "hinten"]).default("alle"),
    condition: z.enum(["neu", "neuwertig", "gebraucht", "beschaedigt"], { error: "Bitte Zustand wählen" }),
    hasCertificate: bool.default(false),
    tireSize: z.string().trim().max(40).optional().or(z.literal("")),
    tireBrand: z.string().trim().max(40).optional().or(z.literal("")),
    tireModel: z.string().trim().max(60).optional().or(z.literal("")),
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
  .superRefine(
    (v, ctx) => {
    // Läuft auch, wenn andere Felder noch Fehler haben (das Formular prüft Schritt für Schritt) – Werte können daher unvollständig sein
    const issue = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
    if (v.kind !== "felge" && v.kind !== "komplettrad" && v.kind !== "reifen") return;
    if (v.kind === "reifen") {
      if (!parseTireSize(v.tireSize)) issue("tireSize", "Bitte Reifengröße angeben, z. B. 225/45 R17");
      if (!v.tireBrand || v.tireBrand.length < 2) issue("tireBrand", "Bitte Reifenmarke angeben");
      if (!v.season) issue("season", "Bitte Saison angeben");
      if (typeof v.treadDepth !== "number") issue("treadDepth", "Bitte Profiltiefe angeben");
      if (!v.shipping && !v.pickup) issue("pickup", "Bitte Versand und/oder Abholung wählen");
      return;
    }
    if (!v.material) issue("material", "Bitte Material wählen");
    if (!v.rimBrand || v.rimBrand.length < 2) issue("rimBrand", "Bitte Felgenmarke angeben");
    if (typeof v.diameter !== "number") issue("diameter", "Bitte Zollgröße angeben");
    if (typeof v.width !== "number") issue("width", "Bitte Felgenbreite angeben");
    if (v.vehicleType === "auto") {
      if (typeof v.pcd !== "string" || !/^\d{1,2}x\d{2,3}(\.\d)?$/.test(v.pcd.replace(",", "."))) {
        ctx.addIssue({ code: "custom", path: ["pcd"], message: "Bitte Lochkreis angeben, z. B. 5x112" });
      }
      if (typeof v.et !== "number") ctx.addIssue({ code: "custom", path: ["et"], message: "Bitte Einpresstiefe (ET) angeben" });
    }
    if (v.vehicleType === "motorrad" && !v.fitments?.length) {
      ctx.addIssue({ code: "custom", path: ["fitments"], message: "Bitte mindestens ein passendes Motorrad auswählen" });
    }
    if (v.kind === "komplettrad") {
      if (!v.tireSize) ctx.addIssue({ code: "custom", path: ["tireSize"], message: "Bitte Reifengröße angeben" });
      if (!v.season) ctx.addIssue({ code: "custom", path: ["season"], message: "Bitte Saison angeben" });
      if (typeof v.treadDepth !== "number") ctx.addIssue({ code: "custom", path: ["treadDepth"], message: "Bitte Profiltiefe angeben" });
    }
    if (!v.shipping && !v.pickup) {
      ctx.addIssue({ code: "custom", path: ["pickup"], message: "Bitte Versand und/oder Abholung wählen" });
    }
    },
    { when: () => true },
  );

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
