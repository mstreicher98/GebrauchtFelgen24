import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findPlaceholders, parseInline, parseLegal, safeHref } from "../src/lib/legal-markdown";

describe("parseLegal", () => {
  it("erkennt Überschriften, Absätze und Listen", () => {
    const blocks = parseLegal("## Betreiber\nFirma\nStraße 1\n\n### Kontakt\n- E-Mail\n- Telefon\n\n1. Erstens\n2. Zweitens");
    assert.deepEqual(
      blocks.map((b) => b.t),
      ["h2", "p", "h3", "ul", "ol"],
    );
    const p = blocks[1];
    assert.ok(p.t === "p");
    assert.deepEqual(p.c, [{ t: "text", v: "Firma" }, { t: "br" }, { t: "text", v: "Straße 1" }]);
    const ul = blocks[3];
    assert.ok(ul.t === "ul");
    assert.equal(ul.items.length, 2);
  });

  it("hängt eingerückte Folgezeilen an den Listenpunkt", () => {
    const [ul] = parseLegal("- erster Punkt\n  geht weiter\n- zweiter");
    assert.ok(ul.t === "ul");
    assert.equal(ul.items.length, 2);
    assert.deepEqual(ul.items[0], [{ t: "text", v: "erster Punkt" }, { t: "br" }, { t: "text", v: "geht weiter" }]);
  });

  it("verbindet § und Art. mit geschütztem Leerzeichen", () => {
    const [p] = parseLegal("Gemäß § 5 ECG und Art. 6 DSGVO");
    assert.ok(p.t === "p");
    assert.deepEqual(p.c, [{ t: "text", v: "Gemäß § 5 ECG und Art. 6 DSGVO" }]);
  });
});

describe("parseInline", () => {
  it("erkennt fett, kursiv, Links und Platzhalter", () => {
    assert.deepEqual(parseInline("**Achtung** *bitte* [[Firmenname]] [RIS](https://www.ris.bka.gv.at)"), [
      { t: "strong", c: [{ t: "text", v: "Achtung" }] },
      { t: "text", v: " " },
      { t: "em", c: [{ t: "text", v: "bitte" }] },
      { t: "text", v: " " },
      { t: "ph", v: "Firmenname" },
      { t: "text", v: " " },
      { t: "link", href: "https://www.ris.bka.gv.at", c: [{ t: "text", v: "RIS" }] },
    ]);
  });

  it("übernimmt kein HTML und keine gefährlichen Links", () => {
    assert.deepEqual(parseInline("<script>x</script>"), [{ t: "text", v: "<script>x</script>" }]);
    assert.deepEqual(parseInline("[klick](javascript:alert(1))"), [{ t: "text", v: "klick" }, { t: "text", v: ")" }]);
    assert.equal(safeHref("//evil.example"), null);
    assert.equal(safeHref("/sicherheit"), "/sicherheit");
    assert.equal(safeHref("mailto:office@example.at"), "mailto:office@example.at");
  });
});

describe("findPlaceholders", () => {
  it("findet alle offenen Platzhalter", () => {
    assert.deepEqual(findPlaceholders("[[Firma]] in [[PLZ Ort]], [kein](https://x.at)"), ["Firma", "PLZ Ort"]);
  });
});
