import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cars } from "../data/vehicles/cars";
import { motorcycles } from "../data/vehicles/motorcycles";
import { parseSpec } from "../data/vehicles/types";

describe("parseSpec", () => {
  it("parst Auto-Radgrößen", () => {
    assert.deepEqual(parseSpec("7.5Jx18 ET51 225/40 R18"), [{ position: "alle", diameter: 18, width: 7.5, et: 51, tireSize: "225/40 R18" }]);
  });
  it("parst Mischbereifung", () => {
    const r = parseSpec("V 8Jx19 ET27 225/40 R19 | H 8.5Jx19 ET40 255/35 R19");
    assert.equal(r.length, 2);
    assert.equal(r[0].position, "vorne");
    assert.equal(r[1].width, 8.5);
    assert.equal(r[1].et, 40);
  });
  it("parst Motorrad und reine Zollangabe", () => {
    assert.deepEqual(parseSpec("V 3.50x17 120/70 ZR17")[0], { position: "vorne", diameter: 17, width: 3.5, et: null, tireSize: "120/70 ZR17" });
    assert.deepEqual(parseSpec("H 16 150/80B16")[0], { position: "hinten", diameter: 16, width: null, et: null, tireSize: "150/80B16" });
  });
  it("wirft bei ungültigen Angaben", () => {
    assert.throws(() => parseSpec("Unsinn"));
  });
});

describe("Start-Datensatz", () => {
  const all = [...cars, ...motorcycles];
  it("alle Radgrößen sind gültig und plausibel", () => {
    for (const make of all) {
      for (const [model, gens] of Object.entries(make.models)) {
        for (const g of gens) {
          const where = `${make.name} ${model} ${g.name}`;
          assert.ok(g.specs.length > 0, `${where}: keine Radgrößen`);
          for (const s of g.specs.flatMap(parseSpec)) {
            assert.ok(s.diameter >= 10 && s.diameter <= 23, `${where}: Zoll ${s.diameter}`);
            if (s.width != null) assert.ok(s.width >= 1.5 && s.width <= 12, `${where}: Breite ${s.width}`);
            if (make.type === "auto" && s.et != null && g.et) {
              assert.ok(s.et >= g.et[0] && s.et <= g.et[1], `${where}: Serien-ET ${s.et} außerhalb ${g.et}`);
            }
          }
        }
      }
    }
  });
  it("Autos haben Lochkreis, Mittenloch und Befestigung", () => {
    for (const make of cars) {
      for (const gens of Object.values(make.models)) {
        for (const g of gens) {
          assert.match(g.pcd ?? "", /^\d{1,2}x\d{2,3}(\.\d)?$/, `${make.name} ${g.name}: Lochkreis`);
          assert.ok(g.centerBore && g.centerBore > 50 && g.centerBore < 115, `${make.name} ${g.name}: Mittenloch`);
          assert.match(g.thread ?? "", /^M1[246]x1,(25|5) (Schraube|Mutter)$/, `${make.name} ${g.name}: Befestigung`);
          if (g.from && g.to) assert.ok(g.to >= g.from, `${make.name} ${g.name}: Baujahre`);
        }
      }
    }
  });
  it("keine doppelten Generationen pro Modell", () => {
    for (const make of all) {
      for (const [model, gens] of Object.entries(make.models)) {
        const names = gens.map((g) => g.name);
        assert.equal(new Set(names).size, names.length, `${make.name} ${model}`);
      }
    }
  });
});
