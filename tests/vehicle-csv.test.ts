import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCsv, parseVehicleCsv, vehicleRowsToCsv, type VehicleRow } from "../src/lib/vehicle-csv";

const golf: VehicleRow = {
  type: "auto",
  make: "Volkswagen",
  model: "Golf",
  generation: "Golf VII (5G)",
  yearFrom: 2012,
  yearTo: 2020,
  boltCount: 5,
  boltCircle: 112,
  centerBore: 57.1,
  thread: "M14x1,5",
  fastener: "Schraube",
  etMin: 40,
  etMax: 51,
  specs: [
    { position: "alle", diameter: 16, width: 6.5, et: 46, tireSize: "205/55 R16" },
    { position: "alle", diameter: 18, width: 7.5, et: 51, tireSize: "225/40 R18" },
  ],
  notes: 'Hinweis mit "Anführungszeichen"; und Semikolon',
};

describe("Fahrzeug-CSV", () => {
  it("Export und Import ergeben wieder dieselben Daten", () => {
    const moto: VehicleRow = { ...golf, type: "motorrad", make: "Yamaha", model: "MT-07", generation: null, boltCount: null, boltCircle: null, centerBore: null, thread: null, fastener: null, etMin: null, etMax: null, specs: [], notes: null, yearFrom: null, yearTo: null };
    const csv = vehicleRowsToCsv([golf, moto]);
    assert.ok(csv.startsWith("﻿Typ;Marke;Modell"));
    const { rows, errors } = parseVehicleCsv(csv);
    assert.deepEqual(errors, []);
    assert.deepEqual(rows, [golf, moto]);
  });

  it("akzeptiert Komma als Trennzeichen, andere Spaltenreihenfolge und Dezimalkomma", () => {
    const { rows, errors } = parseVehicleCsv('Marke,Modell,Typ,Lochkreis,Mittenloch,Radgrößen\nBMW,3er,PKW,5x120,"72,6","8Jx18 ET34 225/40 R18 | H 8,5Jx18 ET37 255/35 R18"');
    assert.deepEqual(errors, []);
    assert.equal(rows[0].type, "auto");
    assert.equal(rows[0].centerBore, 72.6);
    assert.equal(rows[0].specs.length, 2);
    assert.equal(rows[0].specs[1].width, 8.5);
    assert.equal(rows[0].specs[1].position, "hinten");
  });

  it("meldet fehlerhafte Zeilen mit Zeilennummer und übernimmt den Rest", () => {
    const { rows, errors } = parseVehicleCsv("Typ;Marke;Modell;Lochkreis\nAuto;Audi;A4;5x112\nLKW;MAN;TGX;\nAuto;;A3;5-112");
    assert.equal(rows.length, 1);
    assert.equal(errors.length, 2);
    assert.match(errors[0], /^Zeile 3: Typ „LKW“ unbekannt/);
    assert.match(errors[1], /^Zeile 4: Marke fehlt, Lochkreis „5-112“ ungültig/);
  });

  it("verlangt die Spalten Typ, Marke und Modell", () => {
    assert.match(parseVehicleCsv("Name;Wert\na;b").errors[0], /Spalte\(n\) fehlen: Typ, Marke, Modell/);
  });

  it("parseCsv kennt Zeilenumbrüche in Anführungszeichen", () => {
    assert.deepEqual(parseCsv('a;b\r\n"x\ny";z\r\n'), [
      ["a", "b"],
      ["x\ny", "z"],
    ]);
  });
});
