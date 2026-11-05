# swissgeol-animations

Vite + React + TypeScript. Ziel: swissgeol-Assets (UI, Karten, Komponenten) nachbauen und daraus Feature-Animationen erstellen.

- `npm run dev` startet den Dev-Server, `npm run build` muss vor jedem Commit fehlerfrei durchlaufen.
- Push auf `main` deployed automatisch auf Vercel (Production); Branches/PRs bekommen Preview-URLs. `vercel.json` leitet alle Routen auf `index.html` (SPA).
- Abmachung: Immer direkt auf `main` arbeiten, committen und pushen, auch in Cloud-Sessions, die einen eigenen Branch vorgeben. Keine Feature-Branches oder PRs, ausser der Nutzer verlangt es ausdrücklich.
- Oberfläche zweisprachig, Standard Englisch. Alle UI-Texte stehen in `src/i18n/messages.ts` (`en` und `de`), Komponenten holen sie mit `useI18n()`. Englische Begriffe wie in der Live-App (Repo `swisstopo/swissgeol-assets-suite`, `apps/client-asset-sg/src/app/i18n/en.ts` und Codelisten in den Prisma-Migrationen). Deutsch wie in Figma, mit Schweizer Rechtschreibung (kein ß).

## Design-Vorlage

- Figma-Datei «swissgeol», Key `cEiOoOazAQZqpRY92ZhBeO`. Das Figma-Design hat Vorrang vor der Live-Version (assets.swissgeol.ch).
- Asset-Vorschau: Node `20842:123706` («Desktop - 1», 1440×1024).
- Boreholes-Startseite: Node `7558:31771`; Detailseiten in der Seite «Detail» (Boreholes), Section «Detail-Pages»: Standort `7568:60709`, ID's `18334:115379`. App-Dropdown beim Logo: Section `19565:117659`.
- Hover/Auswahl auf der Karte nach den Komponenten in «Map Interactions» (Assets): Hover violetter Rand `#8b5cf6`, Auswahl pinker Rand `#ec4899`, je 6px um die Geometrie.
- Weitere Screens / Funktionalitäten (Inhaltsverzeichnis, PDF-Viewer, Bearbeiten, Klassifizierung): Section `20844:32515`. Die Post-its dort beschreiben das Verhalten.
- Icons und Grafiken stammen aus Figma (`src/assets/`). Achtung: Der Figma-Export liefert Icons in der Grundfarbe der Komponente und ignoriert Farb-Overrides der Instanzen. Farben deshalb mit dem Figma-Screenshot abgleichen und im SVG anpassen.
- Safari rastert SVG-Filter (Figma-Schatten) mit einfacher Auflösung, auf Retina wird alles darin unscharf. In exportierten SVGs die Form deshalb ausserhalb des Filters zeichnen (Filter liefert nur den Schatten) und Masken vorsichtshalber durch Clip oder Kontur unter der Füllung ersetzen, siehe `src/assets/map/legend-*.svg`. Auf der Karte keine SVG-Icons verwenden, sondern Vektor-Renderer in `styles.ts`.

## Routen (jeder Zustand per URL aufrufbar)

