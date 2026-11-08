// Erzeugte Assets für die Assets-Karte: rund 25 zusätzliche in der Region Sursee (Startausschnitt) und rund 150
// in der ganzen Schweiz, dazu die Geometrien aller Assets in WGS84. Fester Zufallsseed: bei jedem Laden gleich.
// Die Dokumente sind die echten PDFs aus public/pdfs (documents.ts); mehrere Assets können dasselbe enthalten.

import type { Asset, AssetLanguage, Kind, Topic } from './assets'
import type { AssetFile } from './files'
import { fileFromDocument, type DocumentKey } from './documents'
import { LAKES, PLACES, START_VIEW, type Canton, type Place } from './swissPlaces'

export type GeometryKind = 'area' | 'line' | 'point' | 'pin'
type LonLat = [number, number]
/** Geometrie eines Assets; alle Geometrien desselben Assets werden gemeinsam ausgewählt */
export type GeometrySpec = { id: string; assetId: string; kind: GeometryKind; coordinates: LonLat | LonLat[] }

/* Zufall (mulberry32) und Hilfen */
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
const rand = random(20261108)
const pick = <T,>(items: readonly T[]) => items[Math.floor(rand() * items.length)]
const between = (min: number, max: number) => min + rand() * (max - min)
const int = (min: number, max: number) => Math.floor(between(min, max + 1))
const gaussian = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())

const M_PER_DEG = 111_320
/** Punkt in Metern Abstand (Ost, Nord) von einem Zentrum */
function offset([lon, lat]: LonLat, east: number, north: number): LonLat {
  return [lon + east / (M_PER_DEG * Math.cos((lat * Math.PI) / 180)), lat + north / M_PER_DEG]
}

/** Seen (Kreise in km), dazu der Sempachersee und Mauensee genauer als in swissPlaces */
const WATER: [number, number, number][] = [...LAKES, [47.163, 8.135, 1.0], [47.148, 8.153, 1.5], [47.13, 8.178, 1.4], [47.116, 8.198, 0.9], [47.168, 8.067, 0.35]]
function inWater([lon, lat]: LonLat) {
  return WATER.some(([wLat, wLon, radius]) => Math.hypot((lat - wLat) * 111.32, (lon - wLon) * 111.32 * Math.cos((lat * Math.PI) / 180)) < radius + 0.15)
}

/* Geometrien */
function area(center: LonLat, radius: number): LonLat[] {
  const count = int(4, 7)
  const start = rand() * Math.PI * 2
  return Array.from({ length: count }, (_, index) => {
    const angle = start + (index / count) * Math.PI * 2 + between(-0.3, 0.3)
    const r = radius * between(0.55, 1)
    return offset(center, Math.cos(angle) * r * between(0.8, 1.3), Math.sin(angle) * r)
  })
}

function line(center: LonLat, length: number): LonLat[] {
  const count = int(3, 5)
  let heading = rand() * Math.PI
  const step = length / (count - 1)
  let point = offset(center, (-Math.cos(heading) * length) / 2, (-Math.sin(heading) * length) / 2)
  const points = [point]
  for (let index = 1; index < count; index++) {
    heading += between(-0.35, 0.35)
    point = offset(point, Math.cos(heading) * step, Math.sin(heading) * step)
    points.push(point)
  }
  return points
}

function pointsAround(center: LonLat, radius: number, count: number): LonLat[] {
  return Array.from({ length: count }, () => {
    const angle = rand() * Math.PI * 2
    const r = Math.sqrt(rand()) * radius
    return offset(center, Math.cos(angle) * r, Math.sin(angle) * r)
  })
}

/* Sprache nach Region */
type Region = 'de' | 'fr' | 'it'
function regionOf(canton: Canton, lon: number): Region {
  if (canton === 'TI') return 'it'
  if (['GE', 'VD', 'NE', 'JU'].includes(canton)) return 'fr'
  if ((canton === 'FR' || canton === 'VS') && lon < 7.35) return 'fr'
  return 'de'
}

