import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkFitment, levelVisible, normalizeTireSize, type FitGeneration, type FitListing } from "../src/lib/fitment";

const golf7: FitGeneration = {
  boltCount: 5,
  boltCircle: 112,
  centerBore: 57.1,
  etMin: 40,
  etMax: 51,
  widthMin: 5.5,
  widthMax: 8.5,
  diameterMin: 15,
  diameterMax: 19,
  specs: [
    { position: "alle", diameter: 16, width: 6.5, et: 46, tireSize: "205/55 R16" },
    { position: "alle", diameter: 18, width: 7.5, et: 49, tireSize: "225/40 R18" },
  ],
};

const rim = (o: Partial<FitListing> = {}): FitListing => ({
  vehicleType: "auto",
  kind: "felge",
  boltCount: 5,
  boltCircle: 112,
  centerBore: 57.1,
  diameter: 18,
  width: 7.5,
  et: 49,
  tireSize: null,
  wheelPosition: "alle",
  explicitFit: false,
  ...o,
});

describe("checkFitment (Auto)", () => {
  it("erkennt Seriengröße als perfekt", () => {
    assert.equal(checkFitment(golf7, rim()).level, "perfekt");
  });
  it("innerhalb der Freigabe, aber keine Seriengröße → passend", () => {
    assert.equal(checkFitment(golf7, rim({ width: 8, et: 45 })).level, "passend");
  });
  it("größeres Mittenloch → Zentrierring", () => {
    const r = checkFitment(golf7, rim({ centerBore: 72.6 }));
    assert.equal(r.level, "zentrierring");
    assert.match(r.hints.join(), /Zentrierring 72.6 → 57.1/);
  });
  it("zu kleines Mittenloch passt nicht", () => {
    assert.equal(checkFitment(golf7, rim({ centerBore: 54.1 })).level, "nein");
  });
  it("anderer Lochkreis passt nicht", () => {
    assert.equal(checkFitment(golf7, rim({ boltCircle: 120 })).level, "nein");
    assert.equal(checkFitment(golf7, rim({ boltCount: 4, boltCircle: 100 })).level, "nein");
  });
  it("leicht abweichende ET → nur im lockeren Modus", () => {
    const r = checkFitment(golf7, rim({ et: 35 }));
    assert.equal(r.level, "pruefen");
    assert.equal(levelVisible(r.level, "streng"), false);
    assert.equal(levelVisible(r.level, "locker"), true);
  });
  it("stark abweichende ET passt nicht", () => {
    assert.equal(checkFitment(golf7, rim({ et: 20 })).level, "nein");
  });
  it("Zoll +1 → prüfen, Zoll +2 → nein", () => {
    assert.equal(checkFitment(golf7, rim({ diameter: 20, width: 8.5, et: 45 })).level, "pruefen");
    assert.equal(checkFitment(golf7, rim({ diameter: 21, width: 8.5, et: 45 })).level, "nein");
  });
  it("fehlendes Mittenloch → prüfen", () => {
    assert.equal(checkFitment(golf7, rim({ centerBore: null })).level, "pruefen");
  });
  it("vom Verkäufer angegebenes Fahrzeug zählt mindestens als passend", () => {
    assert.equal(checkFitment(golf7, rim({ et: 35, explicitFit: true })).level, "passend");
  });
  it("Komplettrad mit nicht freigegebener Reifengröße bekommt Hinweis", () => {
    const r = checkFitment(golf7, rim({ kind: "komplettrad", tireSize: "235/35 R18" }));
    assert.match(r.hints.join(), /Reifengröße/);
    const ok = checkFitment(golf7, rim({ kind: "komplettrad", tireSize: "225/40 ZR18 92Y" }));
    assert.doesNotMatch(ok.hints.join(), /Reifengröße/);
  });
});

describe("checkFitment (Motorrad)", () => {
  const mt07: FitGeneration = {
    ...golf7,
    boltCount: null,
    boltCircle: null,
    centerBore: null,
    specs: [
      { position: "vorne", diameter: 17, width: 3.5, et: null, tireSize: "120/70 ZR17" },
      { position: "hinten", diameter: 17, width: 5.5, et: null, tireSize: "180/55 ZR17" },
    ],
  };
  const moto = (o: Partial<FitListing>) => rim({ vehicleType: "motorrad", boltCount: null, boltCircle: null, centerBore: null, et: null, ...o });

  it("explizit angegeben → perfekt", () => {
    assert.equal(checkFitment(mt07, moto({ diameter: 17, width: 5.5, wheelPosition: "hinten", explicitFit: true })).level, "perfekt");
  });
  it("gleiche Größe ohne Angabe → prüfen", () => {
    assert.equal(checkFitment(mt07, moto({ diameter: 17, width: 5.5, wheelPosition: "hinten" })).level, "pruefen");
  });
  it("Hinterradgröße als Vorderrad passt nicht", () => {
    assert.equal(checkFitment(mt07, moto({ diameter: 17, width: 5.5, wheelPosition: "vorne" })).level, "nein");
  });
});

describe("normalizeTireSize", () => {
  it("vereinheitlicht Schreibweisen", () => {
    assert.equal(normalizeTireSize("225/45 ZR17 94W"), "225/45r17");
    assert.equal(normalizeTireSize("225/45R17"), "225/45r17");
    assert.equal(normalizeTireSize("150/80B16"), "150/80r16");
    assert.equal(normalizeTireSize("90/90-21"), "90/90r21");
  });
});