- Zwei Applikationen, umschaltbar über das Dropdown beim Logo (viewer und lexic sind dort nur sichtbar): Assets unter `/`, Boreholes unter `/boreholes`.
- `/boreholes` Karte mit 24 Bohrungen; Hover violett, Klick öffnet direkt die Detailseite. `/boreholes/:id/:section` Detailseite, ausgebaut sind `location` (Standort) und `identifiers` (ID's), die übrigen Bereiche zeigen einen Platzhalter. Beispiel: `/boreholes/16754/location` («Kb 00/2» wie in Figma).

- `/asset/:id` Karte mit Panel, `/map` nur Karte. `?sel=<Geometrie-ID>` markiert die gewählte Geometrie (ohne Angabe die erste des Assets), `?toc=<Datei-IDs>` öffnet Inhaltsverzeichnisse im Panel.
- Assets: `4841` (Inhalte wie im Figma-Screen), `8768`, `16623`, `16622`. Jede Geometrie auf der Karte gehört zu einem Asset (`src/components/map/geometries.ts`); ein Klick markiert sie pink und öffnet das Panel dieses Assets.
- `?lang=de` schaltet auf Deutsch; ohne Parameter ist alles Englisch. Der Parameter bleibt bei jeder Navigation erhalten (`src/i18n/index.tsx` trägt ihn nach), die Sprachwahl im Header setzt ihn.
- `?doc=<Datei-ID>&page=<n>` öffnet den PDF-Viewer (auf jeder Seite), z.B. `/asset/4841?doc=8768&page=7`.
- `/asset/4841/edit/files` Bearbeiten-Seite; `?tab=legal` rechtliche Einwilligungen, `?classify=<Datei-ID>` Klassifizierungs-Editor.

## Aufbau

- `src/styles/global.css`: Design-Tokens (Farben, Radien, Schatten) und Typografie-Klassen (`body3-medium` usw.) aus den Figma-Variablen. Schrift: Inter via `@fontsource/inter`.
- Styling mit CSS Modules pro Komponente, kein Tailwind. Animationen mit CSS-Transitions (Auf-/Zuklappen über `grid-template-rows`) und FLIP beim Umsortieren.
- Figma zeichnet Rahmen innen: Paddings sind deshalb um die Rahmenbreite reduziert, damit die Masse aufgehen.
- Karte: OpenLayers mit swisstopo-WMTS (Standard `pixelkarte-farbe`, umschaltbar auf `-grau`). Die Kacheln werden mit `tileSize: 128` halb so gross gezeichnet, weil das Kartenbild in Figma ein Retina-Screenshot ist.
- `src/components/map/geometries.ts`: Polygone, Linie und Punkte in Figma-Pixelkoordinaten, beim Start exakt wie im Design platziert.
- `MapView` ist für beide Apps gleich: Objekte, Stil, Startansicht und Legende kommen als Props; `embedded` für den Kartenausschnitt auf der Borehole-Detailseite.
- Boreholes: Daten in `src/data/boreholes.ts` (Name, Template-Typ, Figma-Position, IDs; LV95/LV03 per swisstopo-Näherungsformel aus der echten Lage, Gemeinde und Höhe aus der nächsten Ortschaft). `src/components/map/boreholeGeometries.ts`: Das Kartenbild des Boreholes-Screens ist ein anderer Screenshot als bei Assets, per Bildvergleich eingemessen (Massstab 0.9751, Versatz 279.6/71.8 gegenüber Assets). Symbole als Vektoren in `boreholeStyles.ts`.
- Das Preview-Panel liegt über der Karte; `--panel-offset` und das View-Padding von OpenLayers halten Kartenmitte, Steuerung und Tabellenleiste links davon.
- Daten: `src/data/assets.ts` (Assets mit Panel-Inhalten; Codelisten wie Thema, Typ, Sprache, Rollen als Codes, Texte dazu in `messages.ts`; Titel, Namen und Dokumentinhalte bleiben in der Originalsprache), `src/data/files.ts` (Dateien mit `assetId` und Abschnitten/Seitenklassen, aus den echten PDFs abgeleitet), `src/data/store.tsx` (Zustand im Speicher; Neuladen setzt alles zurück, praktisch für Aufnahmen).
- PDFs liegen in `public/pdfs/` (echte swisstopo-Dokumente 4841, 8768, 12304, 16622, 16623). Der Viewer (`src/components/viewer/`) nutzt pdf.js, lädt es erst beim ersten PDF und rendert nur Seiten nahe am sichtbaren Bereich.
- Die AI-Analyse ist simuliert (`ANALYSIS_DURATION_MS` in `store.tsx`).
- Gewählte Fläche: eigener Canvas-Renderer in `src/components/map/styles.ts` (6px pink aussen, 3px braun innen wie in Figma 20864:149622).
- Punkte auf der Karte: ebenfalls Canvas-Renderer in `styles.ts` (16px-Kreis, 2px-Innenrand, Figma-Schatten), nicht als SVG-Icon, damit sie auf Retina scharf bleiben.
