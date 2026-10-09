import type { Metadata } from "next";
import { LegalPage, P } from "@/components/legal";

export const metadata: Metadata = { title: "Datenschutzerklärung" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Datenschutzerklärung" updated="Oktober 2026" current="/datenschutz">
      <p>
        Der Schutz deiner Daten ist uns wichtig. Wir verarbeiten personenbezogene Daten ausschließlich auf Grundlage der Datenschutz-Grundverordnung (DSGVO) und des
        österreichischen Datenschutzgesetzes (DSG). Hier informieren wir dich, welche Daten wir zu welchen Zwecken verarbeiten.
      </p>

      <h2>1. Verantwortlicher</h2>
      <p>
        <P>Firmenname GmbH</P>, <P>Straße Hausnummer</P>, <P>PLZ Ort</P>, Österreich
        <br />
        E-Mail: <P>datenschutz@gebrauchtfelgen24.at</P>
      </p>

      <h2>2. Welche Daten wir verarbeiten</h2>
      <h3>Benutzerkonto</h3>
      <p>
        Name, E-Mail-Adresse, Passwort (nur als sicherer Hash gespeichert), Kontotyp (privat/Händler), bei Händlern Firmenname, UID-Nummer und Website, optional
        Telefonnummer und Standort (Postleitzahl). Rechtsgrundlage: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).
      </p>
      <h3>Anmeldung mit Google oder Apple</h3>
      <p>
        Wenn du dich mit Google oder Apple anmeldest, erhalten wir von diesem Anbieter deinen Namen, deine E-Mail-Adresse und ggf. dein Profilbild. Dabei gelten
        zusätzlich die Datenschutzbestimmungen von Google Ireland Ltd. bzw. Apple Distribution International Ltd. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
      </p>
      <h3>Inserate und Fotos</h3>
      <p>
        Inhalte deiner Inserate (Beschreibung, technische Daten, Preis, Standort auf PLZ-Ebene) sind öffentlich sichtbar. Hochgeladene Fotos werden beim Upload
        verkleinert und dabei alle Metadaten (z. B. GPS-Koordinaten, Kameradaten) entfernt.
      </p>
      <h3>Chat-Nachrichten</h3>
      <p>
        Nachrichten zwischen Käufern und Verkäufern werden gespeichert, um die Kommunikation zu ermöglichen. Deine E-Mail-Adresse wird dabei nicht an das Gegenüber
        weitergegeben. Wir lesen Nachrichten nicht mit; eine Einsicht erfolgt nur, wenn eine Nachricht gemeldet wird oder dies zur Missbrauchsbekämpfung erforderlich
        ist (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <h3>Benachrichtigungen</h3>
      <p>
        E-Mail-Benachrichtigungen (neue Nachrichten, Suchaufträge, ablaufende Inserate) kannst du in den Einstellungen jederzeit abschalten. Push-Benachrichtigungen
        erfolgen nur mit deiner ausdrücklichen Zustimmung im Browser (Art. 6 Abs. 1 lit. a DSGVO); dabei wird eine technische Abo-Adresse deines Browserherstellers
        gespeichert.
      </p>
      <h3>Server-Logdaten</h3>
      <p>
        Beim Aufruf der Seite werden technisch notwendige Daten (IP-Adresse, Zeitpunkt, abgerufene Seite, Browser) zur Sicherstellung des Betriebs und zur Abwehr von
        Angriffen kurzfristig verarbeitet (Art. 6 Abs. 1 lit. f DSGVO) und nach spätestens <P>14</P> Tagen gelöscht.
      </p>

      <h2>3. Cookies und lokale Speicherung</h2>
      <p>
        Wir verwenden ausschließlich technisch notwendige Cookies, um dich angemeldet zu halten (Sitzungs-Cookie). Die gewählte Farbdarstellung (hell/dunkel) wird
        lokal in deinem Browser gespeichert. Es gibt <strong>keine Tracking-, Analyse- oder Werbe-Cookies</strong>; daher ist kein Cookie-Banner erforderlich.
        Schriftarten werden von unserem eigenen Server geladen, nicht von Drittanbietern.
      </p>

      <h2>4. Empfänger und Auftragsverarbeiter</h2>
      <ul>
        <li>Hosting: <P>Name des Hosting-Anbieters, Standort des Rechenzentrums</P></li>
        <li>E-Mail-Versand: <P>Name des E-Mail-Anbieters</P></li>
        <li>Push-Dienste der Browserhersteller (z. B. Google, Mozilla, Apple) – nur bei aktivierten Push-Benachrichtigungen</li>
      </ul>
      <p>Mit allen Auftragsverarbeitern bestehen Verträge nach Art. 28 DSGVO. Eine Übermittlung in Drittländer erfolgt nur auf Grundlage geeigneter Garantien.</p>

      <h2>5. Speicherdauer</h2>
      <ul>
        <li>Kontodaten: bis zur Löschung des Kontos</li>
        <li>Inserate: bis zur Löschung durch dich bzw. mit dem Konto; abgelaufene Inserate bleiben für dich sichtbar, bis du sie löschst</li>
        <li>Nicht zugeordnete Foto-Uploads: 24 Stunden</li>
        <li>Chat-Nachrichten: bis zur Löschung des Kontos eines der Teilnehmer bzw. des zugehörigen Inserats</li>
        <li>Gesetzliche Aufbewahrungspflichten (z. B. §&nbsp;132 BAO) bleiben unberührt</li>
      </ul>

      <h2>6. Deine Rechte</h2>
      <p>
        Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das
        Recht, eine erteilte Einwilligung jederzeit zu widerrufen. Dein Konto inklusive aller Daten kannst du jederzeit selbst unter „Einstellungen → Konto löschen“
        entfernen. Anfragen richte bitte an <P>datenschutz@gebrauchtfelgen24.at</P>.
      </p>
      <p>
        Wenn du der Meinung bist, dass die Verarbeitung deiner Daten gegen das Datenschutzrecht verstößt, kannst du dich bei der Österreichischen
        Datenschutzbehörde (Barichgasse 40–42, 1030 Wien, www.dsb.gv.at) beschweren.
      </p>
    </LegalPage>
  );
}
