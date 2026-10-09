import type { Metadata } from "next";
import { LegalPage, P } from "@/components/legal";

export const metadata: Metadata = { title: "Allgemeine Geschäftsbedingungen" };

export default function TermsPage() {
  return (
    <LegalPage title="Nutzungsbedingungen (AGB)" updated="Oktober 2026" current="/agb">
      <h2>§&nbsp;1 Geltungsbereich und Betreiber</h2>
      <p>
        Diese Bedingungen gelten für die Nutzung der Plattform GebrauchtFelgen24 (gebrauchtfelgen24.at), betrieben von <P>Firmenname GmbH</P>,{" "}
        <P>Anschrift</P> („Betreiber“). Mit der Registrierung akzeptierst du diese Bedingungen.
      </p>

      <h2>§&nbsp;2 Leistungen des Betreibers</h2>
      <p>
        Der Betreiber stellt einen Online-Marktplatz zur Verfügung, auf dem Nutzer Felgen und Kompletträder für Autos und Motorräder anbieten und mit Interessenten
        über einen Chat in Kontakt treten können. Die Nutzung ist für Privatpersonen und Händler derzeit kostenlos. Der Betreiber behält sich vor, künftig
        kostenpflichtige Zusatzleistungen (z. B. hervorgehobene Inserate) anzubieten; diese werden vor Buchung gesondert und transparent ausgewiesen.
      </p>
      <p>
        <strong>Der Betreiber wird nicht Vertragspartei</strong> der zwischen Nutzern geschlossenen Kaufverträge. Abwicklung, Bezahlung, Versand und Gewährleistung
        erfolgen ausschließlich zwischen Käufer und Verkäufer.
      </p>

      <h2>§&nbsp;3 Registrierung und Konto</h2>
      <ul>
        <li>Für das Inserieren und die Nutzung des Chats ist ein Konto mit bestätigter E-Mail-Adresse erforderlich.</li>
        <li>Die Angaben bei der Registrierung müssen wahr sein. Gewerbliche Anbieter müssen sich als „Händler“ registrieren und die gesetzlich vorgeschriebenen Angaben machen.</li>
        <li>Zugangsdaten sind geheim zu halten. Pro Person ist ein Konto zulässig.</li>
      </ul>

      <h2>§&nbsp;4 Inserate</h2>
      <ul>
        <li>Angeboten werden dürfen nur Felgen und Kompletträder (Felge mit Reifen), über die der Anbieter verfügen darf.</li>
        <li>Technische Angaben (Größe, Einpresstiefe, Lochkreis, Mittenloch, Zustand, Profiltiefe, DOT) müssen nach bestem Wissen korrekt sein. Schäden sind anzugeben.</li>
        <li>Fotos müssen den angebotenen Artikel zeigen und dürfen keine Rechte Dritter verletzen.</li>
        <li>Inserate laufen nach <P>60</P> Tagen ab und können kostenlos verlängert werden.</li>
        <li>Unzulässig sind insbesondere: gestohlene Ware, Fälschungen/Replikas ohne entsprechende Kennzeichnung, irreführende Angaben, Kontaktdaten zur Umgehung des Chats im Titel, Werbung für andere Plattformen.</li>
      </ul>

      <h2>§&nbsp;5 Passungsprüfung und Fahrzeugdaten</h2>
      <p>
        Die Prüfung, ob eine Felge zu einem Fahrzeug passt, erfolgt automatisiert anhand der Angaben im Inserat und der Fahrzeugdatenbank. Sie ersetzt nicht die
        Prüfung durch den Käufer anhand der Fahrzeugpapiere, Felgengutachten bzw. ABE und gegebenenfalls einer Eintragung/Typisierung. Für die Richtigkeit wird
        keine Haftung übernommen.
      </p>

      <h2>§&nbsp;6 Pflichten der Nutzer im Chat</h2>
      <p>
        Nachrichten müssen sachlich sein. Belästigung, Spam, Betrugsversuche und das Abfragen von Zahlungs- oder Zugangsdaten sind verboten. Nutzer können andere
        Nutzer blockieren und Inhalte melden.
      </p>

      <h2>§&nbsp;7 Meldungen und Maßnahmen (Digital Services Act)</h2>
      <p>
        Rechtswidrige Inhalte oder Verstöße gegen diese Bedingungen können über die Funktion „Melden“ angezeigt werden. Der Betreiber prüft Meldungen zeitnah und
        kann Inhalte entfernen, Inserate sperren oder Konten vorübergehend bzw. dauerhaft sperren. Betroffene Nutzer werden über Maßnahmen und deren Gründe
        informiert und können dagegen unter <P>dsa@gebrauchtfelgen24.at</P> Beschwerde einlegen.
      </p>

      <h2>§&nbsp;8 Haftung</h2>
      <p>
        Der Betreiber haftet nur für Schäden, die er vorsätzlich oder grob fahrlässig verursacht hat; dies gilt nicht für Personenschäden. Für Inhalte der Nutzer
        sowie für das Zustandekommen und die Erfüllung von Kaufverträgen zwischen Nutzern haftet der Betreiber nicht. Eine ständige Verfügbarkeit der Plattform
        wird nicht garantiert.
      </p>

      <h2>§&nbsp;9 Kündigung</h2>
      <p>
        Nutzer können ihr Konto jederzeit in den Einstellungen löschen. Der Betreiber kann den Nutzungsvertrag mit einer Frist von zwei Wochen, bei schwerwiegenden
        Verstößen fristlos, beenden.
      </p>

      <h2>§&nbsp;10 Änderungen</h2>
      <p>
        Änderungen dieser Bedingungen werden registrierten Nutzern mindestens <P>vier Wochen</P> vor Inkrafttreten per E-Mail mitgeteilt. Widerspricht der Nutzer
        nicht innerhalb dieser Frist, gelten die Änderungen als angenommen; auf diese Folge wird in der Mitteilung hingewiesen.
      </p>

      <h2>§&nbsp;11 Schlussbestimmungen</h2>
      <p>
        Es gilt österreichisches Recht unter Ausschluss des UN-Kaufrechts und der Verweisungsnormen. Für Verbraucher gilt diese Rechtswahl nur, soweit dadurch
        nicht zwingende Bestimmungen des Staates ihres gewöhnlichen Aufenthalts eingeschränkt werden. Gerichtsstand für Unternehmer ist <P>Wien</P>.
      </p>
    </LegalPage>
  );
}
