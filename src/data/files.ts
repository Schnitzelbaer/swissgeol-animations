// Dateien des Assets. Die Abschnitte (Seitenklassen) entsprechen dem tatsächlichen Inhalt der PDFs.

export type Language = 'DE' | 'FR' | 'IT' | 'EN' | 'RM'

export type PageClass = 'Titelblatt' | 'Text' | 'Karte' | 'Diagramm' | 'Bohrprofil' | 'Geotechnisches Profil' | 'Vertrag'

export const PAGE_CLASSES: PageClass[] = ['Titelblatt', 'Text', 'Karte', 'Diagramm', 'Bohrprofil', 'Geotechnisches Profil', 'Vertrag']
export const LANGUAGES: Language[] = ['DE', 'FR', 'IT', 'EN', 'RM']

/** Gruppentitel im Inhaltsverzeichnis */
export const CLASS_GROUP_LABEL: Record<PageClass, string> = {
  Titelblatt: 'Titelblatt',
  Text: 'Texte',
  Karte: 'Karten',
  Diagramm: 'Diagramme',
  Bohrprofil: 'Bohrprofile',
  'Geotechnisches Profil': 'Geotechnische Profile',
  Vertrag: 'Vertrag',
}

/** Klassen ohne Sprachangabe (z.B. Karten), siehe Figma-Notiz */
export const CLASSES_WITHOUT_LANGUAGE: PageClass[] = ['Titelblatt', 'Karte']

export type Section = {
  id: string
  label: string
  type: PageClass
  language?: Language
  from: number
  to: number
}

export type AssetFile = {
  id: string
  /** Asset, zu dem die Datei gehört (siehe assets.ts) */
  assetId: string
  name: string
  format: 'PDF' | 'DB'
  size: string
  uploaded: string
  url?: string
  pages?: number
  languages?: Language[]
  /** Nur PDFs werden analysiert und haben ein Inhaltsverzeichnis */
  sections?: Section[]
  legal?: boolean
}

let sectionCounter = 0
export function newSectionId() {
  sectionCounter += 1
  return `section-${Date.now().toString(36)}-${sectionCounter}`
}

function sections(fileId: string, items: Omit<Section, 'id'>[]): Section[] {
  return items.map((item, index) => ({ ...item, id: `${fileId}-${index + 1}` }))
}

const rammdiagramme = Array.from({ length: 8 }, (_, index) => ({
  label: `Baugrundsondierung No. ${index + 1}`,
  type: 'Diagramm' as const,
  language: 'DE' as const,
  from: index + 6,
  to: index + 6,
}))

const sondages = [
  [201, 4, 5],
  [202, 6, 8],
  [203, 9, 11],
  [204, 12, 13],
  [205, 14, 16],
  [206, 17, 19],
  [207, 20, 22],
].map(([number, from, to]) => ({
  label: `Sondage N° ${number}`,
  type: 'Bohrprofil' as const,
  language: 'FR' as const,
  from,
  to,
}))

