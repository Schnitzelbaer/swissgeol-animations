import type { FeatureLike } from 'ol/Feature'
import type { Coordinate } from 'ol/coordinate'
import type { State } from 'ol/render'
import { Circle, Fill, Icon, Stroke, Style } from 'ol/style'
import markerPoint from '../../assets/map/marker-point.svg'
import markerPin from '../../assets/map/marker-pin.svg'

// Farben aus den Figma-Vektoren «Vector 5», «Linie» und «Punkt»
const AREA_FILL = 'rgba(245, 158, 11, 0.3)'
const AREA_FILL_HOVER = 'rgba(245, 158, 11, 0.5)'
const AREA_STROKE = '#78350f'
const LINE_OUTER = '#1e3a8a'
const LINE_INNER = '#3b82f6'

// Gewählte Geometrie (Figma 20864:149622): pinker Rand aussen, brauner Rand innen, doppelte Füllung
const SELECTED = '#ec4899'
const SELECTED_FILL = 'rgba(245, 158, 11, 0.51)'

const areaStyle = new Style({
  fill: new Fill({ color: AREA_FILL }),
  stroke: new Stroke({ color: AREA_STROKE, width: 3, lineJoin: 'round', lineCap: 'round' }),
})

const areaHoverStyle = new Style({
  fill: new Fill({ color: AREA_FILL_HOVER }),
  stroke: new Stroke({ color: AREA_STROKE, width: 3, lineJoin: 'round', lineCap: 'round' }),
  zIndex: 1,
})

function tracePolygon(context: CanvasRenderingContext2D, rings: Coordinate[][]) {
  for (const ring of rings) {
    ring.forEach(([x, y], index) => (index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)))
    context.closePath()
  }
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
  context.save()
  context.beginPath()
  context.rect(-1e6, -1e6, 2e6, 2e6)
  tracePolygon(context, rings)
  context.clip('evenodd')
  context.beginPath()
  tracePolygon(context, rings)
  context.lineWidth = 12 * ratio
  context.strokeStyle = SELECTED
  context.stroke()
  context.restore()

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

// Linien liegen immer über den Flächen, auch über einer gewählten Fläche
const lineStyle = [
  new Style({ stroke: new Stroke({ color: LINE_OUTER, width: 8, lineJoin: 'round', lineCap: 'round' }), zIndex: 2.5 }),
  new Style({ stroke: new Stroke({ color: LINE_INNER, width: 4, lineJoin: 'round', lineCap: 'round' }), zIndex: 2.5 }),
]

const lineHoverStyle = [
  new Style({ stroke: new Stroke({ color: LINE_OUTER, width: 10, lineJoin: 'round', lineCap: 'round' }), zIndex: 2.5 }),
  new Style({ stroke: new Stroke({ color: LINE_INNER, width: 6, lineJoin: 'round', lineCap: 'round' }), zIndex: 2.5 }),
]

const lineSelectedStyle = [
  new Style({ stroke: new Stroke({ color: SELECTED, width: 20, lineJoin: 'round', lineCap: 'round' }), zIndex: 3 }),
  ...lineStyle.map((style) => {
    const clone = style.clone()
    clone.setZIndex(3)
    return clone
  }),
]

const pointStyle = new Style({ image: new Icon({ src: markerPoint, anchor: [0.5, 0.5] }), zIndex: 3 })
const pointHoverStyle = new Style({ image: new Icon({ src: markerPoint, anchor: [0.5, 0.5], scale: 1.25 }), zIndex: 4 })

// «Punkt»: 34×34-SVG, Kreismittelpunkt bei (17, 13)
const pinStyle = new Style({ image: new Icon({ src: markerPin, anchor: [0.5, 13 / 34] }), zIndex: 3 })
const pinHoverStyle = new Style({ image: new Icon({ src: markerPin, anchor: [0.5, 13 / 34], scale: 1.25 }), zIndex: 4 })

// Gewählter Punkt: pinker Ring um den 16px-Kreis, analog zum Rand der Fläche
const selectedRing = new Style({ image: new Circle({ radius: 11, stroke: new Stroke({ color: SELECTED, width: 6 }) }), zIndex: 5 })
const pointSelectedStyle = [selectedRing, new Style({ image: new Icon({ src: markerPoint, anchor: [0.5, 0.5] }), zIndex: 5 })]
const pinSelectedStyle = [selectedRing, new Style({ image: new Icon({ src: markerPin, anchor: [0.5, 13 / 34] }), zIndex: 5 })]

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
      return selected ? pointSelectedStyle : hover ? pointHoverStyle : pointStyle
  }
}
