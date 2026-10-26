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

function asset(kind: AssetKind, geometry: Polygon | LineString | Point, id: string) {
  return new Feature({ geometry, kind, assetId: id })
}

export function createAssetFeatures() {
  return [
    // «Vector 5» (4×), Reihenfolge wie in Figma
    asset('area', polygon([[269, 479.4], [460.2, 287.4], [516.1, 309.9], [547.8, 472.7], [270.5, 481.1]]), 'asset-4841'),
    asset('area', polygon([[461.7, 528.5], [577.7, 343.3], [633.1, 365.6], [665.1, 528.5]]), 'asset-4842'),
    asset('area', polygon([[435.4, 362.5], [514.7, 348], [569.8, 348], [560.2, 476]]), 'asset-4843'),
    asset('area', polygon([[394.8, 490.9], [554.3, 323.6], [605.2, 379.4], [547.5, 505.9]]), 'asset-4844'),
    // «Linie»
    asset('line', new LineString([[341.5, 366], [366.5, 402], [429.5, 402]].map(px)), 'asset-4845'),
    // «Legende Objekte – Assets» (Punkte)
    asset('point', new Point(px([350.5, 295])), 'asset-4846'),
    asset('point', new Point(px([443.5, 378])), 'asset-4847'),
    asset('point', new Point(px([451.5, 384])), 'asset-4848'),
    asset('point', new Point(px([405.5, 394])), 'asset-4849'),
    asset('point', new Point(px([491.5, 426])), 'asset-4850'),
    // «Punkt» (mit stärkerem Schatten)
    asset('pin', new Point(px([450, 370])), 'asset-4851'),
    asset('pin', new Point(px([502, 343])), 'asset-4852'),
  ]
}
