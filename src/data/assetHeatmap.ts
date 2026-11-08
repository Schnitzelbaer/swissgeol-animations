// Punkte für die Heatmap der Assets-Karte (herausgezoomt). Die Heatmap steht für alle rund 23'000 Assets der
// Live-App, nicht nur für die erzeugten: dicht entlang der Verkehrsachsen (Strassen- und Bahnprojekte) und um die
// Städte, dünn über dem übrigen Land, wie in der Live-App. Fester Zufallsseed: bei jedem Laden gleich.

import { LAKES, PLACES } from './swissPlaces'
import { assetGeometries } from './generatedAssets'

type LonLat = [number, number]
export type HeatPoint = { at: LonLat; weight: number }

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
const rand = random(23000)
const gaussian = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand())
const KM_PER_DEG = 111.32
function offsetKm([lon, lat]: LonLat, east: number, north: number): LonLat {
  return [lon + east / (KM_PER_DEG * Math.cos((lat * Math.PI) / 180)), lat + north / KM_PER_DEG]
}

/** Landesgrenze, grob (WGS84, im Uhrzeigersinn ab Basel); reicht für die weiche Heatmap */
const BORDER: LonLat[] = [
  [7.59, 47.58], [7.79, 47.55], [8.23, 47.6], [8.42, 47.57], [8.5, 47.6], [8.58, 47.79], [8.82, 47.71], [8.87, 47.66],
  [9.18, 47.66], [9.38, 47.57], [9.5, 47.48], [9.65, 47.45], [9.56, 47.3], [9.49, 47.17], [9.52, 47.06], [9.62, 47.05],
  [9.88, 47.0], [10.12, 46.92], [10.48, 46.86], [10.46, 46.62], [10.3, 46.55], [10.12, 46.4], [10.06, 46.23],
  [9.95, 46.36], [9.72, 46.3], [9.5, 46.32], [9.42, 46.48], [9.27, 46.42], [9.2, 46.2], [9.06, 46.08], [9.04, 45.84],
  [8.92, 45.86], [8.86, 45.97], [8.73, 46.1], [8.6, 46.15], [8.45, 46.24], [8.44, 46.44], [8.3, 46.41], [8.14, 46.2],
  [7.98, 46.0], [7.86, 45.92], [7.66, 45.98], [7.17, 45.87], [7.04, 45.93], [6.82, 46.13], [6.8, 46.39], [6.5, 46.45],
  [6.3, 46.37], [6.22, 46.31], [6.1, 46.15], [5.96, 46.13], [5.97, 46.21], [6.13, 46.36], [6.11, 46.57], [6.38, 46.73],
  [6.46, 46.91], [6.7, 47.03], [6.82, 47.13], [7.0, 47.3], [6.9, 47.38], [7.0, 47.5], [7.2, 47.49], [7.45, 47.47],
]

