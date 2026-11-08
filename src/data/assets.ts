// Assets mit den Inhalten des Preview-Panels. Die Dateien stehen in files.ts (Feld assetId).
// Asset 4841 entspricht dem Figma-Screen «Desktop - 1»; die übrigen Assets sind aus den echten PDFs abgeleitet.
// Codelisten (Thema, Typ, Sprache, Rollen usw.) stehen als Codes hier, ihre Texte in i18n/messages.ts.
// Titel, Namen und Verweise bleiben wie in der Live-Applikation in der Originalsprache.

import type { Lang } from '../i18n/messages'
import { generatedAssets } from './generatedAssets'

export type Topic = 'borehole' | 'geotechnics' | 'seismic3d' | 'crossSection' | 'hydrogeology' | 'naturalHazards' | 'geophysics' | 'mineralResources'
export type Kind =
  | 'seismic3d'
  | 'wellLocationMap'
  | 'boreholeProfile'
  | 'report'
  | 'geologicalMap'
  | 'crossSection'
  | 'labAnalysis'
  | 'measurements'
export type AssetLanguage = 'de' | 'fr' | 'it' | 'en' | 'other'
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
  // SBB, Ausbau Bahnhof und Bahnanlage Tecknau (BL): Sondierungen 1975
  {
    id: '14366',
    title: 'SBB Tecknau, Sondierungen für den Ausbau von Bahnhof und Bahnanlage, Strecke Basel – Olten',
    status: 'reviewed',
    restriction: 'public',
    topics: ['borehole', 'geotechnics'],
    kinds: ['boreholeProfile', 'measurements'],
    languages: ['de'],
    originalTitle: 'Ausbau Bahnhof und Bahnanlage Tecknau – Sondierungen SB 1 – SB 6 und Rammsondierungen RS 1 – RS 13',
    dates: { created: '07.01.1976', received: '20.02.1976' },
    nationalInterest: { value: true, reasons: ['federalParticipation'] },
    contacts: [
      { role: 'author', names: ['Gebr. Mengis Luzern'] },
      { role: 'initiator', names: ['SBB Bauabteilung Kreis II, Sektion Tiefbau Luzern'] },
      { role: 'supplier', names: ['Gebr. Mengis Luzern'] },
    ],
    alternativeIds: [{ id: '75 652', description: { de: 'Plan-Nr. Situation', en: 'Site plan no.' } }],
    references: [{ label: 'N3, Sondierungen für SBB-Unterführung N Feldmoos, E Lachen', assetId: '8768' }],
  },
  // Berichte der Landesgeologie Nr. 12: Ceneri-Basistunnel
  {
    id: '41205',
    title: 'Ceneri-Basistunnel, zusammenfassender geologischer Schlussbericht',
    status: 'reviewed',
    restriction: 'public',
    topics: ['geotechnics', 'hydrogeology', 'crossSection'],
    kinds: ['report', 'crossSection', 'labAnalysis'],
    languages: ['de', 'it', 'fr', 'en'],
    originalTitle: 'Ceneri-Basistunnel – Zusammenfassender geologischer Schlussbericht (Berichte der Landesgeologie Nr. 12)',
    dates: { created: '01.11.2020', received: '30.11.2020' },
    nationalInterest: { value: true, reasons: ['federalParticipation', 'nationalImpact'] },
    contacts: [
      { role: 'author', names: ['A. Hürzeler', 'G. Bergamini', 'S. Pozzorini', 'P.-F. Erard', 'M. Morandi'] },
      { role: 'initiator', names: ['AlpTransit Gotthard AG'] },
      { role: 'supplier', names: ['Bundesamt für Landestopografie swisstopo'] },
    ],
    alternativeIds: [{ id: 'BLGD 12', description: { de: 'Berichte der Landesgeologie Nr. 12', en: 'Reports of the Swiss Geological Survey no. 12' } }],
    references: [{ label: 'Lötschberg-Basistunnel, geologische Voruntersuchungen und Prognosen', assetId: '19873' }],
  },
  // Geologische Berichte Nr. 22: Lötschberg-Basistunnel
  {
    id: '19873',
    title: 'Lötschberg-Basistunnel, geologische Voruntersuchungen und Prognosen',
    status: 'reviewed',
    restriction: 'public',
    topics: ['geotechnics', 'borehole', 'crossSection'],
    kinds: ['report', 'crossSection', 'boreholeProfile'],
    languages: ['de', 'fr', 'it'],
    originalTitle: 'Geologie des Lötschberg-Basistunnels – Geologische Berichte Nr. 22',
    dates: { created: '01.06.1998', received: '15.06.1998' },
    nationalInterest: { value: true, reasons: ['federalParticipation', 'nationalImpact'] },
    contacts: [
      { role: 'author', names: ['P. Kellerhals', 'A. Isler'] },
      { role: 'initiator', names: ['BLS AlpTransit AG'] },
      { role: 'supplier', names: ['Geologengruppe Lötschberg-Basistunnel'] },
    ],
    alternativeIds: [{ id: 'GB 22', description: { de: 'Geologische Berichte Nr. 22', en: 'Geological reports no. 22' } }],
    references: [{ label: 'Ceneri-Basistunnel, zusammenfassender geologischer Schlussbericht', assetId: '41205' }],
  },
  ...generatedAssets,
]

export function getAsset(id: string | undefined) {
  return assets.find((asset) => asset.id === id)
}
