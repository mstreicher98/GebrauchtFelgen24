# GebrauchtFelgen24

Marktplatz für gebrauchte **Felgen und Kompletträder** für Auto und Motorrad in Österreich, Deutschland und der Schweiz – mit
Passungsprüfung („Welche Felgen passen auf mein Fahrzeug?“), Echtzeit-Chat zwischen Käufer und Verkäufer und
einer Fahrzeugdatenbank mit Lochkreis, Mittenloch, Einpresstiefe und Rad-/Reifengrößen.

Domain: **gebrauchtfelgen24.at** · Betrieb als **Portainer-Stack** (Docker Compose)

---

## Funktionen

| Bereich | Umfang |
| --- | --- |
| **Konto** | Registrierung mit E-Mail-Bestätigung, Login mit E-Mail/Passwort, Google und Apple (optional), Passwort vergessen, Privat- oder Händlerkonto (Firmenname, UID, Website), Konto löschen (DSGVO) |
| **Inserate** | Felgen & Kompletträder, bis zu 12 Fotos (werden im Browser verkleinert, auf dem Server in 3 Größen als WebP gespeichert, GPS/EXIF entfernt), alle Pflichtfelder (Material, Marke, Zoll, Breite, Lochkreis, ET, Mittenloch, Anzahl, Zustand, Reifengröße, -marke, Saison, Profiltiefe, DOT, RDKS, Preis, Festpreis/VB, Versand/Abholung, PLZ), „Passend für“-Fahrzeuge, automatischer Titelvorschlag, Laufzeit 60 Tage mit Erinnerung & Verlängerung, verkauft/deaktiviert |
| **Suche** | Volltext, Zoll, Breite, Lochkreis, ET, Preis, Zustand, Material, Saison, Händler/Privat, **Umkreissuche** (44.000 PLZ in AT/DE/CH), Sortierung inkl. Entfernung |
| **Fahrzeugsuche** | Marke → Modell → Baureihe oder **HSN/TSN**; Modus „Nur passende“ (streng) oder „Auch eventuell passende“ (locker); jedes Inserat bekommt ein Badge *Passt perfekt / Passt / Passt mit Zentrierring / Eventuell passend* mit Hinweisen |
| **Chat** | wie bei willhaben: Echtzeit (Server-Sent Events über PostgreSQL LISTEN/NOTIFY), Bilder senden, Lesebestätigung, Ungelesen-Zähler, Archivieren, Blockieren, Melden. E-Mail-Adresse und Telefonnummer bleiben privat (Telefon optional pro Inserat freigebbar) |
| **Benachrichtigungen** | E-Mail und Web-Push (PWA) bei neuen Nachrichten (max. 1 Mail / 15 Min. pro Chat), **Suchaufträge** mit Benachrichtigung bei neuen Treffern, Ablauferinnerung – alles in den Einstellungen abschaltbar |
| **Merkliste** | Herz auf jeder Karte, Übersicht im Konto |
| **Admin** | Dashboard, Meldungen bearbeiten, Inserate sperren / als **TOP** hervorheben, Nutzer sperren / Admin-Rechte, Fahrzeugdatenbank bearbeiten, HSN/TSN-CSV-Import |
| **Design** | Sportlich/dunkel + Premium (Schwarz/Anthrazit, Gold, Rot), Hell/Dunkel automatisch nach System (umschaltbar), animierte Felge im Hero, sanfte Scroll-Einblendungen, Felgen-Ladeanimation, Respektiert „Bewegung reduzieren“ |
| **Performance** | Server-Rendering, kaum Client-JS, selbst gehostete Schriften, WebP in passenden Größen, PWA mit Offline-Seite. Lighthouse (Mobil): Performance 88–99, Best Practices 100, SEO 100, CLS 0 |
| **Rechtliches** | Vorlagen für Impressum (ECG/UGB/MedienG + DSA-Kontaktstelle), Datenschutzerklärung (DSGVO), AGB – Platzhalter sind gelb markiert |

## Technik

- **Next.js 16** (App Router, React 19, Server Actions, Turbopack), **TypeScript**, **Tailwind CSS 4**
- **PostgreSQL 16** mit **Drizzle ORM** (Migrationen laufen beim Start automatisch)
- **better-auth** (E-Mail/Passwort, Google, Apple, E-Mail-Verifizierung)
- **sharp** (Bildverarbeitung), **nodemailer** (SMTP), **web-push** (VAPID)
- Docker-Image (Next.js standalone, ~440 MB), GitHub Actions baut nach `ghcr.io`