const CANTON_NAMES: Record<Canton, string> = {
  AG: 'Aargau', AR: 'Appenzell Ausserrhoden', BE: 'Bern', BL: 'Basel-Landschaft', BS: 'Basel-Stadt', FR: 'Freiburg', GE: 'Genève', GL: 'Glarus',
  GR: 'Graubünden', JU: 'Jura', LU: 'Luzern', NE: 'Neuchâtel', SG: 'St. Gallen', SH: 'Schaffhausen', SO: 'Solothurn', SZ: 'Schwyz', TG: 'Thurgau',
  TI: 'Ticino', UR: 'Uri', VD: 'Vaud', VS: 'Wallis', ZG: 'Zug', ZH: 'Zürich',
}

const FLUR: Record<Region, string[]> = {
  de: ['Moos', 'Chotten', 'Allmend', 'Breite', 'Hofmatt', 'Grossmatt', 'Rüti', 'Bünt', 'Hinterdorf', 'Feldmatt', 'Ried', 'Sonnmatt', 'Neuhof', 'Langacher', 'Eichholz', 'Bifang', 'Wydenmatt', 'Steinacher', 'Schachen', 'Tannenhof', 'Unterfeld', 'Oberfeld', 'Hubel', 'Weiher', 'Mühlematt', 'Kirchfeld', 'Gerbematt', 'Bahnhofareal', 'Industrie Nord', 'Schützenmatt'],
  fr: ['Les Prés', 'En Champs', 'La Combe', 'Le Verger', 'Les Plantaz', 'En Bassenges', 'La Fin du Bois', 'Champ du Moulin', 'Les Longs Prés', 'Sous-Gare', 'La Croix', 'Le Pré-Neuf', 'Les Iles', 'En Budron'],
  it: ['Campagna', 'Pian Scairolo', 'Ronco', 'Ai Grotti', 'Prato Grande', 'Boscioro', 'Gerra', 'Cà Rossa', 'Ai Mulini', 'Piano', 'Sotto Chiesa', 'Al Ponte'],
}
const AUTHORS: Record<Region, string[]> = {
  de: ['M. Brunner', 'R. Keller', 'S. Huber', 'A. Meier', 'T. Gerber', 'C. Schmid', 'P. Baumann', 'L. Wyss', 'D. Frei', 'K. Graf', 'J. Steiner', 'N. Moser', 'U. Zimmermann', 'B. Kunz'],
  fr: ['J. Rochat', 'M. Perret', 'A. Favre', 'C. Bovet', 'L. Monnier', 'P. Rossier', 'S. Jaquier'],
  it: ['L. Bernasconi', 'G. Cattaneo', 'M. Rossi', 'S. Ferrari', 'A. Pedrazzini', 'F. Bianchi'],
}
const SUPPLIERS: Record<Region, string[]> = {
  de: ['Geologisches Büro Wyss AG', 'Baugrund Mittelland AG', 'Geotechnik Schmid & Partner AG', 'Hydrogeologie Graf GmbH', 'Kunz Geologie AG', 'Steiner + Moser Geotechnik AG'],
  fr: ['Géotechnique Rochat SA', 'Bureau géologique Perret Sàrl', 'Hydrogéo Conseils SA', 'Favre Géologie SA'],
  it: ['Studio geologico Bernasconi SA', 'Geotecnica Ticino SA', 'Pedrazzini Geologia SA'],
}
const ROADS = ['N1', 'N2', 'N3', 'N4', 'N9', 'N12', 'N13', 'N14', 'N16']

type Template = {
  shape: 'site' | 'route' | 'wells' | 'zone' | 'boreholes' | 'tunnel'
  topics: Topic[]
  kinds: Kind[]
  docs: DocumentKey[]
  title: Record<Region, (place: string, flur: string, other: string) => string>
  initiator: 'municipality' | 'canton' | 'astra' | 'sbb' | 'private'
}

