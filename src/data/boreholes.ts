// Bohrungen der Applikation «Boreholes». Die ersten 24 stehen wie im Figma-Screen 7558:31771 (Position und Werte
// aller fünf Legenden aus Figma), die übrigen werden über die ganze Schweiz verteilt erzeugt. Namen und Werte sind
// erfunden, aber plausibel; Koordinaten, Gemeinde, Kanton und Höhe folgen aus der Lage auf der Karte.

import type { Lang } from '../i18n/messages'
import { LAKES, PLACES, START_VIEW, type Canton, type Place } from './swissPlaces'

export type TemplateType = 'general' | 'geothermal' | 'geotechnics' | 'hydrogeology'

// Codes = Variantennamen der Figma-Komponente «Legende Objekte – Boreholes», Reihenfolge wie in den Legenden
export const PURPOSES = [
  'Belastete Standorte', 'Naturgefahren', 'Geotechnik', 'Tunnel Exploration', 'Hydrogeologie', 'Grundwasser', 'Trinkwasser',
  'Mineralwasser', 'Thermalwasser', 'Geothermie Exploration', 'Geothermie Produktion', 'Geothermie Injektion', 'Erdwärmesonde',
  'CCS Exploration', 'CCS Produktion', 'CCS Injektion', 'Mineralische Rohstoffe', 'Kohlenwasserstoff Exploration',
  'Kohlenwasserstoff Produktion', 'Kohlenwasserstoff Injektion', 'Wissenschaftliche Exploration', 'Forschung', 'Anderer', 'Keine Angabe',
] as const
export const ACCESS = ['Öffentlich', 'Gesperrt'] as const
export const BOREHOLE_TYPES = ['Bohrung', 'Virtuelle Bohrung', 'Rammsondierung', 'Baggerschlitz', 'Aufschluss', 'Anderer', 'Keine Angabe'] as const
export const WORKFLOW_STATES = ['In Bearbeitung', 'In Überprüfung', 'In Validierung', 'Publikation', 'Änderung angefordert'] as const

export type Purpose = (typeof PURPOSES)[number]
export type Access = (typeof ACCESS)[number]
export type BoreholeType = (typeof BOREHOLE_TYPES)[number]
export type WorkflowState = (typeof WORKFLOW_STATES)[number]

export type BoreholeIdentifier = {
  type: string
  /** Mehrere Codes, z.B. InfoGeol-Nummern für Tiefenabschnitte */
  codes: { code: string; comment?: Record<Lang, string> }[]
}

export type Borehole = {
  id: string
  name: string
  type: TemplateType
  purpose: Purpose
  access: Access
  boreholeType: BoreholeType
  workflow: WorkflowState
  /** Figma-Bohrungen: Mittelpunkt des Symbols im Screen «Desktop - 1» (Frame-Pixel) */
  figma?: [number, number]
  /** Erzeugte Bohrungen: Lage in WGS84 [Länge, Breite] */
  lonLat?: [number, number]
  /** Lagegenauigkeit in m */
  locationPrecision: number
  /** Ansatzhöhe über bzw. unter Terrain in m (Referenzhöhe = Terrainhöhe + Wert) */
  referenceOffset: number
  identifiers: BoreholeIdentifier[]
}

type FigmaBorehole = Omit<Borehole, 'purpose' | 'access' | 'boreholeType' | 'workflow'>

/** Positionen aus Figma: Instanz «BG» liegt bei (-239, -13), die Symbole sind 30×30 */
const at = (x: number, y: number): [number, number] => [-239 + x + 15, -13 + y + 15]

const depth = (from: number, to: number): Record<Lang, string> => ({ de: `von ${from} bis ${to}m`, en: `from ${from} to ${to} m` })

function ids(id: string, extra: BoreholeIdentifier[] = []): BoreholeIdentifier[] {
  return [{ type: 'ID boreholes.swissgeol.ch', codes: [{ code: id }] }, ...extra]
}