```
src/app/            Seiten & API-Routen (deutsche URLs: /suche, /inserat/neu, /nachrichten, /konto …)
src/components/     UI-Komponenten
src/lib/            Fachlogik (Passungsprüfung, Suche, Auth, Bilder, Echtzeit, Push …)
src/server/         Start-Routine (Migration, Daten-Import, Hintergrundjobs)
src/db/schema.ts    Datenbankschema
data/vehicles/      Fahrzeugdatenbank (Start-Datensatz) + fahrzeugliste.csv
data/plz.tsv        Postleitzahlen mit Koordinaten (GeoNames, CC BY 4.0)
drizzle/            SQL-Migrationen
```

---

## Installation mit Portainer

### 1. Image bauen lassen

Bei jedem Push baut GitHub Actions (`.github/workflows/docker.yml`) das Image:

- `ghcr.io/mstreicher98/gebrauchtfelgen24:latest` – Branch `main`
- `ghcr.io/mstreicher98/gebrauchtfelgen24:<branch-name>` – andere Branches (z. B. zum Testen)

Ist das Repository privat, ist auch das Image privat. Dann in Portainer unter **Registries → Add registry → Custom registry**
eintragen: URL `ghcr.io`, Benutzer = GitHub-Name, Passwort = GitHub *Personal Access Token* mit Recht `read:packages`.

### 2. Stack anlegen

Portainer → **Stacks → Add stack**:

- **Repository**: dieses Git-Repository, Compose-Pfad `docker-compose.yml` (optional „Automatic updates“ aktivieren), **oder**
- **Web editor**: Inhalt von `docker-compose.yml` hineinkopieren.

Unter **Environment variables** mindestens setzen (Vorlage: `.env.example`):

| Variable | Beispiel / Hinweis |
| --- | --- |
| `APP_URL` | `https://gebrauchtfelgen24.at` |
| `POSTGRES_PASSWORD` | langes Zufallspasswort |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `ADMIN_EMAIL` | E-Mail, die automatisch Admin wird |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | E-Mail-Versand (ohne SMTP werden Mails nur ins Log geschrieben) |
| `APP_PORT` | Port auf dem Server, Standard `3000` |
| `IMAGE_TAG` | Standard `latest` |
| `SEED_DEMO` | `true` legt Testnutzer + 20 Demo-Inserate an – **in Produktion `false`** |

Optional: `GOOGLE_CLIENT_ID/SECRET`, `APPLE_CLIENT_ID/SECRET`, `VAPID_*` (werden sonst automatisch erzeugt).

Der Stack startet drei Container: **app**, **db** (PostgreSQL 16) und **backup** (tägliche Datenbank-Sicherung, 7 Tage / 4 Wochen / 6 Monate).
Beim ersten Start werden automatisch die Tabellen angelegt sowie Fahrzeugdatenbank und Postleitzahlen importiert.

### 3. Reverse Proxy & HTTPS

Die App lauscht auf Port `3000`. Davor gehört ein Reverse Proxy mit SSL, z. B. **Nginx Proxy Manager**:

- Proxy Host `gebrauchtfelgen24.at` (+ `www`) → `http://<server-ip>:3000`, SSL mit Let's Encrypt, „Force SSL“
- Unter *Advanced* eintragen (für Foto-Uploads und den Echtzeit-Chat):

  ```nginx
  client_max_body_size 20m;
  proxy_buffering off;
  proxy_read_timeout 1h;
  ```

Für **Traefik** sind Labels in `docker-compose.yml` vorbereitet (auskommentiert).
DNS: A-Record (und ggf. AAAA) von `gebrauchtfelgen24.at` und `www` auf den Server.

### 4. Erster Login

Auf der Seite mit der unter `ADMIN_EMAIL` eingetragenen Adresse registrieren → E-Mail bestätigen → im Menü erscheint **Admin-Bereich**.

### Updates

Neues Image wird bei jedem Push gebaut. In Portainer: Stack → **Pull and redeploy** (bzw. automatisch bei „Automatic updates“).
Datenbank-Migrationen laufen beim Start automatisch.

### Backup & Wiederherstellung

- Datenbank-Dumps liegen im Volume `gebrauchtfelgen24_backups`.
- Fotos liegen im Volume `gebrauchtfelgen24_uploads` – dieses Volume bitte zusätzlich sichern (z. B. per Hosting-Backup).
- Wiederherstellen (in eine **leere** Datenbank, z. B. nach Neuanlage des `pgdata`-Volumes; App-Container vorher stoppen):

  ```bash
  docker exec gebrauchtfelgen24-backup-1 sh -c 'gunzip -c /backups/last/felgen-latest.sql.gz' \
    | docker exec -i gebrauchtfelgen24-db-1 psql -U felgen -d felgen
  ```

---

## Login mit Google / Apple einrichten

**Google**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth-Client-ID (Webanwendung) →
autorisierte Weiterleitungs-URI `https://gebrauchtfelgen24.at/api/auth/callback/google` → `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` setzen.

