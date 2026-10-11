import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fieldErrors, listingSchema } from "../src/lib/listing-schema";

const base = {
  vehicleType: "auto",
  title: "4x Michelin Pilot Sport 4 225/40 R18",
  description: "",
  quantity: "4",
  condition: "gebraucht",
  price: "240",
  priceType: "vb",
  shipping: false,
  pickup: true,
  zip: "1100",
  country: "AT",
  imageKeys: ["abcdefghijklmnop1234"],
  fitments: [],
};

describe("listingSchema", () => {
  it("akzeptiert ein Reifen-Inserat ohne Felgenangaben", () => {
    const r = listingSchema.safeParse({ ...base, kind: "reifen", tireSize: "225/40 ZR18 92Y", tireBrand: "Michelin", season: "sommer", treadDepth: "5" });
    assert.ok(r.success, r.success ? "" : JSON.stringify(fieldErrors(r.error)));
  });

  it("meldet fehlende Reifenangaben auch, wenn Preis und Titel noch fehlen (Prüfung pro Schritt)", () => {
    const r = listingSchema.safeParse({ ...base, kind: "reifen", title: "", price: "", tireSize: "", tireBrand: "", season: "" });
    assert.equal(r.success, false);
    const e = fieldErrors(r.error!);
    assert.ok(e.tireSize && e.tireBrand && e.season && e.treadDepth, JSON.stringify(e));
    assert.ok(e.price && e.title);
  });

  it("verlangt bei Felgen weiterhin Marke, Material, Größe, Lochkreis und ET", () => {
    const r = listingSchema.safeParse({ ...base, kind: "felge", material: "", rimBrand: "", price: "" });
    const e = fieldErrors(r.error!);
    for (const k of ["material", "rimBrand", "diameter", "width", "pcd", "et"]) assert.ok(e[k], `${k} fehlt in ${JSON.stringify(e)}`);
  });

  it("lehnt ungültige Reifengrößen ab", () => {
    const r = listingSchema.safeParse({ ...base, kind: "reifen", tireSize: "groß", tireBrand: "Michelin", season: "sommer", treadDepth: "5" });
    assert.equal(fieldErrors(r.error!).tireSize, "Bitte Reifengröße angeben, z. B. 225/45 R17");
  });
});
