import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Felgen-Ratgeber: Lochkreis, Einpresstiefe, Mittenloch erklärt",
  description: "Was bedeuten 8Jx18 ET45 5x112? Lochkreis, Einpresstiefe, Mittenloch, Zentrierringe, Gutachten und DOT einfach erklärt.",
};

const TOPICS = [
  {
    id: "groesse",
    t: "Felgengröße: 8Jx18",
    d: (
      <>
        <p>
          Die erste Zahl ist die <strong>Maulweite (Breite)</strong> in Zoll – hier 8 Zoll. Das „J“ beschreibt die Form des Felgenhorns (bei Pkw fast immer J).
          Die Zahl nach dem „x“ ist der <strong>Durchmesser</strong> in Zoll – hier 18 Zoll.
        </p>
        <p>Bei Motorrädern wird die Größe oft als „MT5.50x17“ oder „5.50x17“ angegeben.</p>
      </>
    ),
  },
  {
    id: "lochkreis",
    t: "Lochkreis (LK): 5x112",
    d: (
      <p>
        Anzahl der Radschrauben × Durchmesser des Kreises, auf dem die Schraubenlöcher liegen (in mm). 5x112 bedeutet 5 Schrauben auf einem Kreis von 112 mm.
        <strong> Der Lochkreis muss exakt passen</strong> – Lochkreisadapter sind nur mit Gutachten zulässig.
      </p>
    ),
  },
  {
    id: "et",
    t: "Einpresstiefe (ET)",
    d: (
      <p>
        Abstand in mm zwischen Felgenmitte und Anlagefläche an der Nabe. Je <strong>kleiner</strong> die ET, desto <strong>weiter außen</strong> steht das Rad.
        Weicht die ET stark von der Serie ab, kann das Rad am Kotflügel oder Federbein schleifen und eine Eintragung nötig werden.
      </p>
    ),
  },
  {
    id: "mittenloch",
    t: "Mittenloch (ML) & Zentrierringe",
    d: (
      <p>
        Durchmesser der Bohrung in der Felgenmitte. Ist das Mittenloch der Felge <strong>größer</strong> als die Radnabe (z. B. 72,6 mm Felge auf 57,1 mm
        Nabe), werden Zentrierringe benötigt. Ist es <strong>kleiner</strong>, passt die Felge nicht.
      </p>
    ),
  },
  {
    id: "gutachten",
    t: "Gutachten, ABE & Eintragung",
    d: (
      <p>
        Zubehörfelgen benötigen ein Teilegutachten oder eine ABE für dein Fahrzeug. In Österreich müssen nicht im Typenschein/COC enthaltene Rad-Reifen-Kombinationen
        in der Regel bei der Landesprüfstelle eingetragen werden, in Deutschland erfolgt die Abnahme z. B. beim TÜV oder der DEKRA. Originalfelgen anderer
        Baureihen sind ebenfalls nicht automatisch zulässig – prüfe die Freigaben im COC-Papier.
      </p>
    ),
  },
  {
    id: "reifen",
    t: "Reifen: 225/45 R18 95Y & DOT",
    d: (
      <>
        <p>225 = Reifenbreite in mm, 45 = Querschnitt in % der Breite, R = Radialbauweise, 18 = Felgendurchmesser, 95 = Lastindex, Y = Geschwindigkeitsindex.</p>
        <p>
          Die <strong>DOT-Nummer</strong> (z. B. 2321) zeigt das Produktionsdatum: Kalenderwoche 23 im Jahr 2021. Reifen über 6–8 Jahre sollten unabhängig vom
          Profil kritisch geprüft werden.
        </p>
        <p>
          <strong>Profiltiefe:</strong> Gesetzliches Minimum sind 1,6 mm. In Österreich gelten Winterreifen nur mit mindestens 4 mm (Radialreifen) als
          Winterreifen. Empfehlung: Sommer ≥ 3 mm, Winter ≥ 4 mm.
        </p>
      </>
    ),
  },
  {
    id: "rdks",
    t: "RDKS-Sensoren",
    d: (
      <p>
        Seit November 2014 müssen neu zugelassene Pkw in der EU ein Reifendruckkontrollsystem haben. Bei direkten Systemen sitzen Sensoren im Ventil. Achte beim Kauf
        von Kompletträdern darauf, ob passende Sensoren verbaut sind – sonst meldet das Fahrzeug einen Fehler.
      </p>
    ),
  },
];

export default function GuidePage() {
  return (
    <div className="container-page py-12">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Felgen-Ratgeber</p>
        <h1 className="font-display mt-2 text-4xl font-bold uppercase sm:text-5xl">8Jx18 ET45 5x112 – was heißt das?</h1>
        <p className="mt-3 text-muted">Die wichtigsten Begriffe rund um Felgen und Reifen – kurz und verständlich erklärt.</p>
      </div>
      <nav aria-label="Themen" className="scrollbar-none mt-8 flex gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] sm:flex-wrap sm:overflow-visible sm:[mask-image:none]">
        {TOPICS.map((t) => (
          <a key={t.id} href={`#${t.id}`} className="chip shrink-0">
            {t.t.split(":")[0]}
          </a>
        ))}
      </nav>
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {TOPICS.map((t, i) => (
          <section key={t.id} id={t.id} className={clsx("card reveal scroll-mt-24 p-6", i === TOPICS.length - 1 && TOPICS.length % 2 === 1 && "lg:col-span-2")} style={{ ["--reveal-delay" as string]: `${(i % 2) * 80}ms` }}>
            <h2 className="font-display text-xl uppercase tracking-wide text-brand">{t.t}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted [&_strong]:text-fg">{t.d}</div>
          </section>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Link href="/fahrzeuge" className="btn btn-brand group h-auto whitespace-normal py-3 text-center">
          Werte für mein Fahrzeug nachschlagen <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
