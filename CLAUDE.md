# swissgeol-animations

Vite + React + TypeScript. Ziel: swissgeol-Assets (UI, Karten, Komponenten) nachbauen und daraus Feature-Animationen erstellen.

- `npm run dev` startet den Dev-Server, `npm run build` muss vor jedem Commit fehlerfrei durchlaufen.
- Push auf `main` deployed automatisch auf Vercel (Production); Branches/PRs bekommen Preview-URLs.
- UI-Texte auf Deutsch mit Schweizer Rechtschreibung (kein ß).

## Design-Vorlage

- Figma-Datei «swissgeol», Key `cEiOoOazAQZqpRY92ZhBeO`. Das Figma-Design hat Vorrang vor der Live-Version (assets.swissgeol.ch).
- Nachgebauter Screen: Asset-Vorschau, Node `20842:123706` («Desktop - 1», 1440×1024).
- Icons und Grafiken liegen unverändert als SVG/PNG aus Figma in `src/assets/`.

## Aufbau

- `src/styles/global.css`: Design-Tokens (Farben, Radien, Schatten) und Typografie-Klassen (`body3-medium` usw.) aus den Figma-Variablen. Schrift: Inter via `@fontsource/inter`.
- Styling mit CSS Modules pro Komponente, kein Tailwind.
- Figma zeichnet Rahmen innen: Paddings sind deshalb um die Rahmenbreite reduziert, damit die Masse aufgehen.
- Karte: OpenLayers mit swisstopo-WMTS (`pixelkarte-grau`, umschaltbar auf `-farbe`). Die Kacheln werden mit `tileSize: 128` halb so gross gezeichnet, weil das Kartenbild in Figma ein Retina-Screenshot ist.
- `src/components/map/geometries.ts`: Polygone, Linie und Punkte in Figma-Pixelkoordinaten, beim Start exakt wie im Design platziert.
- Das Preview-Panel liegt über der Karte; `--panel-offset` und das View-Padding von OpenLayers halten Kartenmitte, Steuerung und Tabellenleiste links davon.
- Inhalte des Panels: `src/data/asset.ts`.