// Reihenfolge wie in Figma: spätere Symbole liegen oben
const figmaBoreholes: FigmaBorehole[] = [
  // Allgemein
  {
    id: '16754',
    name: 'Kb 00/2',
    type: 'general',
    figma: at(1043.5, 339),
    locationPrecision: 1,
    referenceOffset: 0.5,
    identifiers: ids('16754', [
      { type: 'ID GeoQuat', codes: [{ code: 'B172' }] },
      { type: 'ID GeODin-Shortname', codes: [{ code: '6TOE17I800', comment: { de: '6TOE17I800', en: '6TOE17I800' } }] },
      {
        type: 'ID InfoGeol',
        codes: [
          { code: '38084', comment: depth(0, 1854) },
          { code: '25140', comment: depth(1854, 2166) },
        ],
      },
    ]),
  },
  { id: '16761', name: 'Kb 98/1', type: 'general', figma: at(1115.5, 448), locationPrecision: 5, referenceOffset: 0, identifiers: ids('16761', [{ type: 'ID GeoQuat', codes: [{ code: 'B184' }] }]) },
  { id: '16762', name: 'Kb 98/2', type: 'general', figma: at(1105.5, 454), locationPrecision: 5, referenceOffset: 0, identifiers: ids('16762', [{ type: 'ID GeoQuat', codes: [{ code: 'B185' }] }]) },
  { id: '16803', name: 'B 1/71', type: 'general', figma: at(1303.5, 480), locationPrecision: 10, referenceOffset: 0, identifiers: ids('16803', [{ type: 'ID InfoGeol', codes: [{ code: '31027', comment: depth(0, 42) }] }]) },
  { id: '16815', name: 'Kb 12/3', type: 'general', figma: at(1167.5, 634), locationPrecision: 1, referenceOffset: 0.3, identifiers: ids('16815', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6SUR12K003' }] }]) },
  { id: '16820', name: 'SB 4', type: 'general', figma: at(885.5, 634), locationPrecision: 2, referenceOffset: 0, identifiers: ids('16820') },
  { id: '16834', name: 'B 2/71', type: 'general', figma: at(1237.5, 380), locationPrecision: 10, referenceOffset: 0, identifiers: ids('16834', [{ type: 'ID InfoGeol', codes: [{ code: '31028', comment: depth(0, 38) }] }]) },
  { id: '16842', name: 'Kb 05/1', type: 'general', figma: at(1185.5, 280), locationPrecision: 1, referenceOffset: 0.2, identifiers: ids('16842', [{ type: 'ID GeoQuat', codes: [{ code: 'B201' }] }]) },
  { id: '16857', name: 'SB 7', type: 'general', figma: at(968.5, 346), locationPrecision: 2, referenceOffset: 0, identifiers: ids('16857') },
  // Erdsonde
  { id: '17102', name: 'EWS 1 Zollhus', type: 'geothermal', figma: at(1114.5, 468), locationPrecision: 0.5, referenceOffset: 0, identifiers: ids('17102', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6GEU19E001' }] }]) },
  { id: '17103', name: 'EWS 2 Zollhus', type: 'geothermal', figma: at(1107.5, 466), locationPrecision: 0.5, referenceOffset: 0, identifiers: ids('17103', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6GEU19E002' }] }]) },
  { id: '17104', name: 'EWS 3 Zollhus', type: 'geothermal', figma: at(1107.5, 458), locationPrecision: 0.5, referenceOffset: 0, identifiers: ids('17104', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6GEU19E003' }] }]) },
  { id: '17105', name: 'EWS 4 Zollhus', type: 'geothermal', figma: at(1119.5, 456), locationPrecision: 0.5, referenceOffset: 0, identifiers: ids('17105', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6GEU19E004' }] }]) },
  // Hydrogeologie
  { id: '17210', name: 'PZ 1', type: 'hydrogeology', figma: at(1156, 156), locationPrecision: 1, referenceOffset: 0.6, identifiers: ids('17210', [{ type: 'ID InfoGeol', codes: [{ code: '29811', comment: depth(0, 18) }] }]) },
  { id: '17224', name: 'GW 21/2', type: 'hydrogeology', figma: at(1332, 363), locationPrecision: 1, referenceOffset: 0.8, identifiers: ids('17224', [{ type: 'ID GeoQuat', codes: [{ code: 'H077' }] }]) },
  { id: '17231', name: 'PZ 3', type: 'hydrogeology', figma: at(1214, 610), locationPrecision: 1, referenceOffset: 0.5, identifiers: ids('17231') },
  { id: '17232', name: 'PZ 4', type: 'hydrogeology', figma: at(1172, 630), locationPrecision: 1, referenceOffset: 0.5, identifiers: ids('17232') },
  { id: '17233', name: 'PZ 5', type: 'hydrogeology', figma: at(1164, 654), locationPrecision: 1, referenceOffset: 0.5, identifiers: ids('17233') },
  { id: '17234', name: 'PZ 6', type: 'hydrogeology', figma: at(1164, 678), locationPrecision: 1, referenceOffset: 0.5, identifiers: ids('17234', [{ type: 'ID InfoGeol', codes: [{ code: '29840', comment: depth(0, 22) }] }]) },
  // Geotechnik (Figma «Baugrund»)
  { id: '17305', name: 'RB 1', type: 'geotechnics', figma: at(895, 556), locationPrecision: 2, referenceOffset: 0, identifiers: ids('17305', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6KNU21R001' }] }]) },
  { id: '17306', name: 'RB 2', type: 'geotechnics', figma: at(946, 522), locationPrecision: 2, referenceOffset: 0, identifiers: ids('17306', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6KNU21R002' }] }]) },
  { id: '17307', name: 'RB 3', type: 'geotechnics', figma: at(887, 504), locationPrecision: 2, referenceOffset: 0, identifiers: ids('17307', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6KNU21R003' }] }]) },
  { id: '17308', name: 'RB 4', type: 'geotechnics', figma: at(863, 518), locationPrecision: 2, referenceOffset: 0, identifiers: ids('17308', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6KNU21R004' }] }]) },
  { id: '17309', name: 'RB 5', type: 'geotechnics', figma: at(863, 542), locationPrecision: 2, referenceOffset: 0, identifiers: ids('17309', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6KNU21R005' }] }]) },
]

// Werte der übrigen Legenden für die Figma-Bohrungen (Frames 7558:31782, 8269:20137, 8269:20520, 8269:20953)
const FIGMA_VALUES: [Purpose, Access, BoreholeType, WorkflowState][] = [
  ['Belastete Standorte', 'Öffentlich', 'Virtuelle Bohrung', 'Publikation'],
  ['Geothermie Produktion', 'Gesperrt', 'Bohrung', 'Publikation'],
  ['Erdwärmesonde', 'Öffentlich', 'Rammsondierung', 'Publikation'],
  ['Thermalwasser', 'Öffentlich', 'Bohrung', 'Publikation'],
  ['Belastete Standorte', 'Öffentlich', 'Keine Angabe', 'In Validierung'],
  ['Trinkwasser', 'Gesperrt', 'Virtuelle Bohrung', 'Publikation'],
  ['CCS Exploration', 'Öffentlich', 'Bohrung', 'In Validierung'],
  ['Naturgefahren', 'Öffentlich', 'Bohrung', 'Änderung angefordert'],
  ['Geotechnik', 'Öffentlich', 'Bohrung', 'In Überprüfung'],
  ['CCS Injektion', 'Öffentlich', 'Keine Angabe', 'Publikation'],
  ['CCS Injektion', 'Gesperrt', 'Anderer', 'Publikation'],
  ['Geothermie Injektion', 'Gesperrt', 'Baggerschlitz', 'Publikation'],
  ['Geothermie Produktion', 'Gesperrt', 'Virtuelle Bohrung', 'Publikation'],
  ['Naturgefahren', 'Gesperrt', 'Baggerschlitz', 'In Überprüfung'],
  ['Tunnel Exploration', 'Öffentlich', 'Rammsondierung', 'Publikation'],
  ['Wissenschaftliche Exploration', 'Öffentlich', 'Bohrung', 'Publikation'],
  ['Belastete Standorte', 'Öffentlich', 'Bohrung', 'Publikation'],
  ['Mineralische Rohstoffe', 'Öffentlich', 'Aufschluss', 'Publikation'],
  ['Keine Angabe', 'Öffentlich', 'Keine Angabe', 'Publikation'],
  ['Wissenschaftliche Exploration', 'Öffentlich', 'Bohrung', 'In Bearbeitung'],
  ['Kohlenwasserstoff Produktion', 'Öffentlich', 'Bohrung', 'Änderung angefordert'],
  ['Naturgefahren', 'Öffentlich', 'Aufschluss', 'In Bearbeitung'],
  ['Grundwasser', 'Öffentlich', 'Aufschluss', 'In Bearbeitung'],
  ['Anderer', 'Gesperrt', 'Bohrung', 'In Bearbeitung'],
]

/** Deterministischer Zufall (mulberry32), damit die erzeugten Bohrungen bei jedem Laden gleich sind */
function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = random(20251105)
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)]
function weighted<T>(entries: [T, number][]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let value = rand() * total
  for (const [entry, weight] of entries) {
    value -= weight
    if (value <= 0) return entry
  }
  return entries[entries.length - 1][0]
}
/** Normalverteilt (Box-Muller) */
const gaussian = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())

const KM_PER_DEGREE_LAT = 111.32
const inLake = (lat: number, lon: number) =>
  LAKES.some(([lakeLat, lakeLon, radius]) => Math.hypot((lat - lakeLat) * KM_PER_DEGREE_LAT, (lon - lakeLon) * KM_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180)) < radius)

const PURPOSE_BY_TYPE: Record<TemplateType, [Purpose, number][]> = {
  geothermal: [['Erdwärmesonde', 70], ['Geothermie Exploration', 10], ['Geothermie Produktion', 10], ['Geothermie Injektion', 10]],
  geotechnics: [['Geotechnik', 60], ['Tunnel Exploration', 12], ['Belastete Standorte', 18], ['Naturgefahren', 10]],
  hydrogeology: [['Hydrogeologie', 30], ['Grundwasser', 35], ['Trinkwasser', 20], ['Mineralwasser', 8], ['Thermalwasser', 7]],
  general: [
    ['Wissenschaftliche Exploration', 20], ['Forschung', 15], ['Mineralische Rohstoffe', 15], ['Kohlenwasserstoff Exploration', 10],
    ['Kohlenwasserstoff Produktion', 5], ['Kohlenwasserstoff Injektion', 3], ['CCS Exploration', 7], ['CCS Produktion', 3], ['CCS Injektion', 2],
    ['Anderer', 10], ['Keine Angabe', 10],
  ],
}

/** Namen nach den üblichen Kürzeln: Kernbohrung, Rammbohrung, Erdwärmesonde, Piezometer, Grundwasserbohrung … */
function boreholeName(type: TemplateType, place: string, index: number) {
  const year = String(60 + Math.floor(rand() * 64)).slice(-2).padStart(2, '0')
  const n = 1 + Math.floor(rand() * 24)
  const town = place.replace(/ \(.*\)$/, '').split(/[-/ ]/)[0]
  switch (type) {
    case 'geothermal':
      return pick([`EWS ${n} ${town}`, `EWS-${town}-${n}`, `Erdsonde ${town} ${n}`])
    case 'geotechnics':
      return pick([`RB ${n}`, `KB ${year}/${n}`, `SB ${n}`, `BS ${index % 40 + 1}`, `RKS ${town} ${n}`])
    case 'hydrogeology':
      return pick([`PZ ${n}`, `GWB ${year}/${n}`, `GW ${n} ${town}`, `Piezometer ${town} ${n}`])
    default:
      return pick([`B ${n}/${year}`, `Kb ${year}/${n}`, `TB ${town} ${n}`, `Sondierbohrung ${town} ${n}`])
  }
}

function generateBoreholes(): Borehole[] {
  const result: Borehole[] = []
  let id = 20001

  const create = (place: Place, index: number, lon: number, lat: number, type: TemplateType): Borehole => {
    const boreholeId = String(id++)
    const extra: BoreholeIdentifier[] = rand() < 0.4 ? [{ type: 'ID GeODin-Shortname', codes: [{ code: `6${place.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')}${year2()}${pick(['E', 'K', 'R', 'P'])}${String(100 + Math.floor(rand() * 900))}` }] }] : []
    return {
      id: boreholeId,
      name: boreholeName(type, place.name, index),
      type,
      purpose: weighted(PURPOSE_BY_TYPE[type]),
      access: weighted<Access>([['Öffentlich', 85], ['Gesperrt', 15]]),
      boreholeType: weighted<BoreholeType>(
        type === 'geotechnics'
          ? [['Bohrung', 45], ['Rammsondierung', 25], ['Baggerschlitz', 12], ['Aufschluss', 6], ['Virtuelle Bohrung', 2], ['Anderer', 5], ['Keine Angabe', 5]]
          : [['Bohrung', 70], ['Rammsondierung', 4], ['Baggerschlitz', 4], ['Aufschluss', 6], ['Virtuelle Bohrung', 5], ['Anderer', 5], ['Keine Angabe', 6]],
      ),
      workflow: weighted<WorkflowState>([['Publikation', 50], ['In Bearbeitung', 20], ['In Überprüfung', 12], ['In Validierung', 12], ['Änderung angefordert', 6]]),
      lonLat: [lon, lat],
      locationPrecision: pick([0.5, 1, 1, 2, 5, 10]),
      referenceOffset: pick([0, 0, 0.2, 0.5, 0.8]),
      identifiers: ids(boreholeId, extra),
    }
  }

  const placeOf = new Map<Borehole, Place>()
  for (const place of PLACES) {
    for (let i = 0; i < place.count; i++) {
      let lat = 0
      let lon = 0
      // Position um die Ortschaft, nicht in einem See und nicht im Figma-Startausschnitt
      for (let attempt = 0; attempt < 20; attempt++) {
        lat = place.lat + (gaussian() * place.spread) / KM_PER_DEGREE_LAT
        lon = place.lon + (gaussian() * place.spread) / (KM_PER_DEGREE_LAT * Math.cos((place.lat * Math.PI) / 180))
        const inStartView = lon > START_VIEW.west && lon < START_VIEW.east && lat > START_VIEW.south && lat < START_VIEW.north
        if (!inLake(lat, lon) && !inStartView) break
      }
      const type = weighted<TemplateType>([['geothermal', 35], ['geotechnics', 30], ['general', 20], ['hydrogeology', 15]])
      const borehole = create(place, i, lon, lat, type)
      placeOf.set(borehole, place)
      result.push(borehole)
    }
  }

  // Mehrere Bohrungen am exakt gleichen Standort (z.B. nur auf die Parzelle genau erfasst): erscheinen als Badge mit Anzahl
  const singles = [...result]
  singles.forEach((base, index) => {
    if (index % 14 !== 4) return
    const place = placeOf.get(base)!
    const [lon, lat] = base.lonLat!
    const extra = weighted<number>([[1, 50], [2, 25], [3, 12], [4, 7], [6, 4], [11, 2]])
    for (let k = 0; k < extra; k++) {
      const type = rand() < 0.7 ? base.type : weighted<TemplateType>([['geothermal', 35], ['geotechnics', 30], ['general', 20], ['hydrogeology', 15]])
      result.push(create(place, place.count + k, lon, lat, type))
    }
  })
  return result
}

function year2() {
  return String(Math.floor(rand() * 26)).padStart(2, '0')
}

/**
 * Zwei Bohrungen am exakt gleichen Standort in der Altstadt Sursee, im Startausschnitt (nicht in Figma):
 * zeigen beim Start ein Badge «2».
 */
const SURSEE: Borehole[] = [
  {
    id: '17401', name: 'RB 1 Rathausplatz', type: 'geotechnics', purpose: 'Geotechnik', access: 'Öffentlich', boreholeType: 'Rammsondierung', workflow: 'Publikation',
    lonLat: [8.1092, 47.1708], locationPrecision: 1, referenceOffset: 0,
    identifiers: ids('17401', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6SUR23R001' }] }]),
  },
  {
    id: '17402', name: 'KB 2 Rathausplatz', type: 'geotechnics', purpose: 'Geotechnik', access: 'Öffentlich', boreholeType: 'Bohrung', workflow: 'In Bearbeitung',
    lonLat: [8.1092, 47.1708], locationPrecision: 1, referenceOffset: 0.2,
    identifiers: ids('17402', [{ type: 'ID GeODin-Shortname', codes: [{ code: '6SUR23K002' }] }]),
  },
]

export const boreholes: Borehole[] = [
  ...figmaBoreholes.map((borehole, index) => {
    const [purpose, access, boreholeType, workflow] = FIGMA_VALUES[index]
    return { ...borehole, purpose, access, boreholeType, workflow }
  }),
  ...SURSEE,
  ...generateBoreholes(),
]

const byId = new Map(boreholes.map((borehole) => [borehole.id, borehole]))

export function getBorehole(id: string | undefined) {
  return id ? byId.get(id) : undefined
}

/** Nächste Ortschaft bestimmt Gemeinde, Kanton und Terrainhöhe */
export function nearestPlace(lon: number, lat: number) {
  const distance = (place: (typeof PLACES)[number]) => Math.hypot((place.lon - lon) * Math.cos((lat * Math.PI) / 180), place.lat - lat)
  return PLACES.reduce((best, place) => (distance(place) < distance(best) ? place : best))
}

export type { Canton }

/** WGS84 → LV95 nach den Näherungsformeln von swisstopo (Genauigkeit rund 1 m) */
export function wgs84ToLv95(lon: number, lat: number) {
  const phi = (lat * 3600 - 169028.66) / 10000
  const lambda = (lon * 3600 - 26782.5) / 10000
  const east = 2600072.37 + 211455.93 * lambda - 10938.51 * lambda * phi - 0.36 * lambda * phi ** 2 - 44.54 * lambda ** 3
  const north = 1200147.07 + 308807.95 * phi + 3745.25 * lambda ** 2 + 76.63 * phi ** 2 - 194.56 * lambda ** 2 * phi + 119.79 * phi ** 3
  return { east, north }
}

/** Schweizer Tausendertrennung wie in Figma: 2’645’123 */
export function formatSwissNumber(value: number, decimals = 0) {
  const [integer, fraction] = value.toFixed(decimals).split('.')
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '’')
  return fraction ? `${grouped}.${fraction}` : grouped
}

/** Kleine, stabile Abweichung pro Bohrung, damit benachbarte Bohrungen nicht dieselbe Höhe haben */
export function stableOffset(id: string, range: number) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) % 1000
  return (hash / 1000) * range
}
