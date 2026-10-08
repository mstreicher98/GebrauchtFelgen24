# Fahrzeugdatenbank (Start-Datensatz)

Die Dateien `cars.ts` und `motorcycles.ts` enthalten einen gepflegten Start-Datensatz
mit gängigen Fahrzeugen im DACH-Raum. Beim ersten Start der App wird er in die
Datenbank importiert (nur wenn die Fahrzeugtabellen leer sind). Danach wird die
Fahrzeugdatenbank im Admin-Bereich gepflegt.

**Wichtig:** Die Werte wurden sorgfältig zusammengestellt, sind aber ohne Gewähr.
Vor dem Livegang sollten sie stichprobenartig geprüft werden. Maßgeblich sind immer
Fahrzeugschein/COC und Felgengutachten.

## Format

```ts
gen("Golf VII (5G)", 2012, 2020, "5x112", 57.1, "M14x1,5 Schraube", [35, 50], [
  "6Jx15 ET43 195/65 R15",
  "7.5Jx18 ET51 225/40 R18",
])
```

- Lochkreis (`5x112`), Mittenloch (mm), Gewinde/Befestigung, zulässiger ET-Bereich `[min, max]`
- Radgrößen: `<Breite>Jx<Zoll> ET<Einpresstiefe> <Reifengröße>`
- Motorräder: `V 3.50x17 120/70 ZR17` (vorne) bzw. `H 5.50x17 180/55 ZR17` (hinten)

Breiten- und Zoll-Bereich für die Passungsprüfung werden automatisch aus den
Radgrößen abgeleitet (Zoll: min–max, Breite: min − 0,5 J bis max + 0,5 J).
