import type { FeatureLike } from 'ol/Feature'
import { Fill, Icon, Stroke, Style } from 'ol/style'
import markerPoint from '../../assets/map/marker-point.svg'
import markerPin from '../../assets/map/marker-pin.svg'

// Farben aus den Figma-Vektoren «Vector 5», «Linie» und «Punkt»
const AREA_FILL = 'rgba(245, 158, 11, 0.3)'
const AREA_FILL_HOVER = 'rgba(245, 158, 11, 0.5)'
const AREA_STROKE = '#78350f'
const LINE_OUTER = '#1e3a8a'
const LINE_INNER = '#3b82f6'

const areaStyle = new Style({
  fill: new Fill({ color: AREA_FILL }),
  stroke: new Stroke({ color: AREA_STROKE, width: 3, lineJoin: 'round', lineCap: 'round' }),
})

const areaHoverStyle = new Style({
  fill: new Fill({ color: AREA_FILL_HOVER }),
  stroke: new Stroke({ color: AREA_STROKE, width: 3, lineJoin: 'round', lineCap: 'round' }),
  zIndex: 1,
})

const lineStyle = [
  new Style({ stroke: new Stroke({ color: LINE_OUTER, width: 8, lineJoin: 'round', lineCap: 'round' }) }),
  new Style({ stroke: new Stroke({ color: LINE_INNER, width: 4, lineJoin: 'round', lineCap: 'round' }) }),
]

const lineHoverStyle = [
  new Style({ stroke: new Stroke({ color: LINE_OUTER, width: 10, lineJoin: 'round', lineCap: 'round' }), zIndex: 2 }),
  new Style({ stroke: new Stroke({ color: LINE_INNER, width: 6, lineJoin: 'round', lineCap: 'round' }), zIndex: 2 }),
]

const pointStyle = new Style({ image: new Icon({ src: markerPoint, anchor: [0.5, 0.5] }), zIndex: 3 })
const pointHoverStyle = new Style({ image: new Icon({ src: markerPoint, anchor: [0.5, 0.5], scale: 1.25 }), zIndex: 4 })

// «Punkt»: 34×34-SVG, Kreismittelpunkt bei (17, 13)
const pinStyle = new Style({ image: new Icon({ src: markerPin, anchor: [0.5, 13 / 34] }), zIndex: 3 })
const pinHoverStyle = new Style({ image: new Icon({ src: markerPin, anchor: [0.5, 13 / 34], scale: 1.25 }), zIndex: 4 })

export function assetStyle(feature: FeatureLike) {
  const hover = feature.get('hover') === true
  switch (feature.get('kind')) {
    case 'area':
      return hover ? areaHoverStyle : areaStyle
    case 'line':
      return hover ? lineHoverStyle : lineStyle
    case 'pin':
      return hover ? pinHoverStyle : pinStyle
    default:
      return hover ? pointHoverStyle : pointStyle
  }
}
