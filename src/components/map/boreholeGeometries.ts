import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat, toLonLat } from 'ol/proj'
import type { Coordinate } from 'ol/coordinate'
import { boreholes, getBorehole, type Borehole } from '../../data/boreholes'
import { FIGMA_MAP_CENTER_PX, INITIAL_CENTER, INITIAL_RESOLUTION } from './geometries'
import { BADGE_FONT, BADGE_HALF_HEIGHT, clusterStyle } from './boreholeStyles'

/*
 * Das Kartenbild im Boreholes-Screen (Figma 7558:31771) ist ein anderer Screenshot als bei Assets.
 * Per Bildvergleich (26 Ausschnitte, Abweichung 0.2px) eingemessen: Boreholes-Pixel = 0.9751 × Assets-Pixel
 * + (279.6, 71.8). Ein Figma-Pixel entspricht hier also 16.2 / 0.9751 m, und der Assets-Bezugspunkt
 * (490, 556) liegt im Boreholes-Screen bei (757.4, 614.0).
 */
const SCALE = 0.9751
export const BOREHOLES_RESOLUTION = INITIAL_RESOLUTION / SCALE
const REFERENCE_PX: Coordinate = [SCALE * FIGMA_MAP_CENTER_PX[0] + 279.6, SCALE * FIGMA_MAP_CENTER_PX[1] + 71.8]

function px([x, y]: Coordinate): Coordinate {
  return [INITIAL_CENTER[0] + (x - REFERENCE_PX[0]) * BOREHOLES_RESOLUTION, INITIAL_CENTER[1] - (y - REFERENCE_PX[1]) * BOREHOLES_RESOLUTION]
}

/** Kartenmitte beim Start: Mitte des Kartenbereichs rechts der Sidebar (x 80–1440, y 88–1024) */
export const BOREHOLES_CENTER = px([760, 556])

/**
 * Wie in der Live-App: Ab etwas weiter herausgezoomt als die Startansicht (16.6 m/px) nur noch Badges,
 * damit die Karte performant bleibt. Abstand der Badges 48px, Klick zoomt hinein.
 */
export const BOREHOLE_CLUSTERS = { resolution: 20, distance: 48, style: clusterStyle, halfHeight: BADGE_HALF_HEIGHT }

/** Figma-Bohrungen über ihre Pixelposition, erzeugte Bohrungen über ihre WGS84-Lage */
function location(borehole: Borehole) {
  return borehole.figma ? px(borehole.figma) : fromLonLat(borehole.lonLat!)
}

/**
 * Ein Objekt pro Bohrung. Bohrungen am exakt gleichen Standort teilen sich ein Badge mit der Anzahl:
 * Alle kennen die Gruppe (members), nur die erste (leader) zeichnet das Badge, die übrigen sind nur trefferbar.
 */
export function createBoreholeFeatures() {
  const byLocation = new Map<string, Feature[]>()
  const features = boreholes.map((borehole) => {
    const coordinate = location(borehole)
    const feature = new Feature({ geometry: new Point(coordinate) })
    feature.setId(borehole.id)
    const key = coordinate.join(',')
    byLocation.set(key, [...(byLocation.get(key) ?? []), feature])
    return feature
  })
  const leaders: Feature[] = []
  for (const members of byLocation.values()) {
    if (members.length < 2) continue
    members.forEach((feature, index) => feature.setProperties({ members, leader: index === 0, halfHeight: BADGE_HALF_HEIGHT }, true))
    leaders.push(members[0])
  }
  // Die Zahl im Badge braucht Inter Bold auf dem Canvas: nach dem Laden neu zeichnen
  document.fonts?.load(BADGE_FONT).then(() => leaders.forEach((feature) => feature.changed()))
  return features
}

/** Lage einer Bohrung in Web-Mercator */
export function boreholeCoordinate(id: string) {
  const borehole = getBorehole(id)
  return borehole ? location(borehole) : BOREHOLES_CENTER
}

/** Lage einer Bohrung in WGS84 [Länge, Breite] */
export function boreholeLonLat(id: string) {
  return toLonLat(boreholeCoordinate(id))
}
