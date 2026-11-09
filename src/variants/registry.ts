// Varianten des Prototyps, gruppiert nach Thema (z.B. Legende, Popover). Pro Gruppe ist genau eine Variante aktiv;
// der Standard (`defaultVariant`, sonst die erste) steht nicht in der URL. Die übrigen stehen als ?v-<Gruppe>=<Variante>
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
  /** Varianten in der Reihenfolge des Dropdowns */
  variants: Variant[]
  /** Standard ohne URL-Parameter; ohne Angabe die erste Variante */
  defaultVariant?: string
}

export function defaultVariantOf(group: VariantGroup) {
  return group.defaultVariant ?? group.variants[0]?.key
}

export const VARIANT_GROUPS: VariantGroup[] = [
  {
    key: 'legend',
    label: 'Legende',
    flat: true,
    pages: /^\/boreholes/,
    // v1 = Stand vor dem Feedback; Standard bleibt v2 (aktuelle Symbolisierung), damit Links ohne Parameter gleich bleiben
    defaultVariant: 'v2',
    variants: [
      { key: 'v1', label: 'Legende v1' },
      { key: 'v2', label: 'Legende v2' },
      { key: 'v3-1', label: 'Legende v3.1' },
      { key: 'v3-2', label: 'Legende v3.2' },
    ],
  },
]
