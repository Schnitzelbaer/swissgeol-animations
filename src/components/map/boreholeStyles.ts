import type { FeatureLike } from 'ol/Feature'
import type { Coordinate } from 'ol/coordinate'
import type { State } from 'ol/render'
import { Style } from 'ol/style'
import type { StyleFunction } from 'ol/style/Style'
import { getBorehole } from '../../data/boreholes'
import { SYMBOLS, type SymbolDefinition } from './boreholeSymbols'
import { legendValue, symbolKey, type LegendTopic } from './boreholeLegends'
import { HOVER, SELECTED } from './styles'

/*
 * Symbole «Legende Objekte – Boreholes» als Vektoren, wie die Asset-Punkte: Safari rastert SVG-Icons mit Filtern
 * auf der Karte nur in einfacher Auflösung. Dieselbe Zeichenfunktion dient auch den Legenden-Icons.
 */
const paths = new Map<string, Path2D>()
function path2d(d: string) {
  let path = paths.get(d)
  if (!path) {
    path = new Path2D(d)
    paths.set(d, path)
  }
  return path
}

/**
 * Zeichnet ein Symbol mit Mittelpunkt (x, y) in Gerätepixeln.
 * ring: 6px breiter Rahmen entlang der Form (violett für Hover, pink für die Auswahl).
 */
export function drawSymbol(context: CanvasRenderingContext2D, symbol: SymbolDefinition, x: number, y: number, ratio: number, ring?: string) {
  const shape = path2d(symbol.path)
  const stroke = path2d(symbol.strokePath)
  context.save()
  context.translate(x - 15 * ratio, y - 15 * ratio)
  context.scale(ratio, ratio)
  context.lineJoin = 'round'

  if (ring) {
    context.lineWidth = 12
    context.strokeStyle = ring
    context.stroke(shape)
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
  context.fill(shape)
  context.restore()

  context.fillStyle = symbol.fill
  context.fill(shape)
  context.strokeStyle = symbol.stroke
  context.lineWidth = symbol.strokeWidth
  if (symbol.inside) {
    // Figma: 4px-Kontur auf die Form maskiert, sichtbar bleiben 2px innen
    context.save()
    context.clip(shape)
    context.stroke(stroke)
    context.restore()
  } else {
    context.stroke(stroke)
  }
  context.restore()
}

function hitSymbol(symbol: SymbolDefinition) {
  return (coordinates: unknown, state: State) => {
    const context = state.context
    const [x, y] = coordinates as Coordinate
    const ratio = state.pixelRatio
    context.save()
    context.translate(x - 15 * ratio, y - 15 * ratio)
    context.scale(ratio, ratio)
    context.fill(path2d(symbol.path))
    context.restore()
  }
}

const styles = new Map<string, Style>()
const styleFunctions = new Map<LegendTopic, StyleFunction>()

/** Stil der Bohrungen für eine Legende; Hover und Auswahl bekommen den Rahmen und liegen oben */
export function boreholeStyle(topic: LegendTopic): StyleFunction {
  let fn = styleFunctions.get(topic)
  if (!fn) {
    fn = (feature: FeatureLike) => {
      const borehole = getBorehole(String(feature.getId()))
      if (!borehole) return undefined
      const key = symbolKey(topic, legendValue(borehole, topic))
      const state = feature.get('selected') === true ? 'selected' : feature.get('hover') === true ? 'hover' : 'default'
      const cacheKey = `${key}|${state}`
      let style = styles.get(cacheKey)
      if (!style) {
        const symbol = SYMBOLS[key]
        const ring = state === 'selected' ? SELECTED : state === 'hover' ? HOVER : undefined
        style = new Style({
          renderer: (coordinates, renderState) => {
            const [x, y] = coordinates as Coordinate
            drawSymbol(renderState.context, symbol, x, y, renderState.pixelRatio, ring)
          },
          hitDetectionRenderer: hitSymbol(symbol),
          zIndex: state === 'selected' ? 5 : state === 'hover' ? 4 : 3,
        })
        styles.set(cacheKey, style)
      }
      return style
    }
    styleFunctions.set(topic, fn)
  }
  return fn
}
