import type { Metadata } from "next";
import { LegalPage, P } from "@/components/legal";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum" updated="Oktober 2026">
      <p>Informationen gemäß § 5 E-Commerce-Gesetz (ECG), § 14 Unternehmensgesetzbuch (UGB), § 63 Gewerbeordnung (GewO) und Offenlegungspflicht gemäß § 25 Mediengesetz (MedienG).</p>

      <h2>Betreiber</h2>
      <p>
        <P>Firmenname GmbH</P>
        <br />
        <P>Straße Hausnummer</P>
        <br />
        <P>PLZ Ort</P>, Österreich
      </p>

      <h3>Kontakt</h3>
      <p>
        E-Mail: <P>office@gebrauchtfelgen24.at</P>
        <br />
        Telefon: <P>+43 …</P>
      </p>

      <h3>Unternehmensdaten</h3>
      <ul>
        <li>Unternehmensgegenstand: Betrieb eines Online-Marktplatzes für Felgen und Kompletträder</li>
        <li>Firmenbuchnummer: <P>FN 123456a</P></li>
        <li>Firmenbuchgericht: <P>Handelsgericht Wien / Landesgericht …</P></li>
        <li>UID-Nummer: <P>ATU12345678</P></li>
        <li>Geschäftsführung: <P>Vorname Nachname</P></li>
        <li>Mitglied der Wirtschaftskammer: <P>WKO Bundesland, Fachgruppe …</P></li>
        <li>Gewerbebehörde: <P>Magistrat / Bezirkshauptmannschaft …</P></li>
        <li>Anwendbare Rechtsvorschriften: Gewerbeordnung, abrufbar unter www.ris.bka.gv.at</li>
      </ul>

      <h2>Offenlegung nach § 25 MedienG</h2>
      <p>
        Medieninhaber: <P>Firmenname GmbH</P>. Grundlegende Richtung: Online-Marktplatz zum Kauf und Verkauf gebrauchter Felgen und Kompletträder sowie
        Informationen rund um Rad-/Reifenkombinationen.
      </p>

      <h2>Kontaktstelle nach dem Digital Services Act (DSA)</h2>
      <p>
        Zentrale Kontaktstelle für Behörden und Nutzer (Art. 11 und 12 DSA): <P>dsa@gebrauchtfelgen24.at</P>. Kommunikation in deutscher und englischer
        Sprache. Rechtswidrige Inhalte können zudem direkt über die Funktion „Melden“ bei jedem Inserat und Nutzerprofil gemeldet werden.
      </p>

      <h2>Haftung für Inhalte</h2>
      <p>
        Inserate werden von Nutzern erstellt. Für deren Richtigkeit, insbesondere technische Angaben zu Felgen, Reifen und Passform, übernimmt der Betreiber keine
        Gewähr. Die Fahrzeugdatenbank dient der Orientierung; maßgeblich sind Fahrzeugpapiere (Zulassungsbescheinigung/Typenschein, COC) und Felgengutachten.
      </p>

      <h2>Bildnachweise & Daten</h2>
      <p>Postleitzahl-Koordinaten: GeoNames (geonames.org), lizenziert unter CC BY 4.0.</p>
    </LegalPage>
  );
}
