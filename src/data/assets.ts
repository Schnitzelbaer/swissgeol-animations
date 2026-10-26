// Assets mit den Inhalten des Preview-Panels. Die Dateien stehen in files.ts (Feld assetId).
// Asset 4841 entspricht dem Figma-Screen «Desktop - 1»; die übrigen Assets sind aus den echten PDFs abgeleitet.

export type Reference = {
  label: string
  /** Verweis auf ein anderes Asset im Prototyp; ohne ID ist der Link nur Dekoration */
  assetId?: string
}

export type Asset = {
  id: string
  title: string
  status: string
  restriction: string
  topics: string[]
  type: string[]
  languages: string[]
  originalTitle: string
  dates: { label: string; value: string }[]
  nationalInterest: { value: string; reasons: string[] }
  contacts: { role: string; names: string[] }[]
  alternativeIds: { id: string; description: string }[]
  references: Reference[]
}

export const DEFAULT_ASSET_ID = '4841'

const vueDesAlpesContacts = [
  { role: 'Autor', names: ['J. Meia'] },
  { role: 'Auftraggeber', names: ['Service des Ponts et Chaussées, Neuchâtel'] },
  { role: 'Einlieferer', names: ['De Cérenville Géotechnique SA'] },
]

export const assets: Asset[] = [
  {
    id: '4841',
    title: 'N9, rapport hydrogéologique sur source au SW de Chernex de baguette',
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
      { label: 'N12, étude géophysique tronçon Corpataux - Fribourg - Wünnewil - Stettbach – Bern' },
      { label: 'N12, étude géotechnique du tronçon Luggiwil - Flamatt' },
    ],
  },
  {
    id: '8768',
    title: 'N3, Sondierungen für SBB-Unterführung N Feldmoos, E Lachen',
    status: 'Reviewed',
    restriction: 'Frei',
    topics: ['Bohrungen', 'Geotechnik', 'Hydrogeologie'],
    type: ['Bohrstandortkarte'],
    languages: ['Deutsch'],
    originalTitle: 'Nationalstrasse N 3, Unterführung der SBB in Lachen: Piezometerrohre für die Beobachtung der Grundwasserabsenkung',
    dates: [
      { label: 'Erstellungsdatum', value: '24.03.1970' },
      { label: 'Eingangsdatum', value: '01.04.1970' },
    ],
    nationalInterest: { value: 'Ja', reasons: ['Projekte mit Bundesbeteiligung'] },
    contacts: [
      { role: 'Autor', names: ['Dr. Heinrich Jäckli'] },
      { role: 'Auftraggeber', names: ['Strasseninspektorat des Kantons Schwyz'] },
      { role: 'Einlieferer', names: ['Dr. Heinrich Jäckli'] },
    ],
    alternativeIds: [{ id: '70.058', description: 'Originalkennzeichen des Dokuments' }],
    references: [{ label: 'N12, Baugrunduntersuchungen für Unterführung, SSW Thörishaus', assetId: '4841' }],
  },
  {
    id: '16623',
    title: 'T20, sondages de reconnaissance au Creux du Seret, S La Chaux-de-Fonds',
    status: 'Reviewed',
    restriction: 'Frei',
    topics: ['Bohrungen', 'Geotechnik'],
    type: ['Bohrprofil'],
    languages: ['Französisch'],
    originalTitle: 'Tunnel de la Vue des Alpes – Géologie, sondages N° 201 à 207',
    dates: [
      { label: 'Erstellungsdatum', value: '01.12.1982' },
      { label: 'Eingangsdatum', value: '15.12.1982' },
    ],
    nationalInterest: { value: 'Ja', reasons: ['Projekte mit Bundesbeteiligung'] },
    contacts: vueDesAlpesContacts,
    alternativeIds: [{ id: '7866/72/1072', description: 'Plan-Nr. Situation' }],
    references: [{ label: 'T20, sondages de reconnaissance au N gare des Convers, N Vue-des-Alpes', assetId: '16622' }],
  },
  {
    id: '16622',
    title: 'T20, sondages de reconnaissance au N gare des Convers, N Vue-des-Alpes',
    status: 'Reviewed',
    restriction: 'Frei',
    topics: ['Bohrungen', 'Geotechnik'],
    type: ['Bohrprofil'],
    languages: ['Französisch'],
    originalTitle: 'Tunnel de la Vue des Alpes – Géologie, sondages N° 109 et 110',
    dates: [
      { label: 'Erstellungsdatum', value: '05.10.1982' },
      { label: 'Eingangsdatum', value: '15.12.1982' },
    ],
    nationalInterest: { value: 'Ja', reasons: ['Projekte mit Bundesbeteiligung'] },
    contacts: vueDesAlpesContacts,
    alternativeIds: [{ id: 'AGS 16621', description: 'Verwandtes Dossier' }],
    references: [{ label: 'T20, sondages de reconnaissance au Creux du Seret, S La Chaux-de-Fonds', assetId: '16623' }],
  },
]

export function getAsset(id: string | undefined) {
  return assets.find((asset) => asset.id === id)
}