const TEMPLATES: Template[] = [
  {
    shape: 'site', topics: ['geotechnics', 'borehole'], kinds: ['boreholeProfile', 'report'], docs: ['4841', '16622', '14366'], initiator: 'private',
    title: { de: (p, f) => `${p}, Baugrunduntersuchung Überbauung ${f}`, fr: (p, f) => `${p}, étude géotechnique du lotissement ${f}`, it: (p, f) => `${p}, indagine geotecnica comparto ${f}` },
  },
  {
    shape: 'site', topics: ['geotechnics'], kinds: ['report'], docs: ['4841', '16623'], initiator: 'municipality',
    title: { de: (p, f) => `${p}, Baugrund Schulhaus ${f}`, fr: (p, f) => `${p}, sol de fondation école ${f}`, it: (p, f) => `${p}, terreno di fondazione scuola ${f}` },
  },
  {
    shape: 'route', topics: ['geotechnics', 'borehole'], kinds: ['boreholeProfile', 'measurements'], docs: ['8768', '4841', '14366'], initiator: 'canton',
    title: { de: (p) => `Kantonsstrasse K ${int(2, 60)}, ${p}: Sondierungen für den Strassenausbau`, fr: (p) => `Route cantonale RC ${int(100, 800)}, ${p} : sondages pour l’élargissement`, it: (p) => `Strada cantonale, ${p}: sondaggi per l’allargamento` },
  },
  {
    shape: 'route', topics: ['geotechnics', 'borehole'], kinds: ['boreholeProfile', 'report'], docs: ['4841', '8768', '16623'], initiator: 'astra',
    title: { de: (p, _f, o) => `${pick(ROADS)}, Baugrunduntersuchungen Abschnitt ${p} – ${o}`, fr: (p, _f, o) => `${pick(ROADS)}, sondages tronçon ${p} – ${o}`, it: (p, _f, o) => `A2, sondaggi tratta ${p} – ${o}` },
  },
  {
    shape: 'route', topics: ['geotechnics', 'borehole'], kinds: ['boreholeProfile', 'measurements'], docs: ['14366', '8768'], initiator: 'sbb',
    title: { de: (p) => `SBB ${p}, Sondierungen für den Bahnhofausbau`, fr: (p) => `CFF ${p}, sondages pour l’agrandissement de la gare`, it: (p) => `FFS ${p}, sondaggi per l’ampliamento della stazione` },
  },
  {
    shape: 'wells', topics: ['hydrogeology', 'borehole'], kinds: ['measurements', 'report'], docs: ['8768', '16622'], initiator: 'municipality',
    title: { de: (p, f) => `${p}, Grundwasserfassung ${f} – Pumpversuch`, fr: (p, f) => `${p}, captage d’eau souterraine ${f} – essai de pompage`, it: (p, f) => `${p}, captazione d’acqua sotterranea ${f} – prova di pompaggio` },
  },
  {
    shape: 'zone', topics: ['hydrogeology'], kinds: ['geologicalMap', 'report'], docs: ['8768', '4841'], initiator: 'municipality',
    title: { de: (p, f) => `${p}, Grundwasserschutzzone ${f}`, fr: (p, f) => `${p}, zone de protection des eaux ${f}`, it: (p, f) => `${p}, zona di protezione delle acque ${f}` },
  },
  {
    shape: 'boreholes', topics: ['borehole', 'hydrogeology'], kinds: ['boreholeProfile'], docs: ['16623', '16622', '14366'], initiator: 'private',
    title: { de: (p, f) => `${p}, Erdwärmesonden ${f}`, fr: (p, f) => `${p}, sondes géothermiques ${f}`, it: (p, f) => `${p}, sonde geotermiche ${f}` },
  },
  {
    shape: 'zone', topics: ['naturalHazards', 'geotechnics'], kinds: ['report', 'geologicalMap'], docs: ['GBD-22', '4841'], initiator: 'canton',
    title: { de: (p, f) => `${p}, Rutschung ${f} – geologische Beurteilung`, fr: (p, f) => `${p}, glissement de terrain ${f} – expertise géologique`, it: (p, f) => `${p}, frana ${f} – perizia geologica` },
  },
  {
    shape: 'site', topics: ['mineralResources', 'borehole'], kinds: ['boreholeProfile', 'labAnalysis'], docs: ['16623', '16622', '14366'], initiator: 'private',
    title: { de: (p, f) => `${p}, Kiesabbau ${f} – Sondierbohrungen`, fr: (p, f) => `${p}, gravière ${f} – sondages de reconnaissance`, it: (p, f) => `${p}, cava di ghiaia ${f} – sondaggi` },
  },
  {
    shape: 'route', topics: ['geophysics'], kinds: ['measurements'], docs: ['BLGD-12', '8768'], initiator: 'canton',
    title: { de: (p, f) => `${p}, Geophysikalische Untersuchungen ${f}`, fr: (p, f) => `${p}, prospection géophysique ${f}`, it: (p, f) => `${p}, indagini geofisiche ${f}` },
  },
  {
    shape: 'tunnel', topics: ['geotechnics', 'hydrogeology', 'crossSection'], kinds: ['report', 'crossSection'], docs: ['BLGD-12', 'GBD-22'], initiator: 'canton',
    title: { de: (p, f) => `Umfahrung ${p}, Tunnel ${f}: geologischer Bericht und Prognoseprofil`, fr: (p, f) => `Contournement de ${p}, tunnel ${f} : rapport géologique`, it: (p, f) => `Circonvallazione di ${p}, galleria ${f}: rapporto geologico` },
  },
]

