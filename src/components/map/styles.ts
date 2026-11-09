import type { FeatureLike } from 'ol/Feature'
import type { Coordinate } from 'ol/coordinate'
import type { State } from 'ol/render'
import { Circle, Fill, Stroke, Style } from 'ol/style'
import { drawSprite } from './sprites'

// Farben aus den Figma-Vektoren «Vector 5», «Linie» und «Punkt»
const AREA_FILL = 'rgba(245, 158, 11, 0.3)'
const AREA_STROKE = '#78350f'
const LINE_OUTER = '#1e3a8a'
const LINE_INNER = '#3b82f6'
const POINT_FILL = '#14afb8'
const POINT_STROKE = '#13474e'
const POINT_RADIUS = 8

type Shadow = { offsetY: number; blur: number; opacity: number }

// Schlagschatten in der Punktfarbe aus Figma (Versatz, stdDeviation, Deckkraft; Spread −1)
const POINT_SHADOWS: Shadow[] = [{ offsetY: 2, blur: 3, opacity: 0.4 }]
const PIN_SHADOWS: Shadow[] = [
  { offsetY: 2, blur: 2, opacity: 0.16 },
  { offsetY: 4, blur: 5, opacity: 0.18 },
]

// Gewählte Geometrie (Figma 20864:149622): pinker Rand aussen, brauner Rand innen, doppelte Füllung
export const SELECTED = '#ec4899'
const SELECTED_FILL = 'rgba(245, 158, 11, 0.51)'

// Hover wie in den Figma-Komponenten «Map Interactions» (State=Hover): violetter Rand um die Geometrie
export const HOVER = '#8b5cf6'

const areaStyle = new Style({
  fill: new Fill({ color: AREA_FILL }),
  stroke: new Stroke({ color: AREA_STROKE, width: 3, lineJoin: 'round', lineCap: 'round' }),
})

function tracePolygon(context: CanvasRenderingContext2D, rings: Coordinate[][]) {
  for (const ring of rings) {
    ring.forEach(([x, y], index) => (index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)))
    context.closePath()
  }
}

/** 6px breiter Rand nur ausserhalb der Fläche (pink für die Auswahl, violett für Hover) */
function strokeOutside(context: CanvasRenderingContext2D, rings: Coordinate[][], color: string, ratio: number) {
  context.save()
  context.beginPath()
  context.rect(-1e6, -1e6, 2e6, 2e6)
  tracePolygon(context, rings)
  context.clip('evenodd')
  context.beginPath()
  tracePolygon(context, rings)
  context.lineWidth = 12 * ratio
  context.strokeStyle = color
  context.stroke()
  context.restore()
}

/** Fläche unter dem Mauszeiger: normale Darstellung mit violettem Rand aussen */
function renderHoverArea(coordinates: unknown, state: State) {
  const context = state.context
  const rings = coordinates as Coordinate[][]
  const ratio = state.pixelRatio
  context.save()
  context.lineJoin = 'round'
  context.lineCap = 'round'
  context.beginPath()
  tracePolygon(context, rings)
  context.fillStyle = AREA_FILL
  context.fill()
  strokeOutside(context, rings, HOVER, ratio)
  context.beginPath()
  tracePolygon(context, rings)
  context.lineWidth = 3 * ratio
  context.strokeStyle = AREA_STROKE
  context.stroke()
  context.restore()
}

/** Zeichnet die gewählte Fläche wie in Figma: 6px pink ausserhalb, 3px braun innerhalb der Kante */
function renderSelectedArea(coordinates: unknown, state: State) {
  const context = state.context
  const rings = coordinates as Coordinate[][]
  const ratio = state.pixelRatio
  context.save()
  context.lineJoin = 'round'
  context.lineCap = 'round'

  context.beginPath()
  tracePolygon(context, rings)
  context.fillStyle = SELECTED_FILL
  context.fill()

  // Aussenrand: nur ausserhalb der Fläche sichtbar
  strokeOutside(context, rings, SELECTED, ratio)

  // Innenrand: nur innerhalb der Fläche sichtbar
  context.save()
  context.beginPath()
  tracePolygon(context, rings)
  context.clip()
  context.beginPath()
  tracePolygon(context, rings)
  context.lineWidth = 6 * ratio
  context.strokeStyle = AREA_STROKE
  context.stroke()
  context.restore()

  context.restore()
}

function hitSelectedArea(coordinates: unknown, state: State) {
  const context = state.context
  context.beginPath()
  tracePolygon(context, coordinates as Coordinate[][])
  context.fill()
  context.lineWidth = 12 * state.pixelRatio
  context.stroke()
}

const areaSelectedStyle = new Style({ renderer: renderSelectedArea, hitDetectionRenderer: hitSelectedArea, zIndex: 2 })
const areaHoverStyle = new Style({ renderer: renderHoverArea, hitDetectionRenderer: hitSelectedArea, zIndex: 1 })

