/**
 * Vorlagen für die Rechtstexte. Sie gelten, bis im Admin-Bereich („Rechtliches“) eine eigene Fassung gespeichert wird.
 * Format siehe src/lib/legal-markdown.ts – [[…]] markiert Stellen, die noch mit Firmendaten ersetzt werden müssen.
 */

const IMPRESSUM = `Informationen gemäß § 5 E-Commerce-Gesetz (ECG), § 14 Unternehmensgesetzbuch (UGB), § 63 Gewerbeordnung (GewO) und Offenlegungspflicht gemäß § 25 Mediengesetz (MedienG).

## Betreiber

[[Firmenname GmbH]]
[[Straße Hausnummer]]
[[PLZ Ort]], Österreich

### Kontakt

E-Mail: [[office@gebrauchtfelgen24.at]]
Telefon: [[+43 …]]

### Unternehmensdaten

- Unternehmensgegenstand: Betrieb eines Online-Marktplatzes für Felgen und Kompletträder
- Firmenbuchnummer: [[FN 123456a]]
- Firmenbuchgericht: [[Handelsgericht Wien / Landesgericht …]]
- UID-Nummer: [[ATU12345678]]
- Geschäftsführung: [[Vorname Nachname]]
- Mitglied der Wirtschaftskammer: [[WKO Bundesland, Fachgruppe …]]
- Gewerbebehörde: [[Magistrat / Bezirkshauptmannschaft …]]
- Anwendbare Rechtsvorschriften: Gewerbeordnung, abrufbar unter [www.ris.bka.gv.at](https://www.ris.bka.gv.at)

## Offenlegung nach § 25 MedienG

Medieninhaber: [[Firmenname GmbH]]. Grundlegende Richtung: Online-Marktplatz zum Kauf und Verkauf gebrauchter Felgen und Kompletträder sowie Informationen rund um Rad-/Reifenkombinationen.

## Kontaktstelle nach dem Digital Services Act (DSA)

Zentrale Kontaktstelle für Behörden und Nutzer (Art. 11 und 12 DSA): [[dsa@gebrauchtfelgen24.at]]. Kommunikation in deutscher und englischer Sprache. Rechtswidrige Inhalte können zudem direkt über die Funktion „Melden“ bei jedem Inserat und Nutzerprofil gemeldet werden.

## Haftung für Inhalte

Inserate werden von Nutzern erstellt. Für deren Richtigkeit, insbesondere technische Angaben zu Felgen, Reifen und Passform, übernimmt der Betreiber keine Gewähr. Die Fahrzeugdatenbank dient der Orientierung; maßgeblich sind Fahrzeugpapiere (Zulassungsbescheinigung/Typenschein, COC) und Felgengutachten.

## Bildnachweise & Daten

Postleitzahl-Koordinaten: GeoNames (geonames.org), lizenziert unter CC BY 4.0.
`;

