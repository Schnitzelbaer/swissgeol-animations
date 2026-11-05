import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat, toLonLat } from 'ol/proj'
import type { Coordinate } from 'ol/coordinate'
import { boreholes, getBorehole, type Borehole } from '../../data/boreholes'
import { FIGMA_MAP_CENTER_PX, INITIAL_CENTER, INITIAL_RESOLUTION } from './geometries'

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

/** Figma-Bohrungen über ihre Pixelposition, erzeugte Bohrungen über ihre WGS84-Lage */
function location(borehole: Borehole) {
  return borehole.figma ? px(borehole.figma) : fromLonLat(borehole.lonLat!)
}

export function createBoreholeFeatures() {
  return boreholes.map((borehole) => {
    const feature = new Feature({ geometry: new Point(location(borehole)) })
    feature.setId(borehole.id)
    return feature
  })
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