function initiatorName(kind: Template['initiator'], region: Region, place: string, canton: Canton) {
  switch (kind) {
    case 'municipality':
      return region === 'fr' ? `Commune de ${place}` : region === 'it' ? `Comune di ${place}` : `Gemeinde ${place}`
    case 'canton':
      return region === 'fr' ? `État de ${CANTON_NAMES[canton]}, service des routes` : region === 'it' ? 'Cantone Ticino, Divisione delle costruzioni' : `Kanton ${CANTON_NAMES[canton]}, Tiefbauamt`
    case 'astra':
      return region === 'fr' ? 'Office fédéral des routes OFROU' : region === 'it' ? 'Ufficio federale delle strade USTRA' : 'Bundesamt für Strassen ASTRA'
    case 'sbb':
      return region === 'fr' ? 'CFF Infrastructure' : region === 'it' ? 'FFS Infrastruttura' : 'SBB Infrastruktur'
    default:
      return pick(SUPPLIERS[region]).replace(/ (AG|SA|GmbH|Sàrl)$/, '') + ' Immobilien'
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
function date(year: number) {
  return `${pad(int(1, 28))}.${pad(int(1, 12))}.${year}`
}

/* Orte der Region Sursee (Startausschnitt) für Titel */
const SURSEE_PLACES: { name: string; at: LonLat }[] = [
  ['Sursee', 8.106, 47.171], ['Oberkirch', 8.117, 47.156], ['Schenkon', 8.135, 47.174], ['Geuensee', 8.106, 47.199], ['Knutwil', 8.073, 47.199],
  ['Mauensee', 8.067, 47.168], ['Büron', 8.093, 47.212], ['Triengen', 8.078, 47.234], ['Nottwil', 8.137, 47.135], ['Eich', 8.168, 47.152],
  ['Sempach', 8.191, 47.135], ['Neuenkirch', 8.204, 47.099], ['Beromünster', 8.193, 47.206], ['Rickenbach', 8.154, 47.218], ['Gunzwil', 8.173, 47.211],
  ['Neudorf', 8.207, 47.177], ['Wauwil', 8.022, 47.186], ['Kottwil', 8.045, 47.164], ['Ettiswil', 8.018, 47.15], ['Buttisholz', 8.092, 47.115],
  ['Grosswangen', 8.051, 47.132], ['Wilihof', 8.059, 47.226], ['Winikon', 8.135, 47.238],
].map(([name, lon, lat]) => ({ name: name as string, at: [lon as number, lat as number] as LonLat }))

function nearestSurseePlace([lon, lat]: LonLat) {
  return SURSEE_PLACES.reduce((best, place) => (Math.hypot(place.at[0] - lon, place.at[1] - lat) < Math.hypot(best.at[0] - lon, best.at[1] - lat) ? place : best))
}

/** Von Hand gesetzte Geometrien der bestehenden Assets: Sursee-Region und echte Lage der neuen Dokumente */
const HAND_GEOMETRIES: GeometrySpec[] = []
function addHand(assetId: string, kind: GeometryKind, coordinates: LonLat | LonLat[]) {
  HAND_GEOMETRIES.push({ id: `${assetId}-${HAND_GEOMETRIES.filter((g) => g.assetId === assetId).length + 1}`, assetId, kind, coordinates })
}
// 4841: Sursee, Fläche mit Bohrpunkt (Startasset wie im Figma-Screen)
addHand('4841', 'area', [[8.0945, 47.1795], [8.1135, 47.1835], [8.1215, 47.1745], [8.1105, 47.1665], [8.0965, 47.1705]])
addHand('4841', 'point', [8.1062, 47.1768])
// 8768: Knutwil, Fläche, Leitung und Piezometer
addHand('8768', 'area', [[8.061, 47.2055], [8.0745, 47.2085], [8.0815, 47.2005], [8.0675, 47.1955]])
addHand('8768', 'line', [[8.0545, 47.1935], [8.0625, 47.1965], [8.0735, 47.1968], [8.0835, 47.1945]])
addHand('8768', 'point', [8.0715, 47.2015])
// 16623: Geuensee, Fläche, zwei Bohrungen und Markierung
addHand('16623', 'area', [[8.0985, 47.2065], [8.1135, 47.2095], [8.1185, 47.2005], [8.1035, 47.1965]])
addHand('16623', 'point', [8.1055, 47.2035])
addHand('16623', 'point', [8.1095, 47.2015])
addHand('16623', 'pin', [8.1075, 47.2052])
// 16622: Mauensee/Kottwil, Fläche, Bohrung und Markierung
addHand('16622', 'area', [[8.0445, 47.1585], [8.0575, 47.1615], [8.0605, 47.1535], [8.0475, 47.1505]])
addHand('16622', 'point', [8.0525, 47.1565])
addHand('16622', 'pin', [8.0545, 47.1585])
// 24518: Schenkon, Zellfeld (ohne Dateien)
addHand('24518', 'point', [8.1395, 47.1795])
// 14366: Bahnanlage Tecknau (BL), Strecke Basel – Olten km 26.2 – 27.4 mit Sondierungen
addHand('14366', 'line', [[7.8775, 47.4565], [7.8845, 47.4535], [7.8915, 47.4495], [7.8985, 47.4455]])
addHand('14366', 'point', [7.8838, 47.4541])
addHand('14366', 'point', [7.8902, 47.4503])
addHand('14366', 'point', [7.8957, 47.4472])
// 41205: Ceneri-Basistunnel (TI), Vigana – Vezia mit Zwischenangriff Sigirino
addHand('41205', 'line', [[8.993, 46.176], [8.968, 46.135], [8.944, 46.098], [8.93, 46.06], [8.936, 46.025]])
addHand('41205', 'area', [[8.928, 46.088], [8.944, 46.092], [8.948, 46.082], [8.933, 46.078]])
// 19873: Lötschberg-Basistunnel (BE/VS), Frutigen – Raron
addHand('19873', 'line', [[7.648, 46.586], [7.66, 46.515], [7.692, 46.448], [7.74, 46.378], [7.79, 46.312]])
addHand('19873', 'point', [7.676, 46.49])
addHand('19873', 'point', [7.716, 46.414])

type Generated = { asset: Asset; files: AssetFile[]; geometries: GeometrySpec[] }

let nextId = 30011
/** Ein Asset mit Titel, Metadaten, Dateien und Geometrien an einer Stelle */
function makeAsset(at: LonLat, place: string, other: string, canton: Canton, region: Region, options: { template?: Template; mainDoc?: DocumentKey; legal?: boolean; scale?: number }): Generated {
  const template = options.template ?? pick(TEMPLATES)
  const id = String(nextId)
  nextId += int(3, 41)
  const flur = pick(FLUR[region])
  const title = template.title[region](place, flur, other)
  const created = int(1962, 2025)
  const createdDate = date(created)
  const receivedDate = date(Math.min(2026, created + (rand() < 0.8 ? 0 : 1)))
  const language: AssetLanguage = region
  const nationalInterest = template.initiator === 'astra' || template.initiator === 'sbb' || template.shape === 'tunnel'
  const asset: Asset = {
    id,
    title,
    status: 'reviewed',
    restriction: 'public',
    topics: template.topics,
    kinds: template.kinds,
    languages: rand() < 0.15 ? [language, region === 'de' ? 'fr' : 'de'] : [language],
    originalTitle: title,
    dates: { created: createdDate, received: receivedDate },
    nationalInterest: { value: nationalInterest, reasons: nationalInterest ? (rand() < 0.5 ? ['federalParticipation', 'nationalImpact'] : ['federalParticipation']) : [] },
    contacts: [
      { role: 'author', names: rand() < 0.3 ? [pick(AUTHORS[region]), pick(AUTHORS[region])].filter((n, i, all) => all.indexOf(n) === i) : [pick(AUTHORS[region])] },
      { role: 'initiator', names: [initiatorName(template.initiator, region, place, canton)] },
      { role: 'supplier', names: [pick(SUPPLIERS[region])] },
    ],
    alternativeIds: rand() < 0.5 ? [{ id: `${int(1, 99)}/${int(1, 40)}`, description: { de: 'Original-ID aus InfoGeol', en: 'Original ID from InfoGeol' } }] : [],
    references: [],
  }

  // Dateien: Hauptdokument, manchmal ein zweites, eine CSV-Tabelle oder eine rechtliche Einwilligung
  const docs: DocumentKey[] = [options.mainDoc ?? pick(template.docs)]
  if (rand() < 0.3) {
    const second = pick(['4841', '8768', '16623', '16622', '14366', 'BLGD-12', 'GBD-22'] as DocumentKey[])
    if (!docs.includes(second)) docs.push(second)
  }
  if (rand() < 0.12) docs.push('a56-55-csv')
  const uploaded = () => `${date(int(2022, 2026))} ${pad(int(7, 18))}:${pad(int(0, 59))}`
  const files = docs.map((key, index) => fileFromDocument(key, { id: `${id}-${index + 1}`, assetId: id, uploaded: uploaded() }))
  if (options.legal ?? rand() < 0.15) files.push(fileFromDocument('12304', { id: `${id}-legal`, assetId: id, uploaded: uploaded(), legal: true }))

  // Geometrien je nach Art; scale vergrössert in der Übersicht der Schweiz leicht
  const s = options.scale ?? 1
  const geometries: GeometrySpec[] = []
  const add = (kind: GeometryKind, coordinates: LonLat | LonLat[]) => geometries.push({ id: `${id}-${geometries.length + 1}`, assetId: id, kind, coordinates })
  switch (template.shape) {
    case 'site': {
      const radius = between(180, 650) * s
      add('area', area(at, radius))
      pointsAround(at, radius * 0.7, int(1, 4)).forEach((p) => add('point', p))
      break
    }
    case 'route': {
      add('line', line(at, between(900, 3200) * s))
      pointsAround(at, 500 * s, int(0, 3)).forEach((p) => add('point', p))
      break
    }
    case 'wells': {
      add('area', area(at, between(120, 300) * s))
      pointsAround(at, 250 * s, int(1, 3)).forEach((p) => add('point', p))
      if (rand() < 0.4) add('pin', offset(at, between(-150, 150), between(-150, 150)))
      break
    }
    case 'zone':
      add('area', area(at, between(350, 1100) * s))
      break
    case 'boreholes':
      pointsAround(at, between(120, 400) * s, int(1, 5)).forEach((p) => add('point', p))
      break
    case 'tunnel': {
      add('line', line(at, between(1500, 4000) * s))
      add('area', area(at, between(200, 400) * s))
      break
    }
  }
  return { asset, files, geometries }
}

const generated: Generated[] = []

// Region Sursee: ~25 Assets, verteilt über den Startausschnitt, nicht im See und mit etwas Abstand zueinander.
// Die ersten Assets enthalten der Reihe nach jedes Dokument, damit alle Dokumente bei Sursee vorkommen.
const SURSEE_DOCS: DocumentKey[] = ['14366', 'BLGD-12', 'GBD-22', '8768', '16623', '16622', '4841']
const taken: LonLat[] = HAND_GEOMETRIES.filter((g) => !Array.isArray(g.coordinates[0])).map((g) => g.coordinates as LonLat)
for (let index = 0; index < 25; index++) {
  let at: LonLat = [8.1, 47.17]
  for (let attempt = 0; attempt < 60; attempt++) {
    at = [between(7.99, 8.24), between(47.105, 47.245)]
    const clear = taken.every(([lon, lat]) => Math.hypot((lon - at[0]) * 75, (lat - at[1]) * 111) > 1.3)
    if (!inWater(at) && clear) break
  }
  taken.push(at)
  const near = nearestSurseePlace(at)
  const mainDoc = index < SURSEE_DOCS.length ? SURSEE_DOCS[index] : undefined
  const template = mainDoc ? (TEMPLATES.find((t) => t.docs.includes(mainDoc)) ?? pick(TEMPLATES)) : undefined
  generated.push(makeAsset(at, near.name, pick(SURSEE_PLACES).name, 'LU', 'de', { template, mainDoc, legal: index === 3 ? true : undefined }))
}

// Ganze Schweiz: ~150 Assets, gewichtet nach den Ortschaften (dichter im Mittelland), ausserhalb des Startausschnitts
const weighted = PLACES.filter((place) => place.count > 0)
const totalWeight = weighted.reduce((sum, place) => sum + Math.sqrt(place.count), 0)
function weightedPlace(): Place {
  let value = rand() * totalWeight
  for (const place of weighted) {
    value -= Math.sqrt(place.count)
    if (value <= 0) return place
  }
  return weighted[weighted.length - 1]
}
for (let index = 0; index < 150; index++) {
  const place = weightedPlace()
  let at: LonLat = [place.lon, place.lat]
  for (let attempt = 0; attempt < 30; attempt++) {
    at = offset([place.lon, place.lat], gaussian() * place.spread * 700, gaussian() * place.spread * 700)
    const inStart = at[0] > START_VIEW.west && at[0] < START_VIEW.east && at[1] > START_VIEW.south && at[1] < START_VIEW.north
    if (!inWater(at) && !inStart) break
  }
  const region = regionOf(place.canton, place.lon)
  const name = place.name.replace(/ \(.*\)$/, '')
  const other = pick(weighted.filter((p) => p.canton === place.canton && p !== place)) ?? place
  generated.push(makeAsset(at, name, other.name.replace(/ \(.*\)$/, ''), place.canton, region, { scale: 1.3 }))
}

// Querverweise: rund jedes fünfte Asset verweist auf ein anderes in der Nähe
generated.forEach(({ asset, geometries }, index) => {
  if (index % 5 !== 2) return
  const center = geometries[0].coordinates
  const here = (Array.isArray(center[0]) ? (center as LonLat[])[0] : center) as LonLat
  const neighbour = generated
    .filter((other) => other !== generated[index])
    .map((other) => {
      const c = other.geometries[0].coordinates
      const p = (Array.isArray(c[0]) ? (c as LonLat[])[0] : c) as LonLat
      return { other, distance: Math.hypot(p[0] - here[0], p[1] - here[1]) }
    })
    .sort((a, b) => a.distance - b.distance)[0]
  if (neighbour) asset.references.push({ label: neighbour.other.asset.title, assetId: neighbour.other.asset.id })
})

export const generatedAssets: Asset[] = generated.map((entry) => entry.asset)
export const generatedFiles: AssetFile[] = generated.flatMap((entry) => entry.files)
/** Alle Geometrien der Assets-Karte: von Hand gesetzte und erzeugte */
export const assetGeometries: GeometrySpec[] = [...HAND_GEOMETRIES, ...generated.flatMap((entry) => entry.geometries)]
