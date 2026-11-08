// Assets mit den Inhalten des Preview-Panels. Die Dateien stehen in files.ts (Feld assetId).
// Asset 4841 entspricht dem Figma-Screen «Desktop - 1»; die übrigen Assets sind aus den echten PDFs abgeleitet.
// Codelisten (Thema, Typ, Sprache, Rollen usw.) stehen als Codes hier, ihre Texte in i18n/messages.ts.
// Titel, Namen und Verweise bleiben wie in der Live-Applikation in der Originalsprache.

import type { Lang } from '../i18n/messages'

export type Topic = 'borehole' | 'geotechnics' | 'seismic3d' | 'crossSection' | 'hydrogeology'
export type Kind = 'seismic3d' | 'wellLocationMap' | 'boreholeProfile'
export type AssetLanguage = 'de' | 'fr' | 'other'
export type NationalInterestReason = 'federalParticipation' | 'nationalImpact'
export type ContactRole = 'author' | 'initiator' | 'supplier'

export type Reference = {
  label: string
  /** Verweis auf ein anderes Asset im Prototyp; ohne ID ist der Link nur Dekoration */
  assetId?: string
}

export type Asset = {
  id: string
  title: string
  status: 'reviewed'
  restriction: 'public'
  topics: Topic[]
  kinds: Kind[]
  languages: AssetLanguage[]
  originalTitle: string
  dates: { created: string; received: string }
  nationalInterest: { value: boolean; reasons: NationalInterestReason[] }
  contacts: { role: ContactRole; names: string[] }[]
  alternativeIds: { id: string; description: Record<Lang, string> }[]
  references: Reference[]
}

export const DEFAULT_ASSET_ID = '4841'

const infoGeolId = { de: 'Original-ID aus InfoGeol', en: 'Original ID from InfoGeol' }

const vueDesAlpesContacts: Asset['contacts'] = [
  { role: 'author', names: ['J. Meia'] },
  { role: 'initiator', names: ['Service des Ponts et Chaussées, Neuchâtel'] },
  { role: 'supplier', names: ['De Cérenville Géotechnique SA'] },
]

export const assets: Asset[] = [
  {
    id: '4841',
    title: 'N9, rapport hydrogéologique sur source au SW de Chernex de baguette',
    status: 'reviewed',
    restriction: 'public',
    topics: ['borehole', 'geotechnics', 'seismic3d', 'crossSection'],
    kinds: ['seismic3d'],
    languages: ['de', 'fr', 'other'],
    originalTitle: 'N9, rapport hydrogéologique sur source au SW de Chernex baguette pain',
    dates: { created: '24.10.2025', received: '24.10.2025' },
    nationalInterest: {
      value: true,
      reasons: ['federalParticipation', 'nationalImpact'],
    },
    contacts: [
      { role: 'author', names: ['Aemissegger Beat', 'Schlatter Kurt'] },
      { role: 'initiator', names: ['Aemissegger Beat', 'Schlatter Kurt'] },
      { role: 'supplier', names: ['Aquaconsult AG'] },
    ],
    alternativeIds: [
      { id: '30/4', description: infoGeolId },
      { id: '30/4', description: infoGeolId },
    ],
    references: [
      { label: 'N12, étude géophysique tronçon Corpataux - Fribourg - Wünnewil - Stettbach – Bern' },
      { label: 'N12, étude géotechnique du tronçon Luggiwil - Flamatt' },
    ],
  },
  {
    id: '8768',
    title: 'N3, Sondierungen für SBB-Unterführung N Feldmoos, E Lachen',
    status: 'reviewed',
    restriction: 'public',
    topics: ['borehole', 'geotechnics', 'hydrogeology'],
    kinds: ['wellLocationMap'],
    languages: ['de'],
    originalTitle: 'Nationalstrasse N 3, Unterführung der SBB in Lachen: Piezometerrohre für die Beobachtung der Grundwasserabsenkung',
    dates: { created: '24.03.1970', received: '01.04.1970' },
    nationalInterest: { value: true, reasons: ['federalParticipation'] },
    contacts: [
      { role: 'author', names: ['Dr. Heinrich Jäckli'] },
      { role: 'initiator', names: ['Strasseninspektorat des Kantons Schwyz'] },
      { role: 'supplier', names: ['Dr. Heinrich Jäckli'] },
    ],
    alternativeIds: [{ id: '70.058', description: { de: 'Originalkennzeichen des Dokuments', en: 'Original reference of the document' } }],
    references: [{ label: 'N12, Baugrunduntersuchungen für Unterführung, SSW Thörishaus', assetId: '4841' }],
  },
  {
    id: '16623',
    title: 'T20, sondages de reconnaissance au Creux du Seret, S La Chaux-de-Fonds',
    status: 'reviewed',
    restriction: 'public',
    topics: ['borehole', 'geotechnics'],
    kinds: ['boreholeProfile'],
    languages: ['fr'],
    originalTitle: 'Tunnel de la Vue des Alpes – Géologie, sondages N° 201 à 207',
    dates: { created: '01.12.1982', received: '15.12.1982' },
    nationalInterest: { value: true, reasons: ['federalParticipation'] },
    contacts: vueDesAlpesContacts,
    alternativeIds: [{ id: '7866/72/1072', description: { de: 'Plan-Nr. Situation', en: 'Site plan no.' } }],
    references: [{ label: 'T20, sondages de reconnaissance au N gare des Convers, N Vue-des-Alpes', assetId: '16622' }],
  },
  {
    id: '16622',
    title: 'T20, sondages de reconnaissance au N gare des Convers, N Vue-des-Alpes',
    status: 'reviewed',
    restriction: 'public',
    topics: ['borehole', 'geotechnics'],
    kinds: ['boreholeProfile'],
    languages: ['fr'],
    originalTitle: 'Tunnel de la Vue des Alpes – Géologie, sondages N° 109 et 110',
    dates: { created: '05.10.1982', received: '15.12.1982' },
    nationalInterest: { value: true, reasons: ['federalParticipation'] },
    contacts: vueDesAlpesContacts,
    alternativeIds: [{ id: 'AGS 16621', description: { de: 'Verwandtes Dossier', en: 'Related dossier' } }],
    references: [{ label: 'T20, sondages de reconnaissance au Creux du Seret, S La Chaux-de-Fonds', assetId: '16623' }],
  },
  // Neu erfasstes Asset ohne Dateien: zeigt den leeren Zustand im Panel und im Files-Tab
  {
    id: '24518',
    title: 'Schenkon, Pumpversuch Grundwasserfassung Zellfeld',
    status: 'reviewed',
    restriction: 'public',
    topics: ['hydrogeology', 'borehole'],
    kinds: ['wellLocationMap'],
    languages: ['de'],
    originalTitle: 'Gemeinde Schenkon – Grundwasserfassung Zellfeld, Pumpversuch und Wasserqualität',
    dates: { created: '03.11.2026', received: '05.11.2026' },
    nationalInterest: { value: false, reasons: [] },
    contacts: [
      { role: 'author', names: ['M. Brunner'] },
      { role: 'initiator', names: ['Gemeinde Schenkon'] },
      { role: 'supplier', names: ['Brunner Geologie GmbH'] },
    ],
    alternativeIds: [],
    references: [],
  },
]

export function getAsset(id: string | undefined) {
  return assets.find((asset) => asset.id === id)
}