const DATENSCHUTZ = `Der Schutz deiner Daten ist uns wichtig. Wir verarbeiten personenbezogene Daten ausschließlich auf Grundlage der Datenschutz-Grundverordnung (DSGVO) und des österreichischen Datenschutzgesetzes (DSG). Hier informieren wir dich, welche Daten wir zu welchen Zwecken verarbeiten.

## 1. Verantwortlicher

[[Firmenname GmbH]], [[Straße Hausnummer]], [[PLZ Ort]], Österreich
E-Mail: [[datenschutz@gebrauchtfelgen24.at]]

## 2. Welche Daten wir verarbeiten

### Benutzerkonto

Name, E-Mail-Adresse, Passwort (nur als sicherer Hash gespeichert), Kontotyp (privat/Händler), bei Händlern Firmenname, UID-Nummer, Website und Firmenlogo, optional Telefonnummer und Standort (Postleitzahl). Rechtsgrundlage: Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO).

### Anmeldung mit Google oder Apple

Wenn du dich mit Google oder Apple anmeldest, erhalten wir von diesem Anbieter deinen Namen, deine E-Mail-Adresse und ggf. dein Profilbild. Dabei gelten zusätzlich die Datenschutzbestimmungen von Google Ireland Ltd. bzw. Apple Distribution International Ltd. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.

### Inserate und Fotos

Inhalte deiner Inserate (Beschreibung, technische Daten, Preis, Standort auf PLZ-Ebene) sind öffentlich sichtbar. Hochgeladene Fotos werden beim Upload verkleinert und dabei alle Metadaten (z. B. GPS-Koordinaten, Kameradaten) entfernt.

### Chat-Nachrichten

Nachrichten zwischen Käufern und Verkäufern werden gespeichert, um die Kommunikation zu ermöglichen. Deine E-Mail-Adresse wird dabei nicht an das Gegenüber weitergegeben. Wir lesen Nachrichten nicht mit; eine Einsicht erfolgt nur, wenn eine Nachricht oder Unterhaltung gemeldet wird oder dies zur Missbrauchsbekämpfung erforderlich ist (Art. 6 Abs. 1 lit. f DSGVO). Jede Einsicht durch unser Team wird protokolliert.

### Benachrichtigungen

E-Mail-Benachrichtigungen (neue Nachrichten, Suchaufträge, ablaufende Inserate) kannst du in den Einstellungen jederzeit abschalten. Push-Benachrichtigungen erfolgen nur mit deiner ausdrücklichen Zustimmung im Browser (Art. 6 Abs. 1 lit. a DSGVO); dabei wird eine technische Abo-Adresse deines Browserherstellers gespeichert.

### Server-Logdaten

Beim Aufruf der Seite werden technisch notwendige Daten (IP-Adresse, Zeitpunkt, abgerufene Seite, Browser) zur Sicherstellung des Betriebs und zur Abwehr von Angriffen kurzfristig verarbeitet (Art. 6 Abs. 1 lit. f DSGVO) und nach spätestens [[14]] Tagen gelöscht.

## 3. Cookies und lokale Speicherung

Wir verwenden ausschließlich technisch notwendige Cookies, um dich angemeldet zu halten (Sitzungs-Cookie). Die gewählte Farbdarstellung (hell/dunkel) wird lokal in deinem Browser gespeichert. Es gibt **keine Tracking-, Analyse- oder Werbe-Cookies**; daher ist kein Cookie-Banner erforderlich. Schriftarten werden von unserem eigenen Server geladen, nicht von Drittanbietern.

## 4. Empfänger und Auftragsverarbeiter

- Hosting: [[Name des Hosting-Anbieters, Standort des Rechenzentrums]]
- Netzwerk- und Sicherheitsdienst: [[z. B. Cloudflare, Inc. (Weiterleitung und Schutz der Verbindung)]]
- E-Mail-Versand: [[Name des E-Mail-Anbieters]]
- Push-Dienste der Browserhersteller (z. B. Google, Mozilla, Apple) – nur bei aktivierten Push-Benachrichtigungen

Mit allen Auftragsverarbeitern bestehen Verträge nach Art. 28 DSGVO. Eine Übermittlung in Drittländer erfolgt nur auf Grundlage geeigneter Garantien.

## 5. Speicherdauer

- Kontodaten: bis zur Löschung des Kontos
- Inserate: bis zur Löschung durch dich bzw. mit dem Konto; abgelaufene Inserate bleiben für dich sichtbar, bis du sie löschst
- Nicht zugeordnete Foto-Uploads: 24 Stunden
- Chat-Nachrichten: bis zur Löschung des Kontos eines der Teilnehmer bzw. des zugehörigen Inserats
- Gesetzliche Aufbewahrungspflichten (z. B. § 132 BAO) bleiben unberührt

## 6. Deine Rechte

Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch (Art. 15–21 DSGVO) sowie das Recht, eine erteilte Einwilligung jederzeit zu widerrufen. Dein Konto inklusive aller Daten kannst du jederzeit selbst unter „Einstellungen → Konto löschen“ entfernen. Anfragen richte bitte an [[datenschutz@gebrauchtfelgen24.at]].

Wenn du der Meinung bist, dass die Verarbeitung deiner Daten gegen das Datenschutzrecht verstößt, kannst du dich bei der Österreichischen Datenschutzbehörde (Barichgasse 40–42, 1030 Wien, [www.dsb.gv.at](https://www.dsb.gv.at)) beschweren.
`;