// Linien liegen immer über den Flächen, auch über einer gewählten Fläche
const lineStyle = [
  new Style({ stroke: new Stroke({ color: LINE_OUTER, width: 8, lineJoin: 'round', lineCap: 'round' }), zIndex: 2.5 }),
  new Style({ stroke: new Stroke({ color: LINE_INNER, width: 4, lineJoin: 'round', lineCap: 'round' }), zIndex: 2.5 }),
]

const lineHoverStyle = [new Style({ stroke: new Stroke({ color: HOVER, width: 20, lineJoin: 'round', lineCap: 'round' }), zIndex: 2.5 }), ...lineStyle]

const lineSelectedStyle = [
  new Style({ stroke: new Stroke({ color: SELECTED, width: 20, lineJoin: 'round', lineCap: 'round' }), zIndex: 3 }),
  ...lineStyle.map((style) => {
    const clone = style.clone()
    clone.setZIndex(3)
    return clone
  }),
]

function circlePath(context: CanvasRenderingContext2D, [x, y]: Coordinate, radius: number) {
  context.beginPath()
  context.arc(x, y, radius, 0, 2 * Math.PI)
}

/*
 * Punkte werden als Vektoren gezeichnet statt als SVG-Icon: Safari rastert Bilder mit SVG-Filtern auf der Karte
 * nur in einfacher Auflösung, auf Retina-Displays wurden die Punkte dadurch unscharf.
 * 16px-Kreis mit 2px-Innenrand wie «Legende Objekte – Assets» und «Punkt» in Figma.
 */
function pointRenderer(shadows: Shadow[], key: string) {
  return (coordinates: unknown, state: State) => {
    const [x, y] = coordinates as Coordinate
    const ratio = state.pixelRatio
    // Einmal als Sprite gezeichnet (sprites.ts), danach nur kopiert: die Schatten sind sonst beim Zoomen zu teuer
    drawSprite(state.context, key, x, y, ratio, 22, 22, (context, cx, cy) => drawPoint(context, [cx, cy], ratio, shadows))
  }
}

function drawPoint(context: CanvasRenderingContext2D, center: Coordinate, ratio: number, shadows: Shadow[]) {
  // Canvas-Schatten gelten in Gerätepixeln; shadowBlur ist die doppelte Standardabweichung
  context.save()
  context.fillStyle = POINT_FILL
  for (const shadow of shadows) {
    context.shadowColor = `rgba(20, 175, 184, ${shadow.opacity})`
    context.shadowOffsetY = shadow.offsetY * ratio
    context.shadowBlur = shadow.blur * 2 * ratio
    // Spread −1: Der Schatten geht vom 1px kleineren Kreis aus, der Punkt deckt ihn danach ab
    circlePath(context, center, (POINT_RADIUS - 1) * ratio)
    context.fill()
  }
  context.restore()

  circlePath(context, center, POINT_RADIUS * ratio)
  context.fillStyle = POINT_FILL
  context.fill()
  circlePath(context, center, (POINT_RADIUS - 1) * ratio)
  context.lineWidth = 2 * ratio
  context.strokeStyle = POINT_STROKE
  context.stroke()
}

function hitPoint(coordinates: unknown, state: State) {
  circlePath(state.context, coordinates as Coordinate, POINT_RADIUS * state.pixelRatio)
  state.context.fill()
}

function pointStyle(shadows: Shadow[], zIndex: number) {
  return new Style({ renderer: pointRenderer(shadows, shadows === PIN_SHADOWS ? 'pin' : 'point'), hitDetectionRenderer: hitPoint, zIndex })
}

// Ring um den 16px-Kreis, analog zum Rand der Fläche: pink für die Auswahl, violett für Hover
const ring = (color: string, zIndex: number) => new Style({ image: new Circle({ radius: 11, stroke: new Stroke({ color, width: 6 }) }), zIndex })
const selectedRing = ring(SELECTED, 5)
const hoverRing = ring(HOVER, 4)

const assetPointStyle = pointStyle(POINT_SHADOWS, 3)
const assetPointHoverStyle = [hoverRing, pointStyle(POINT_SHADOWS, 4)]

// «Punkt»: gleicher Kreis mit zwei weicheren Schatten
const pinStyle = pointStyle(PIN_SHADOWS, 3)
const pinHoverStyle = [hoverRing, pointStyle(PIN_SHADOWS, 4)]
const pointSelectedStyle = [selectedRing, pointStyle(POINT_SHADOWS, 5)]
const pinSelectedStyle = [selectedRing, pointStyle(PIN_SHADOWS, 5)]

export function assetStyle(feature: FeatureLike) {
  const hover = feature.get('hover') === true
  const selected = feature.get('selected') === true
  switch (feature.get('kind')) {
    case 'area':
      return selected ? areaSelectedStyle : hover ? areaHoverStyle : areaStyle
    case 'line':
      return selected ? lineSelectedStyle : hover ? lineHoverStyle : lineStyle
    case 'pin':
      return selected ? pinSelectedStyle : hover ? pinHoverStyle : pinStyle
    default:
      return selected ? pointSelectedStyle : hover ? assetPointHoverStyle : assetPointStyle
  }
}