export const initialFiles: AssetFile[] = [
  {
    id: '4841',
    assetId: '4841',
    name: '4841_N12_Baugrunduntersuchungen_Thoerishaus.pdf',
    format: 'PDF',
    size: '4.2 MB',
    uploaded: '26.01.2023 14:55',
    url: '/pdfs/4841.pdf',
    pages: 3,
    languages: ['DE'],
    sections: sections('4841', [
      { label: 'Belegblatt SGD 4841', type: 'Titelblatt', from: 1, to: 1 },
      { label: 'N12 Rammsondierungen 1, 2, 3, 4 und BS 11 – Situation', type: 'Karte', from: 2, to: 2 },
      { label: 'Rammsondierungen RS 1 – RS 4', type: 'Diagramm', language: 'DE', from: 3, to: 3 },
      { label: 'Kornverteilung in Summationskurven BS 11', type: 'Diagramm', language: 'DE', from: 3, to: 3 },
    ]),
  },
  {
    id: '8768',
    assetId: '8768',
    name: '8768_N3_Sondierungen_SBB-Unterfuehrung_Lachen.pdf',
    format: 'PDF',
    size: '7.5 MB',
    uploaded: '26.01.2023 14:55',
    url: '/pdfs/8768.pdf',
    pages: 13,
    languages: ['DE'],
    sections: sections('8768', [
      { label: 'Belegblatt SGD 8768', type: 'Titelblatt', from: 1, to: 1 },
      { label: 'Begleitbrief Dr. Heinrich Jäckli an Ingenieurbüro A. Marty, 1. April 1970', type: 'Text', language: 'DE', from: 2, to: 2 },
      { label: 'Situation 1:1000 – Piezometerrohre für die Beobachtung der Grundwasserabsenkung bei der SBB-Unterführung der N3 in Lachen', type: 'Karte', from: 3, to: 4 },
      { label: 'Piezometerrohre für die Beobachtung der Grundwasserabsenkung', type: 'Text', language: 'DE', from: 5, to: 5 },
      ...rammdiagramme,
    ]),
  },
  {
    id: '16623',
    assetId: '16623',
    name: '16623_T20_Sondages_Tunnel_Vue-des-Alpes.pdf',
    format: 'PDF',
    size: '15 MB',
    uploaded: '27.01.2023 09:12',
    url: '/pdfs/16623.pdf',
    pages: 22,
    languages: ['FR'],
    sections: sections('16623', [
      { label: 'Tunnel de la Vue des Alpes – Situation des sondages N° 201 à 207', type: 'Karte', from: 1, to: 3 },
      ...sondages,
    ]),
  },
  {
    id: '16622',
    assetId: '16622',
    name: '16622_T20_Sondages_Gare_des_Convers.pdf',
    format: 'PDF',
    size: '5.7 MB',
    uploaded: '27.01.2023 09:16',
    url: '/pdfs/16622.pdf',
    pages: 7,
    languages: ['FR'],
    sections: sections('16622', [
      { label: 'Page de garde AGS 16622', type: 'Titelblatt', from: 1, to: 1 },
      { label: 'Tunnel de la Vue des Alpes – Situation des sondages N° 109 et 110', type: 'Karte', from: 2, to: 2 },
      { label: 'Sondage N° 109', type: 'Bohrprofil', language: 'FR', from: 3, to: 4 },
      { label: 'Sondage N° 110', type: 'Bohrprofil', language: 'FR', from: 5, to: 7 },
    ]),
  },
  {
    id: 'a56-55-csv',
    assetId: '4841',
    name: 'a56_55_LDoc.csv',
    format: 'DB',
    size: '112 kb',
    uploaded: '27.01.2023 09:14',
  },
  {
    id: '12304',
    assetId: '4841',
    name: '12304_Einwilligung_Schinznach.pdf',
    format: 'PDF',
    size: '2.7 MB',
    uploaded: '27.01.2023 09:20',
    url: '/pdfs/12304.pdf',
    pages: 3,
    languages: ['DE'],
    legal: true,
    sections: sections('12304', [{ label: 'Seichte Sondierbohrungen beim Schinznach Bad', type: 'Vertrag', language: 'DE', from: 1, to: 3 }]),
  },
]

export type SectionGroup = { type: PageClass; label: string; sections: Section[] }

/** Gruppiert Abschnitte nach Klasse; Gruppen und Einträge sind nach der ersten Seite geordnet */
export function groupSections(list: Section[]): SectionGroup[] {
  const sorted = [...list].sort((a, b) => a.from - b.from || a.to - b.to)
  const groups = new Map<PageClass, Section[]>()
  for (const section of sorted) {
    groups.set(section.type, [...(groups.get(section.type) ?? []), section])
  }
  return [...groups.entries()].map(([type, items]) => ({ type, label: CLASS_GROUP_LABEL[type], sections: items }))
}

export function pageRange(section: Pick<Section, 'from' | 'to'>) {
  return section.from === section.to ? `${section.from}` : `${section.from} – ${section.to}`
}

export function sectionTitle(section: Pick<Section, 'label' | 'type'>) {
  return section.label.trim() || section.type
}

/** Sprachen eines Dokuments: alle in den Abschnitten vorkommenden Sprachen */
export function fileLanguages(file: AssetFile) {
  const fromSections = file.sections?.map((section) => section.language).filter(Boolean) as Language[] | undefined
  const all = new Set([...(file.languages ?? []), ...(fromSections ?? [])])
  return LANGUAGES.filter((language) => all.has(language))
}
