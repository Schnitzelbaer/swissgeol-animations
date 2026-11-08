import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import Polygon from 'ol/geom/Polygon'
import { fromLonLat } from 'ol/proj'
import type { Coordinate } from 'ol/coordinate'

/*
 * Die Geometrien stammen aus dem Figma-Screen «Desktop - 1» (1440×1024) und sind in dessen
 * Pixelkoordinaten notiert. Das Figma-Kartenbild wurde anhand der Ortsnamen (Triengen, Büron,
 * Knutwil, Geuensee, Sursee, Schenkon, Nottwil, Beromünster) eingemessen: Der Mittelpunkt des
 * Kartenausschnitts (x 490, y 556) liegt bei 8.0990° E / 47.1757° N, ein Figma-Pixel entspricht
 * rund 16.2 m in Web-Mercator. So erscheinen die Objekte beim Start genau dort, wo sie im Design liegen.
 */
export const FIGMA_MAP_CENTER_PX: Coordinate = [490, 556]
export const INITIAL_CENTER = fromLonLat([8.099046, 47.175691])
export const INITIAL_RESOLUTION = 16.2

function px([x, y]: Coordinate): Coordinate {
  return [
    INITIAL_CENTER[0] + (x - FIGMA_MAP_CENTER_PX[0]) * INITIAL_RESOLUTION,
    INITIAL_CENTER[1] - (y - FIGMA_MAP_CENTER_PX[1]) * INITIAL_RESOLUTION,
  ]
}

function polygon(points: Coordinate[]) {
  const ring = points.map(px)
  return new Polygon([[...ring, ring[0]]])
}

export type AssetKind = 'area' | 'line' | 'point' | 'pin'

type GeometryDefinition = { id: string; assetId: string; kind: AssetKind; geometry: () => Polygon | LineString | Point }

/**
 * Geometrien auf der Karte, Reihenfolge wie in Figma. Jede gehört zu einem Asset mit eigenem PDF;
 * ein Klick wählt sie aus und öffnet das Panel dieses Assets.
 */
const GEOMETRIES: GeometryDefinition[] = [
  // «Vector 5» (4×)
  { id: 'flaeche-1', assetId: '4841', kind: 'area', geometry: () => polygon([[269, 479.4], [460.2, 287.4], [516.1, 309.9], [547.8, 472.7], [270.5, 481.1]]) },
  { id: 'flaeche-2', assetId: '8768', kind: 'area', geometry: () => polygon([[461.7, 528.5], [577.7, 343.3], [633.1, 365.6], [665.1, 528.5]]) },
  { id: 'flaeche-3', assetId: '16622', kind: 'area', geometry: () => polygon([[435.4, 362.5], [514.7, 348], [569.8, 348], [560.2, 476]]) },
  { id: 'flaeche-4', assetId: '16623', kind: 'area', geometry: () => polygon([[394.8, 490.9], [554.3, 323.6], [605.2, 379.4], [547.5, 505.9]]) },
  // «Linie»
  { id: 'linie-1', assetId: '8768', kind: 'line', geometry: () => new LineString([[341.5, 366], [366.5, 402], [429.5, 402]].map(px)) },
  // «Legende Objekte – Assets» (Punkte)
  { id: 'punkt-1', assetId: '4841', kind: 'point', geometry: () => new Point(px([350.5, 295])) },
  { id: 'punkt-2', assetId: '16623', kind: 'point', geometry: () => new Point(px([443.5, 378])) },
  { id: 'punkt-3', assetId: '16623', kind: 'point', geometry: () => new Point(px([451.5, 384])) },
  { id: 'punkt-4', assetId: '8768', kind: 'point', geometry: () => new Point(px([405.5, 394])) },
  { id: 'punkt-5', assetId: '16622', kind: 'point', geometry: () => new Point(px([491.5, 426])) },
  // «Punkt» (mit stärkerem Schatten)
  { id: 'punkt-6', assetId: '16623', kind: 'pin', geometry: () => new Point(px([450, 370])) },
  { id: 'punkt-7', assetId: '16622', kind: 'pin', geometry: () => new Point(px([502, 343])) },
  // Neues Asset ohne Dateien (nicht in Figma), östlich bei Schenkon / Zellfeld
  { id: 'punkt-8', assetId: '24518', kind: 'point', geometry: () => new Point(px([741, 620])) },
]

export function createAssetFeatures() {
  return GEOMETRIES.map(({ id, assetId, kind, geometry }) => {
    const feature = new Feature({ geometry: geometry(), kind, assetId })
    feature.setId(id)
    return feature
  })
}

/** Erste Geometrie eines Assets; wird markiert, wenn das Asset ohne gewählte Geometrie geöffnet wird */
export function defaultGeometryId(assetId: string) {
  return GEOMETRIES.find((definition) => definition.assetId === assetId)?.id
}

export function geometryAssetId(geometryId: string | null | undefined) {
  return GEOMETRIES.find((definition) => definition.id === geometryId)?.assetId
}
