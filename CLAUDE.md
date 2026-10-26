# swissgeol-animations

Vite + React + TypeScript. Ziel: swissgeol-Assets (UI, Karten, Komponenten) nachbauen und daraus Feature-Animationen erstellen.

- `npm run dev` startet den Dev-Server, `npm run build` muss vor jedem Commit fehlerfrei durchlaufen.
- Push auf `main` deployed automatisch auf Vercel (Production); Branches/PRs bekommen Preview-URLs. `vercel.json` leitet alle Routen auf `index.html` (SPA).
- UI-Texte auf Deutsch mit Schweizer Rechtschreibung (kein ß).

## Design-Vorlage

- Figma-Datei «swissgeol», Key `cEiOoOazAQZqpRY92ZhBeO`. Das Figma-Design hat Vorrang vor der Live-Version (assets.swissgeol.ch).
- Asset-Vorschau: Node `20842:123706` («Desktop - 1», 1440×1024).
- Weitere Screens / Funktionalitäten (Inhaltsverzeichnis, PDF-Viewer, Bearbeiten, Klassifizierung): Section `20844:32515`. Die Post-its dort beschreiben das Verhalten.
- Icons und Grafiken stammen aus Figma (`src/assets/`). Achtung: Der Figma-Export liefert Icons in der Grundfarbe der Komponente und ignoriert Farb-Overrides der Instanzen. Farben deshalb mit dem Figma-Screenshot abgleichen und im SVG anpassen.

## Routen (jeder Zustand per URL aufrufbar)

- `/asset/4841` Karte mit Panel, `/map` nur Karte. `?toc=<Datei-IDs>` öffnet Inhaltsverzeichnisse im Panel.
- `?doc=<Datei-ID>&page=<n>` öffnet den PDF-Viewer (auf jeder Seite), z.B. `/asset/4841?doc=8768&page=7`.
- `/asset/4841/edit/files` Bearbeiten-Seite; `?tab=legal` rechtliche Einwilligungen, `?classify=<Datei-ID>` Klassifizierungs-Editor.

## Aufbau

- `src/styles/global.css`: Design-Tokens (Farben, Radien, Schatten) und Typografie-Klassen (`body3-medium` usw.) aus den Figma-Variablen. Schrift: Inter via `@fontsource/inter`.
- Styling mit CSS Modules pro Komponente, kein Tailwind. Animationen mit CSS-Transitions (Auf-/Zuklappen über `grid-template-rows`) und FLIP beim Umsortieren.
- Figma zeichnet Rahmen innen: Paddings sind deshalb um die Rahmenbreite reduziert, damit die Masse aufgehen.
- Karte: OpenLayers mit swisstopo-WMTS (`pixelkarte-grau`, umschaltbar auf `-farbe`). Die Kacheln werden mit `tileSize: 128` halb so gross gezeichnet, weil das Kartenbild in Figma ein Retina-Screenshot ist.
- `src/components/map/geometries.ts`: Polygone, Linie und Punkte in Figma-Pixelkoordinaten, beim Start exakt wie im Design platziert.
- Das Preview-Panel liegt über der Karte; `--panel-offset` und das View-Padding von OpenLayers halten Kartenmitte, Steuerung und Tabellenleiste links davon.
- Daten: `src/data/asset.ts` (Panel-Inhalte), `src/data/files.ts` (Dateien mit Abschnitten/Seitenklassen, aus den echten PDFs abgeleitet), `src/data/store.tsx` (Zustand im Speicher; Neuladen setzt alles zurück, praktisch für Aufnahmen).
- PDFs liegen in `public/pdfs/` (echte swisstopo-Dokumente 4841, 8768, 12304, 16623). Der Viewer (`src/components/viewer/`) nutzt pdf.js, lädt es erst beim ersten PDF und rendert nur Seiten nahe am sichtbaren Bereich.
- Die AI-Analyse ist simuliert (`ANALYSIS_DURATION_MS` in `store.tsx`).
