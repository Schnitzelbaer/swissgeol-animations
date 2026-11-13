// Dateien der Assets. Inhalte und Inhaltsverzeichnisse kommen aus den Dokument-Vorlagen (documents.ts).

import { fileFromDocument } from './documents'
import { generatedFiles } from './generatedAssets'

export type Language = 'DE' | 'FR' | 'IT' | 'EN' | 'RM'

/** Seitenklassen; die Schlüssel sind interne Codes, die Texte stehen in i18n/messages.ts (pageClass, pageClassGroup) */
export type PageClass = 'Titelblatt' | 'Text' | 'Karte' | 'Diagramm' | 'Bohrprofil' | 'Geotechnisches Profil' | 'Vertrag'

export const PAGE_CLASSES: PageClass[] = ['Titelblatt', 'Text', 'Karte', 'Diagramm', 'Bohrprofil', 'Geotechnisches Profil', 'Vertrag']
export const LANGUAGES: Language[] = ['DE', 'FR', 'IT', 'EN', 'RM']

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

/** Dateien der von Hand erfassten Assets (Figma-Inhalte und die echten Dokumente); dazu die erzeugten Assets */
const handFiles: AssetFile[] = [
  fileFromDocument('4841', { id: '4841', assetId: '4841', uploaded: '26.01.2023 14:55' }),
  fileFromDocument('8768', { id: '8768', assetId: '8768', uploaded: '26.01.2023 14:55' }),
  fileFromDocument('16623', { id: '16623', assetId: '16623', uploaded: '27.01.2023 09:12' }),
  fileFromDocument('16622', { id: '16622', assetId: '16622', uploaded: '27.01.2023 09:16' }),
  fileFromDocument('a56-55-csv', { id: 'a56-55-csv', assetId: '4841', uploaded: '27.01.2023 09:14' }),
  fileFromDocument('12304', { id: '12304', assetId: '4841', uploaded: '27.01.2023 09:20' }),
  // Zwei weitere PDFs bei 4841 (gleiche Dokumente wie bei 8768 und 16622, eigene Datei-IDs)
  fileFromDocument('8768', { id: '4841-8768', assetId: '4841', uploaded: '27.01.2023 09:24' }),
  fileFromDocument('16622', { id: '4841-16622', assetId: '4841', uploaded: '27.01.2023 09:27' }),
  fileFromDocument('14366', { id: '14366', assetId: '14366', uploaded: '08.11.2026 18:13' }),
  fileFromDocument('BLGD-12', { id: 'BLGD-12', assetId: '41205', uploaded: '08.11.2026 18:32' }),
  fileFromDocument('GBD-22', { id: 'GBD-22', assetId: '19873', uploaded: '08.11.2026 18:31' }),
]

export const initialFiles: AssetFile[] = [...handFiles, ...generatedFiles]

export type SectionGroup = { type: PageClass; sections: Section[] }

/** Gruppiert Abschnitte nach Klasse; Gruppen und Einträge sind nach der ersten Seite geordnet */
export function groupSections(list: Section[]): SectionGroup[] {
  const sorted = [...list].sort((a, b) => a.from - b.from || a.to - b.to)
  const groups = new Map<PageClass, Section[]>()
  for (const section of sorted) {
    groups.set(section.type, [...(groups.get(section.type) ?? []), section])
  }
  return [...groups.entries()].map(([type, items]) => ({ type, sections: items }))
}

export function pageRange(section: Pick<Section, 'from' | 'to'>) {
  return section.from === section.to ? `${section.from}` : `${section.from} – ${section.to}`
}

/** Titel eines Abschnitts; ohne Label der Name seiner Seitenklasse */
export function sectionTitle(section: Pick<Section, 'label' | 'type'>, classLabels: Record<PageClass, string>) {
  return section.label.trim() || classLabels[section.type]
}

/** Sprachen eines Dokuments: alle in den Abschnitten vorkommenden Sprachen */
export function fileLanguages(file: AssetFile) {
  const fromSections = file.sections?.map((section) => section.language).filter(Boolean) as Language[] | undefined
  const all = new Set([...(file.languages ?? []), ...(fromSections ?? [])])
  return LANGUAGES.filter((language) => all.has(language))
}
