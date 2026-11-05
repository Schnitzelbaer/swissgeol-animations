import type { FeatureLike } from 'ol/Feature'
import type { Coordinate } from 'ol/coordinate'
import type { State } from 'ol/render'
import { Style } from 'ol/style'
import type { TemplateType } from '../../data/boreholes'
import { HOVER, SELECTED } from './styles'

/*
 * Symbole «Legende Objekte – Boreholes» (topic=Template Typ) als Vektoren, wie die Asset-Punkte:
 * Safari rastert SVG-Icons mit Filtern auf der Karte nur in einfacher Auflösung.
 * Pfade in den 30×30-Koordinaten der Figma-Komponente, Mittelpunkt (15, 15).
 */
type Symbol = { path: () => Path2D; fill: string; stroke: string; shadow: string }

const SYMBOLS: Record<TemplateType, Symbol> = {
  // Allgemein: Dreieck
  general: {
    path: () =>
      new Path2D(
        'M14.1318 7.26943C14.5156 6.59761 15.4843 6.59761 15.8682 7.26943L24.1451 21.7539C24.526 22.4205 24.0446 23.25 23.2768 23.25H6.72318C5.95536 23.25 5.47399 22.4205 5.85494 21.7539L14.1318 7.26943Z',
      ),
    fill: '#10b981',
    stroke: '#064e3b',
    shadow: 'rgba(16, 185, 129, 0.4)',
  },
  // Erdsonde: um 45° gedrehtes Quadrat (14px)
  geothermal: {
    path: () => new Path2D('M15 5.1L24.9 15L15 24.9L5.1 15Z'),
    fill: '#e53940',
    stroke: '#801519',
    shadow: 'rgba(229, 57, 64, 0.4)',
  },
  // Geotechnik (Figma «Baugrund»): Quadrat 16px
  geotechnics: {
    path: () => {
      const path = new Path2D()
      path.roundRect(7, 7, 16, 16, 1)
      return path
    },
    fill: '#8b5cf6',
    stroke: '#4c1d95',
    shadow: 'rgba(139, 92, 246, 0.4)',
  },
  // Hydrogeologie: Kreis 16px
  hydrogeology: {
    path: () => {
      const path = new Path2D()
      path.arc(15, 15, 8, 0, 2 * Math.PI)
      return path
    },
    fill: '#3b82f6',
    stroke: '#1e3a8a',
    shadow: 'rgba(59, 130, 246, 0.4)',
  },
}

const paths = new Map<TemplateType, Path2D>()
const pathFor = (type: TemplateType) => {
  let path = paths.get(type)
  if (!path) {
    path = SYMBOLS[type].path()
    paths.set(type, path)
  }
  return path
}

/** Zeichnet ein Symbol; ring: 6px breiter Rahmen entlang der Form (violett für Hover, pink für die Auswahl) */
function renderSymbol(type: TemplateType, ring?: string) {
  const symbol = SYMBOLS[type]
  return (coordinates: unknown, state: State) => {
    const context = state.context
    const [x, y] = coordinates as Coordinate
    const ratio = state.pixelRatio
    const path = pathFor(type)
    context.save()
    context.translate(x - 15 * ratio, y - 15 * ratio)
    context.scale(ratio, ratio)
    context.lineJoin = 'round'

    if (ring) {
      context.lineWidth = 12
      context.strokeStyle = ring
      context.stroke(path)
    }

    // Schlagschatten wie in Figma (Versatz 2, stdDeviation 3, Spread −1): Canvas-Schatten gelten in Gerätepixeln
    context.save()
    context.shadowColor = symbol.shadow
    context.shadowOffsetY = 2 * ratio
    context.shadowBlur = 6 * ratio
    context.translate(15, 15)
    context.scale(0.875, 0.875)
    context.translate(-15, -15)
    context.fillStyle = symbol.fill
    context.fill(path)
    context.restore()

    // Form mit 2px-Innenrand (Figma: 4px-Kontur, auf die Form maskiert)
    context.fillStyle = symbol.fill
    context.fill(path)
    context.save()
    context.clip(path)
    context.lineWidth = 4
    context.strokeStyle = symbol.stroke
    context.stroke(path)
    context.restore()

    context.restore()
  }
}

function hitSymbol(type: TemplateType) {
  return (coordinates: unknown, state: State) => {
    const context = state.context
    const [x, y] = coordinates as Coordinate
    const ratio = state.pixelRatio
    context.save()
    context.translate(x - 15 * ratio, y - 15 * ratio)
    context.scale(ratio, ratio)
    context.fill(pathFor(type))
    context.restore()
  }
}

const cache = new Map<string, Style>()

export function boreholeStyle(feature: FeatureLike) {
  const type = feature.get('kind') as TemplateType
  const state = feature.get('selected') === true ? 'selected' : feature.get('hover') === true ? 'hover' : 'default'
  const key = `${type}-${state}`
  let style = cache.get(key)
  if (!style) {
    const ring = state === 'selected' ? SELECTED : state === 'hover' ? HOVER : undefined
    style = new Style({ renderer: renderSymbol(type, ring), hitDetectionRenderer: hitSymbol(type), zIndex: state === 'selected' ? 5 : state === 'hover' ? 4 : 3 })
    cache.set(key, style)
  }
  return style
}
