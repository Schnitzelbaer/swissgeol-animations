// Varianten des Prototyps, gruppiert nach Thema (z.B. Legende, Popover). Pro Gruppe ist genau eine Variante aktiv;
// die erste ist der Standard (heutiger Stand) und steht nicht in der URL. Die übrigen stehen als ?v-<Gruppe>=<Variante>
// in der URL, so hat jede Kombination einen eigenen, teilbaren Link. Die Varianten-Leiste zeigt nur die Gruppen,
// deren `pages` zur aktuellen Seite passt.
//
// Neue Gruppe: hier eintragen und in der Komponente `useVariant('<gruppe>')` abfragen, z.B.
//
//   {
//     key: 'contents',
//     label: 'Legende «Verfügbare Inhalte»',
//     pages: /^\/boreholes/,
//     variants: [
//       { key: 'aktuell', label: 'Aktuell' },
//       { key: 'farbig', label: 'Farbige Sektoren' },
//     ],
//   },
//
//   const variant = useVariant('contents') // 'aktuell' | 'farbig'

export type Variant = {
  /** Kurzer Schlüssel für die URL (Kleinbuchstaben, Ziffern, Bindestrich) */
  key: string
  label: string
}

export type VariantGroup = {
  key: string
  label: string
  /** Ohne Gruppen-Überschrift: die Varianten stehen direkt im Dropdown (z.B. «Legende v1», «Legende v2») */
  flat?: boolean
  /** Seiten, auf denen die Gruppe wirkt (Pfad der URL) */
  pages: RegExp
  /** Erste Variante = Standard */
  variants: Variant[]
}

export const VARIANT_GROUPS: VariantGroup[] = [
  {
    key: 'legend',
    label: 'Legende',
    flat: true,
    pages: /^\/boreholes/,
    // Schlüssel v2 bleibt für «Legende v2.1», damit bestehende Links (?v-legend=v2) weiter passen
    variants: [
      { key: 'v1', label: 'Legende v1' },
      { key: 'v2', label: 'Legende v2.1' },
      { key: 'v2-2', label: 'Legende v2.2' },
    ],
  },
]
