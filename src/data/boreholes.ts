// Bohrungen der Applikation «Boreholes». Position und Template-Typ wie im Figma-Screen 7558:31771,
// Namen und Werte sind erfunden, aber plausibel; Koordinaten und Gemeinde folgen aus der Lage auf der Karte.

import type { Lang } from '../i18n/messages'

export type TemplateType = 'general' | 'geothermal' | 'geotechnics' | 'hydrogeology'

export type BoreholeIdentifier = {
  type: string
  /** Mehrere Codes, z.B. InfoGeol-Nummern für Tiefenabschnitte */
  codes: { code: string; comment?: Record<Lang, string> }[]
}

export type Borehole = {
  id: string
  name: string
  type: TemplateType
  /** Mittelpunkt des Symbols im Figma-Screen «Desktop - 1» (Frame-Pixel) */
  figma: [number, number]
  /** Lagegenauigkeit in m */
  locationPrecision: number
  /** Ansatzhöhe über bzw. unter Terrain in m (Referenzhöhe = Terrainhöhe + Wert) */
  referenceOffset: number
  identifiers: BoreholeIdentifier[]
}

/** Positionen aus Figma: Instanz «BG» liegt bei (-239, -13), die Symbole sind 30×30 */
const at = (x: number, y: number): [number, number] => [-239 + x + 15, -13 + y + 15]

const depth = (from: number, to: number): Record<Lang, string> => ({ de: `von ${from} bis ${to}m`, en: `from ${from} to ${to} m` })

function ids(id: string, extra: BoreholeIdentifier[] = []): BoreholeIdentifier[] {
  return [{ type: 'ID boreholes.swissgeol.ch', codes: [{ code: id }] }, ...extra]
}

// Reihenfolge wie in Figma: spätere Symbole liegen oben
export const boreholes: Borehole[] = [
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

export function getBorehole(id: string | undefined) {
  return boreholes.find((borehole) => borehole.id === id)
}

/** Ortschaften im Kartenausschnitt (WGS84) mit typischer Terrainhöhe; die nächste bestimmt Gemeinde und Höhe */
const PLACES: { name: string; lat: number; lon: number; elevation: number }[] = [
  { name: 'Sursee', lat: 47.1713, lon: 8.1108, elevation: 506 },
  { name: 'Geuensee', lat: 47.1985, lon: 8.105, elevation: 512 },
  { name: 'Büron', lat: 47.2122, lon: 8.092, elevation: 514 },
  { name: 'Knutwil', lat: 47.1993, lon: 8.0735, elevation: 548 },
  { name: 'Schenkon', lat: 47.1744, lon: 8.133, elevation: 521 },
  { name: 'Oberkirch', lat: 47.1567, lon: 8.115, elevation: 518 },
  { name: 'Rickenbach (LU)', lat: 47.219, lon: 8.153, elevation: 664 },
  { name: 'Mauensee', lat: 47.169, lon: 8.067, elevation: 515 },
  { name: 'Triengen', lat: 47.235, lon: 8.078, elevation: 509 },
  { name: 'Beromünster', lat: 47.206, lon: 8.193, elevation: 646 },
]

export function nearestPlace(lon: number, lat: number) {
  const distance = (place: (typeof PLACES)[number]) => Math.hypot((place.lon - lon) * Math.cos((lat * Math.PI) / 180), place.lat - lat)
  return PLACES.reduce((best, place) => (distance(place) < distance(best) ? place : best))
}

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
