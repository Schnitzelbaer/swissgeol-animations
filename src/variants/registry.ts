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
//       { key: 'aktuell', label: 'Aktuell', description: 'Sektoren einfarbig' },
//       { key: 'farbig', label: 'Farbige Sektoren', description: 'Eigene Farbe je Inhalt' },
//     ],
//   },
//
//   const variant = useVariant('contents') // 'aktuell' | 'farbig'

export type Variant = {
  /** Kurzer Schlüssel für die URL (Kleinbuchstaben, Ziffern, Bindestrich) */
  key: string
  label: string
  /** Was die Variante ausprobiert; erscheint im Dropdown unter dem Namen */
  description?: string
}

export type VariantGroup = {
  key: string
  label: string
  /** Seiten, auf denen die Gruppe wirkt (Pfad der URL) */
  pages: RegExp
  /** Erste Variante = Standard */
  variants: Variant[]
}

export const VARIANT_GROUPS: VariantGroup[] = []