const AGB = `## § 1 Geltungsbereich und Betreiber

Diese Bedingungen gelten für die Nutzung der Plattform GebrauchtFelgen24 (gebrauchtfelgen24.at), betrieben von [[Firmenname GmbH]], [[Anschrift]] („Betreiber“). Mit der Registrierung akzeptierst du diese Bedingungen.

## § 2 Leistungen des Betreibers

Der Betreiber stellt einen Online-Marktplatz zur Verfügung, auf dem Nutzer Felgen und Kompletträder für Autos und Motorräder anbieten und mit Interessenten über einen Chat in Kontakt treten können. Die Nutzung ist für Privatpersonen und Händler derzeit kostenlos. Der Betreiber behält sich vor, künftig kostenpflichtige Zusatzleistungen (z. B. hervorgehobene Inserate) anzubieten; diese werden vor Buchung gesondert und transparent ausgewiesen.

**Der Betreiber wird nicht Vertragspartei** der zwischen Nutzern geschlossenen Kaufverträge. Abwicklung, Bezahlung, Versand und Gewährleistung erfolgen ausschließlich zwischen Käufer und Verkäufer.

## § 3 Registrierung und Konto

- Für das Inserieren und die Nutzung des Chats ist ein Konto mit bestätigter E-Mail-Adresse erforderlich.
- Die Angaben bei der Registrierung müssen wahr sein. Gewerbliche Anbieter müssen sich als „Händler“ registrieren und die gesetzlich vorgeschriebenen Angaben machen.
- Zugangsdaten sind geheim zu halten. Pro Person ist ein Konto zulässig.

## § 4 Inserate

- Angeboten werden dürfen nur Felgen und Kompletträder (Felge mit Reifen), über die der Anbieter verfügen darf.
- Technische Angaben (Größe, Einpresstiefe, Lochkreis, Mittenloch, Zustand, Profiltiefe, DOT) müssen nach bestem Wissen korrekt sein. Schäden sind anzugeben.
- Fotos müssen den angebotenen Artikel zeigen und dürfen keine Rechte Dritter verletzen.
- Inserate laufen nach [[60]] Tagen ab und können kostenlos verlängert werden.
- Unzulässig sind insbesondere: gestohlene Ware, Fälschungen/Replikas ohne entsprechende Kennzeichnung, irreführende Angaben, Kontaktdaten zur Umgehung des Chats im Titel, Werbung für andere Plattformen.

## § 5 Passungsprüfung und Fahrzeugdaten

Die Prüfung, ob eine Felge zu einem Fahrzeug passt, erfolgt automatisiert anhand der Angaben im Inserat und der Fahrzeugdatenbank. Sie ersetzt nicht die Prüfung durch den Käufer anhand der Fahrzeugpapiere, Felgengutachten bzw. ABE und gegebenenfalls einer Eintragung/Typisierung. Für die Richtigkeit wird keine Haftung übernommen.

## § 6 Pflichten der Nutzer im Chat

Nachrichten müssen sachlich sein. Belästigung, Spam, Betrugsversuche und das Abfragen von Zahlungs- oder Zugangsdaten sind verboten. Nutzer können andere Nutzer blockieren und Inhalte melden.

## § 7 Meldungen und Maßnahmen (Digital Services Act)

Rechtswidrige Inhalte oder Verstöße gegen diese Bedingungen können über die Funktion „Melden“ angezeigt werden. Der Betreiber prüft Meldungen zeitnah und kann Inhalte entfernen, Inserate sperren oder Konten vorübergehend bzw. dauerhaft sperren. Betroffene Nutzer werden über Maßnahmen und deren Gründe informiert und können dagegen unter [[dsa@gebrauchtfelgen24.at]] Beschwerde einlegen.

## § 8 Haftung

Der Betreiber haftet nur für Schäden, die er vorsätzlich oder grob fahrlässig verursacht hat; dies gilt nicht für Personenschäden. Für Inhalte der Nutzer sowie für das Zustandekommen und die Erfüllung von Kaufverträgen zwischen Nutzern haftet der Betreiber nicht. Eine ständige Verfügbarkeit der Plattform wird nicht garantiert.

## § 9 Kündigung

Nutzer können ihr Konto jederzeit in den Einstellungen löschen. Der Betreiber kann den Nutzungsvertrag mit einer Frist von zwei Wochen, bei schwerwiegenden Verstößen fristlos, beenden.

## § 10 Änderungen

Änderungen dieser Bedingungen werden registrierten Nutzern mindestens [[vier Wochen]] vor Inkrafttreten per E-Mail mitgeteilt. Widerspricht der Nutzer nicht innerhalb dieser Frist, gelten die Änderungen als angenommen; auf diese Folge wird in der Mitteilung hingewiesen.

## § 11 Schlussbestimmungen

Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts und der Verweisungsnormen. Für Verbraucher gilt diese Rechtswahl nur, soweit dadurch nicht zwingende Bestimmungen des Staates ihres gewöhnlichen Aufenthalts eingeschränkt werden. Gerichtsstand für Unternehmer ist [[Wien]].
`;

export const LEGAL_DEFAULTS = { impressum: IMPRESSUM, datenschutz: DATENSCHUTZ, agb: AGB } as const;