**Apple**: Apple Developer Account → *Services ID* mit „Sign in with Apple“, Domain `gebrauchtfelgen24.at`,
Return-URL `https://gebrauchtfelgen24.at/api/auth/callback/apple`. Das Client-Secret ist ein signiertes JWT (max. 6 Monate gültig)
→ `APPLE_CLIENT_ID` (Services ID) / `APPLE_CLIENT_SECRET`.

Die Buttons erscheinen automatisch, sobald die Variablen gesetzt sind.

---

## Fahrzeugdatenbank

- Start-Datensatz in `data/vehicles/cars.ts` und `motorcycles.ts`: **276 Baureihen von 45 Marken (33 Auto, 12 Motorrad) mit 820 Rad-/Reifenkombinationen**.
- Als Tabelle (Excel): `data/vehicles/fahrzeugliste.csv` – neu erzeugen mit `npm run export:fahrzeuge`.
- Auf der Website: `/fahrzeuge` (Übersicht) und `/fahrzeuge/auto/<marke>` mit allen Werten und Link „Passende Felgen“.
- Pflege im Admin-Bereich (Marken, Modelle, Baureihen, Radgrößen im Format `7.5Jx18 ET51 225/40 R18`).
- **Wichtig:** Die Werte sind sorgfältig zusammengestellt, aber ohne Gewähr. Vor dem Livegang stichprobenartig prüfen.
- **HSN/TSN**: Die Zuordnung Schlüsselnummer → Baureihe ist leer und wird per CSV im Admin-Bereich importiert (`HSN;TSN;Baureihen-ID;Beschreibung`).
  Eine vollständige Liste ist lizenzpflichtig (z. B. KBA-Daten oder kommerzielle Anbieter).
- Die Datenstruktur ist so angelegt, dass später eine kommerzielle Datenbank-API (z. B. Wheel-Size) angebunden werden kann.

### So funktioniert die Passungsprüfung

| Prüfung | „Nur passende“ (streng) | „Auch eventuell passende“ (locker) |
| --- | --- | --- |
| Lochkreis | muss exakt passen | muss exakt passen |
| Mittenloch | ≥ Nabe (größer → Zentrierring-Hinweis) | ≥ Nabe oder unbekannt |
| Zoll | innerhalb der Seriengrößen | ± 1 Zoll |
| Breite | Serie ± 0,5 J | zusätzlich ± 0,5 J |
| Einpresstiefe | innerhalb des ET-Bereichs | ± 7 mm oder unbekannt |
| Motorrad | Verkäufer hat das Modell angegeben | auch gleiche Felgengröße an derselben Achse |

Logik: `src/lib/fitment.ts` (Badges) und `src/lib/search.ts` (SQL-Filter) – mit Unit-Tests in `tests/`.

---

## Entwicklung

Voraussetzungen: Node.js 22, PostgreSQL 16 (oder `docker compose`).

```bash
cp .env.example .env          # DATABASE_URL, BETTER_AUTH_SECRET, SEED_DEMO=true …
npm install
npm run dev                    # http://localhost:3000 – Migration & Import laufen automatisch
```

Demo-Login (nur mit `SEED_DEMO=true`): `demo@gebrauchtfelgen24.at` / `Demo1234!` (privat), `haendler@gebrauchtfelgen24.at` / `Demo1234!` (Händler).
Ohne SMTP stehen Bestätigungslinks im Server-Log (`[mail] Link: …`).

| Befehl | Zweck |
| --- | --- |
| `npm run lint` / `npm run typecheck` / `npm test` | Qualitätsprüfungen (laufen auch in GitHub Actions) |
| `npm run db:generate` | neue Migration nach Änderung an `src/db/schema.ts` |
| `npm run export:fahrzeuge` | Fahrzeugliste als CSV exportieren |
| `docker compose -f docker-compose.yml -f docker-compose.local.yml --env-file .env up --build` | kompletten Stack lokal bauen & starten |

---

## Noch offen / nächste Schritte

- **Firmendaten** in Impressum, Datenschutz und AGB eintragen (gelb markierte Platzhalter) und rechtlich prüfen lassen.
- **Telefonnummer-Verifizierung** (SMS) – vorgesehen (`phone_verified` existiert bereits), Umsetzung später.
- **Bezahlte TOP-Inserate** – technisch vorbereitet (`featured_until`, Admin kann TOP setzen), Zahlungsanbieter folgt.
- **Bewertungen** nach dem Kauf – bei Bedarf als nächster Ausbauschritt.
- **Logo**: Aktuell ein SVG-Logo (Felge + Schriftzug); `public/icons/icon.svg` bzw. `src/components/logo.tsx` bei einem finalen Logo ersetzen.

Schriften: Inter & Oswald (SIL Open Font License). Postleitzahlen: © GeoNames, CC BY 4.0.
