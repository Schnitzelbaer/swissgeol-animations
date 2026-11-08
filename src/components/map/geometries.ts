import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import Point from 'ol/geom/Point'
import Polygon from 'ol/geom/Polygon'
import { fromLonLat } from 'ol/proj'
import type { Coordinate } from 'ol/coordinate'
import { assetGeometries, type GeometryKind, type GeometrySpec } from '../../data/generatedAssets'

/*
 * Startansicht wie im Figma-Screen «Desktop - 1» (1440×1024): Das Figma-Kartenbild wurde anhand der
 * Ortsnamen eingemessen. Der Mittelpunkt des Kartenausschnitts (x 490, y 556) liegt bei 8.0990° E /
 * 47.1757° N, ein Figma-Pixel entspricht rund 16.2 m in Web-Mercator. Die Borehole-Karte rechnet ihre
 * Figma-Positionen über diese Werte um (boreholeGeometries.ts).
 *
 * Die Geometrien der Assets stehen in WGS84 in data/generatedAssets.ts: von Hand gesetzte für die Assets
 * aus Figma und den neuen Dokumenten, dazu die erzeugten in der Region Sursee und der ganzen Schweiz.
 */
export const FIGMA_MAP_CENTER_PX: Coordinate = [490, 556]
export const INITIAL_CENTER = fromLonLat([8.099046, 47.175691])
export const INITIAL_RESOLUTION = 16.2

export type AssetKind = GeometryKind

function geometryOf({ kind, coordinates }: GeometrySpec) {
  if (kind === 'area') {
    const ring = (coordinates as [number, number][]).map((c) => fromLonLat(c))
    return new Polygon([[...ring, ring[0]]])
  }
  if (kind === 'line') return new LineString((coordinates as [number, number][]).map((c) => fromLonLat(c)))
  return new Point(fromLonLat(coordinates as [number, number]))
}

/**
 * Features der Assets-Karte. `group` ist die Asset-ID: Alle Geometrien eines Assets gehören zusammen,
 * werden gemeinsam markiert und zeigen im Panel denselben Satz an Details und Dokumenten.
 * Flächen zuunterst, darüber Linien und Punkte, damit kleine Objekte anklickbar bleiben.
 */
export function createAssetFeatures() {
  const order: Record<GeometryKind, number> = { area: 0, line: 1, point: 2, pin: 3 }
  return [...assetGeometries]
    .sort((a, b) => order[a.kind] - order[b.kind])
    .map((spec) => {
      const feature = new Feature({ geometry: geometryOf(spec), kind: spec.kind, assetId: spec.assetId, group: spec.assetId })
      feature.setId(spec.id)
      return feature
    })
}

/** Erste Geometrie eines Assets; wird markiert, wenn das Asset ohne gewählte Geometrie geöffnet wird */
export function defaultGeometryId(assetId: string) {
  return assetGeometries.find((spec) => spec.assetId === assetId)?.id
}

export function geometryAssetId(geometryId: string | null | undefined) {
  return assetGeometries.find((spec) => spec.id === geometryId)?.assetId
}
