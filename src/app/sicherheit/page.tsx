import { Banknote, Eye, MessageSquareWarning, PackageCheck, ShieldCheck, UserCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sicher handeln", description: "Tipps für einen sicheren Kauf und Verkauf von gebrauchten Felgen." };

const TIPS = [
  { icon: MessageSquareWarning, t: "Im Chat bleiben", d: "Kommuniziere über den Chat von GebrauchtFelgen24. Sei misstrauisch, wenn jemand sofort auf WhatsApp oder E-Mail wechseln will." },
  { icon: Banknote, t: "Keine Vorkasse an Unbekannte", d: "Am sichersten ist Barzahlung bei Abholung. Bei Versand: nur Zahlungswege mit Käuferschutz nutzen. Gib niemals Kreditkartendaten oder TANs weiter." },
  { icon: Eye, t: "Felgen vor Ort prüfen", d: "Achte auf Risse, Höhen- und Seitenschlag, Schweißstellen und Bordsteinschäden. Kontrolliere die Stempel auf der Felgeninnenseite (Größe, ET, Lochkreis)." },
  { icon: PackageCheck, t: "Papiere mitgeben lassen", d: "Lass dir Gutachten/ABE übergeben und prüfe die Freigabe für dein Fahrzeug, bevor du kaufst." },
  { icon: UserCheck, t: "Fake-Käufer erkennen", d: "Typische Maschen: Überzahlung mit Rückforderung, gefälschte Zahlungsbestätigungen, „Spediteur holt ab“. Im Zweifel: abbrechen und melden." },
  { icon: ShieldCheck, t: "Verdächtiges melden", d: "Über „Melden“ bei Inseraten und im Chat prüft unser Team auffällige Nutzer und Inserate." },
];

export default function SafetyPage() {
  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl font-bold uppercase sm:text-5xl">
        Sicher <span className="text-gradient-brand">handeln</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted">Mit diesen Tipps kaufst und verkaufst du gebrauchte Felgen ohne böse Überraschungen.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TIPS.map((t, i) => (
          <div key={t.t} className="card reveal p-6" style={{ ["--reveal-delay" as string]: `${(i % 3) * 80}ms` }}>
            <t.icon className="h-7 w-7 text-brand" />
            <h2 className="mt-4 font-semibold">{t.t}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