function inSwitzerland([lon, lat]: LonLat) {
  let inside = false
  for (let i = 0, j = BORDER.length - 1; i < BORDER.length; j = i++) {
    const [xi, yi] = BORDER[i]
    const [xj, yj] = BORDER[j]
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function inLake([lon, lat]: LonLat) {
  return LAKES.some(([wLat, wLon, radius]) => Math.hypot((lat - wLat) * KM_PER_DEG, (lon - wLon) * KM_PER_DEG * Math.cos((lat * Math.PI) / 180)) < radius)
}

const usable = (point: LonLat) => inSwitzerland(point) && !inLake(point)

/** Hauptachsen von Strasse und Bahn (Orte als Stützpunkte); entlang dieser Linien liegen viele Projekte */
const CORRIDORS: LonLat[][] = [
  // Genf – Lausanne – Yverdon – Neuenburg – Biel – Solothurn – Olten – Aarau – Zürich – Winterthur – St. Gallen – St. Margrethen
  [[6.14, 46.2], [6.24, 46.38], [6.5, 46.51], [6.63, 46.52], [6.64, 46.78], [6.93, 46.99], [7.25, 47.14], [7.53, 47.21], [7.72, 47.29], [7.9, 47.35], [8.04, 47.39], [8.18, 47.39], [8.31, 47.47], [8.54, 47.38], [8.72, 47.5], [9.05, 47.46], [9.37, 47.42], [9.64, 47.45]],
  // Lausanne – Fribourg – Bern – Burgdorf – Langenthal – Olten
  [[6.63, 46.52], [6.92, 46.69], [7.16, 46.8], [7.45, 46.95], [7.63, 47.06], [7.79, 47.21], [7.9, 47.35]],
  // Basel – Liestal – Olten – Zofingen – Sursee – Luzern – Arth-Goldau – Altdorf – Gotthard – Bellinzona – Lugano – Chiasso
  [[7.59, 47.56], [7.73, 47.48], [7.9, 47.35], [7.95, 47.29], [8.11, 47.17], [8.31, 47.05], [8.55, 47.05], [8.61, 47.0], [8.64, 46.88], [8.59, 46.67], [8.61, 46.53], [8.97, 46.36], [9.02, 46.19], [8.95, 46.01], [9.03, 45.84]],
  // Basel – Rheinfelden – Baden – Zürich
  [[7.59, 47.56], [7.79, 47.55], [8.04, 47.5], [8.31, 47.47]],
  // Zürich – Zug – Luzern
  [[8.54, 47.38], [8.52, 47.17], [8.31, 47.05]],
  // Bern – Thun – Spiez – Frutigen – Lötschberg – Brig
  [[7.45, 46.95], [7.63, 46.76], [7.68, 46.69], [7.65, 46.59], [7.79, 46.42], [7.99, 46.32]],
  // Lausanne – Vevey – Montreux – Aigle – Martigny – Sion – Visp – Brig
  [[6.63, 46.52], [6.84, 46.46], [6.91, 46.43], [6.97, 46.32], [7.07, 46.1], [7.36, 46.23], [7.53, 46.29], [7.88, 46.29], [7.99, 46.32]],
  // Zürich – Rapperswil – Ziegelbrücke – Sargans – Landquart – Chur
  [[8.54, 47.38], [8.82, 47.23], [9.06, 47.13], [9.31, 47.12], [9.44, 47.05], [9.56, 46.97], [9.53, 46.85]],
  // St. Margrethen – Buchs – Sargans
  [[9.64, 47.45], [9.47, 47.17], [9.44, 47.05]],
  // Chur – Thusis – San Bernardino – Bellinzona
  [[9.53, 46.85], [9.44, 46.7], [9.19, 46.46], [9.12, 46.3], [9.02, 46.19]],
  // Zürich – Schaffhausen, Winterthur – Frauenfeld – Kreuzlingen
  [[8.54, 47.38], [8.56, 47.55], [8.63, 47.7]],
  [[8.72, 47.5], [8.9, 47.56], [9.17, 47.65]],
  // Biel – Moutier – Delémont – Basel, Delémont – Porrentruy
  [[7.25, 47.14], [7.37, 47.28], [7.34, 47.36], [7.5, 47.45], [7.59, 47.56]],
  [[7.34, 47.36], [7.08, 47.42]],
  // Neuenburg – La Chaux-de-Fonds
  [[6.93, 46.99], [6.83, 47.1]],
  // Thun – Interlaken – Brünig – Sarnen – Luzern
  [[7.63, 46.76], [7.86, 46.69], [8.14, 46.76], [8.25, 46.9], [8.31, 47.05]],
  // Bern – Langnau – Entlebuch – Luzern
  [[7.45, 46.95], [7.79, 46.94], [8.06, 46.99], [8.31, 47.05]],
  // Bulle – Fribourg, Bern – Murten – Payerne – Yverdon
  [[7.06, 46.62], [7.16, 46.8]],
  [[7.45, 46.95], [7.12, 46.93], [6.94, 46.82], [6.64, 46.78]],
  // Landquart – Davos, Chur – Engadin (St. Moritz – Zernez – Scuol)
  [[9.56, 46.97], [9.84, 46.8]],
  [[9.53, 46.85], [9.67, 46.6], [9.84, 46.5], [10.09, 46.7], [10.3, 46.8]],
  // Andermatt – Disentis – Ilanz – Chur
  [[8.59, 46.63], [8.85, 46.7], [9.2, 46.77], [9.53, 46.85]],
  // Bellinzona – Locarno
  [[9.02, 46.19], [8.79, 46.17]],
]

const points: HeatPoint[] = []

// Verkehrsachsen: Punkte gleichmässig entlang der Linie, quer dazu normalverteilt (meist rund 1 km, ein Teil breiter)
for (const corridor of CORRIDORS) {
  for (let index = 1; index < corridor.length; index++) {
    const [a, b] = [corridor[index - 1], corridor[index]]
    const lengthKm = Math.hypot((b[0] - a[0]) * KM_PER_DEG * Math.cos((a[1] * Math.PI) / 180), (b[1] - a[1]) * KM_PER_DEG)
    const count = Math.round(lengthKm * 4)
    for (let n = 0; n < count; n++) {
      const t = rand()
      const base: LonLat = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      const spread = rand() < 0.7 ? 1.2 : 4
      const point = offsetKm(base, gaussian() * spread, gaussian() * spread)
      if (usable(point)) points.push({ at: point, weight: 0.13 })
    }
  }
}

// Städte und Ortschaften: Anzahl nach Grösse, Streuung wie bei den Bohrungen
for (const place of PLACES) {
  const count = Math.round(place.count * 8)
  for (let n = 0; n < count; n++) {
    const point = offsetKm([place.lon, place.lat], gaussian() * place.spread * 1.4, gaussian() * place.spread * 1.4)
    if (usable(point)) points.push({ at: point, weight: 0.1 })
  }
}

// Umland der Ortschaften (Mittelland, Täler): breit gestreut, damit zwischen den Achsen eine Grundfläche entsteht
for (const place of PLACES) {
  const count = Math.round(place.count * 10 + 20)
  for (let n = 0; n < count; n++) {
    const point = offsetKm([place.lon, place.lat], gaussian() * (place.spread * 3 + 6), gaussian() * (place.spread * 3 + 6))
    if (usable(point)) points.push({ at: point, weight: 0.07 })
  }
}

// Übriges Land: gleichmässig dünn, damit die ganze Schweiz leicht eingefärbt ist
for (let n = 0; n < 24000; n++) {
  const point: LonLat = [5.95 + rand() * 4.55, 45.82 + rand() * 2.0]
  if (usable(point)) points.push({ at: point, weight: 0.09 })
}

// Die Geometrien der Assets im Prototyp selbst
for (const spec of assetGeometries) {
  const at = (Array.isArray(spec.coordinates[0]) ? (spec.coordinates as LonLat[])[0] : spec.coordinates) as LonLat
  points.push({ at, weight: 0.15 })
}

export const HEAT_POINTS: HeatPoint[] = points
