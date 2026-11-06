import type Feature from 'ol/Feature'
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

const HIT_SCALE = 0.75

function hitSymbol(symbol: SymbolDefinition) {
  return (coordinates: unknown, state: State) => {
    const context = state.context
    const [x, y] = coordinates as Coordinate
    const ratio = state.pixelRatio
    // Trefferfläche auf 75% verkleinert: bei dicht liegenden Bohrungen zählt nur, was nahe am Zeiger liegt
    context.save()
    context.translate(x, y)
    context.scale(ratio * HIT_SCALE, ratio * HIT_SCALE)
    context.translate(-15, -15)
    context.fill(path2d(symbol.path))
    context.restore()
  }
}

/*
 * Badge für mehrere Bohrungen am gleichen Standort, wie die Cluster im Assets-Screen (Figma 18063:183609):
 * Pille 30px hoch, Padding 10px, Füllung #337083, 4px Rand aussen #14AFB8 70%, Schatten 0/2/6 #14AFB8 40%,
 * Zahl Inter Bold 14px weiss.
 */
export const BADGE_FONT = '700 14px Inter'
const BADGE_HEIGHT = 30
const BADGE_HALO = 4
/** Halbe Höhe samt Rand: Tooltip und Popover setzen darüber an */
export const BADGE_HALF_HEIGHT = BADGE_HEIGHT / 2 + BADGE_HALO

function badgeWidth(context: CanvasRenderingContext2D, text: string) {
  context.font = BADGE_FONT
  return Math.max(BADGE_HEIGHT, Math.ceil(context.measureText(text).width) + 20)
}

function pill(width: number, height: number, inset = 0) {
  const path = new Path2D()
  path.roundRect(-width / 2 - inset, -height / 2 - inset, width + 2 * inset, height + 2 * inset, height / 2 + inset)
  return path
}

/** Zeichnet das Badge mit Mittelpunkt (x, y) in Gerätepixeln; ring wie bei den Symbolen 6px um die Form */
function drawBadge(context: CanvasRenderingContext2D, text: string, x: number, y: number, ratio: number, ring?: string) {
  context.save()
  context.translate(x, y)
  context.scale(ratio, ratio)
  const width = badgeWidth(context, text)
  const outer = pill(width, BADGE_HEIGHT, BADGE_HALO)

  if (ring) {
    context.lineWidth = 12
    context.strokeStyle = ring
    context.stroke(outer)
  }

  // Schatten nur ausserhalb der Form (Figma schneidet ihn unter der Form weg, auch unter dem halbtransparenten Rand)
  context.save()
  const outside = new Path2D()
  outside.rect(-width, -BADGE_HEIGHT * 2, width * 2, BADGE_HEIGHT * 4)
  outside.addPath(outer)
  context.clip(outside, 'evenodd')
  context.shadowColor = 'rgba(20, 175, 184, 0.4)'
  context.shadowOffsetY = 2 * ratio
  context.shadowBlur = 6 * ratio
  context.fillStyle = '#000'
  context.fill(outer)
  context.restore()

  context.fillStyle = '#337083'
  context.fill(pill(width, BADGE_HEIGHT))
  context.strokeStyle = 'rgba(20, 175, 184, 0.7)'
  context.lineWidth = BADGE_HALO
  context.stroke(pill(width, BADGE_HEIGHT, BADGE_HALO / 2))

  context.fillStyle = '#fff'
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'
  context.fillText(text, 0, 5)
  context.restore()
}

function hitBadge(text: string) {
  return (coordinates: unknown, state: State) => {
    const context = state.context
    const [x, y] = coordinates as Coordinate
    context.save()
    context.translate(x, y)
    context.scale(state.pixelRatio, state.pixelRatio)
    context.fill(pill(badgeWidth(context, text), BADGE_HEIGHT, BADGE_HALO))
    context.restore()
  }
}

type RenderState = 'selected' | 'hover' | 'default'

function badgeStyle(count: number, state: RenderState | 'hidden') {
  const cacheKey = `badge|${count}|${state}`
  let style = styles.get(cacheKey)
  if (!style) {
    const text = String(count)
    const ring = state === 'selected' ? SELECTED : state === 'hover' ? HOVER : undefined
    style = new Style({
      renderer:
        state === 'hidden'
          ? () => {}
          : (coordinates, renderState) => {
              const [x, y] = coordinates as Coordinate
              drawBadge(renderState.context, text, x, y, renderState.pixelRatio, ring)
            },
      hitDetectionRenderer: hitBadge(text),
      zIndex: state === 'selected' ? 5 : state === 'hover' ? 4 : 3,
    })
    styles.set(cacheKey, style)
  }
  return style
}

const stateOf = (feature: FeatureLike): RenderState => (feature.get('selected') === true ? 'selected' : feature.get('hover') === true ? 'hover' : 'default')

const styles = new Map<string, Style>()

/** Herausgezoomt: Badge mit der Anzahl Bohrungen eines Clusters (auch 1), Hover wie bei den Symbolen */
export const clusterStyle: StyleFunction = (feature) => {
  const members = feature.get('features') as Feature[]
  const state = members.some((member) => member.get('selected') === true) ? 'selected' : feature.get('hover') === true ? 'hover' : 'default'
  return badgeStyle(members.length, state)
}

const styleFunctions = new Map<LegendTopic, StyleFunction>()

/** Stil der Bohrungen für eine Legende; Hover und Auswahl bekommen den Rahmen und liegen oben */
export function boreholeStyle(topic: LegendTopic): StyleFunction {
  let fn = styleFunctions.get(topic)
  if (!fn) {
    fn = (feature: FeatureLike) => {
      const borehole = getBorehole(String(feature.getId()))
      if (!borehole) return undefined
      // Gleicher Standort: Badge mit Anzahl, hervorgehoben sobald eine der Bohrungen gewählt oder überfahren ist
      const members = feature.get('members') as Feature[] | undefined
      if (members) {
        if (feature.get('leader') !== true) return badgeStyle(members.length, 'hidden')
        const states = members.map(stateOf)
        return badgeStyle(members.length, states.includes('selected') ? 'selected' : states.includes('hover') ? 'hover' : 'default')
      }
      const key = symbolKey(topic, legendValue(borehole, topic))
      const state = stateOf(feature)
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
