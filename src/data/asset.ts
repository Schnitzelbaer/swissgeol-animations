// Inhalte des Preview-Panels gemäss Figma-Screen «Desktop - 1»

export type DocumentFile = {
  name: string
  chips: string[]
  /** Zeilen der Inhaltsangabe; jede Zeile besteht aus Chip-Gruppen, die durch Trennstriche getrennt sind */
  content?: string[][][]
  /** «Inhalt:»-Label mit Aufklapp-Pfeil vor den Chips */
  showContentLabel?: boolean
}

export const asset = {
  title: 'N9, rapport hydrogéologique sur source au SW de Chernex de baguette',
  documents: [
    {
      name: 'a56_55_LDoc_20251209_v2.pdf',
      chips: ['PDF', '2.5MB'],
      content: [[['34 Seiten', 'DE', 'FR'], ['Reports', 'Karten']]],
      showContentLabel: true,
    },
    {
      name: 'a56_55_LDoc_20251209_erste Fassung_v2.pdf',
      chips: ['PDF', '5MB'],
      content: [[['34 Seiten', 'DE'], ['Reports', 'Diagramme']], [['Geotechnische Profile', 'Profilschnitt', '+1']]],
      showContentLabel: true,
    },
    {
      name: 'a56_55_LDoc.csv',
      chips: ['DB', '112KB'],
    },
  ] satisfies DocumentFile[],
  legal: [
    {
      name: '41120_Ldoc.pdf',
      chips: ['PDF', '2.5MB'],
      content: [[['8 Seiten', 'DE', 'FR'], ['Vertrag']]],
    },
  ] satisfies DocumentFile[],
  status: 'Reviewed',
  restriction: 'Frei',
  topics: ['Bohrungen', 'Geotechnik', 'Seismische 3D Untersuchungen', 'Geologischer Profilschnitt'],
  type: ['Seismische 3d Untersuchung'],
  languages: ['Deutsch', 'Französisch', 'Weitere Sprachen'],
  originalTitle: 'N9, rapport hydrogéologique sur source au SW de Chernex baguette pain',
  dates: [
    { label: 'Erstellungsdatum', value: '24.10.2025' },
    { label: 'Eingangsdatum', value: '24.10.2025' },
  ],
  nationalInterest: {
    value: 'Ja',
    reasons: ['Projekte mit Bundesbeteiligung', 'Projekte mit nationaler Ausstrahlung'],
  },
  contacts: [
    { role: 'Autor', names: ['Aemissegger Beat', 'Schlatter Kurt'] },
    { role: 'Auftraggeber', names: ['Aemissegger Beat', 'Schlatter Kurt'] },
    { role: 'Einlieferer', names: ['Aquaconsult AG'] },
  ],
  alternativeIds: [
    { id: '30/4', description: 'Original-ID aus InfoGeol' },
    { id: '30/4', description: 'Original-ID aus InfoGeol' },
  ],
  references: [
    'N12, étude géophysique tronçon Corpataux - Fribourg - Wünnewil - Stettbach – Bern',
    'N12, étude géotechnique du tronçon Luggiwil - Flamatt',
  ],
}
