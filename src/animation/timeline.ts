/*
 * Zeitachse der Animation «AI-Analyse eines Dokuments». Alles, was sichtbar ist, wird aus einer Zeit t (ms)
 * berechnet, ohne CSS-Transitions: So lässt sich die Animation scrubben und jedes Bild ist reproduzierbar.
 */

export type Bezier = [number, number, number, number]

/** Kurven-Vorlagen; «swissgeol» ist --ease-out aus global.css */
export const EASING_PRESETS: Record<string, Bezier> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  swissgeol: [0.22, 1, 0.36, 1],
  'expo-out': [0.16, 1, 0.3, 1],
  'back-out': [0.34, 1.56, 0.64, 1],
}

export function presetName(bezier: Bezier) {
  return Object.entries(EASING_PRESETS).find(([, value]) => value.every((v, i) => Math.abs(v - bezier[i]) < 1e-6))?.[0] ?? 'custom'
}

const curves = new Map<string, (x: number) => number>()

/** cubic-bezier wie in CSS: x ist die Zeit (0–1), Rückgabe der Fortschritt */
export function cubicBezier(bezier: Bezier): (x: number) => number {
  const key = bezier.join(',')
  const cached = curves.get(key)
  if (cached) return cached
  const [x1, y1, x2, y2] = bezier
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  const solve = (x: number) => {
    let t = x
    for (let i = 0; i < 8; i++) {
      const error = sampleX(t) - x
      if (Math.abs(error) < 1e-6) return t
      const slope = slopeX(t)
      if (Math.abs(slope) < 1e-6) break
      t -= error / slope
    }
    // Fallback: Bisektion
    let lo = 0
    let hi = 1
    t = x
    for (let i = 0; i < 30; i++) {
      const value = sampleX(t)
      if (Math.abs(value - x) < 1e-6) break
      if (value < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return t
  }
  const fn = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : sampleY(solve(x)))
  curves.set(key, fn)
  return fn
}

export type Step = { start: number; duration: number; easing: Bezier }

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Linearer Fortschritt eines Schritts (0–1) */
export function linear(step: Pick<Step, 'start' | 'duration'>, time: number) {
  if (step.duration <= 0) return time >= step.start ? 1 : 0
  return clamp01((time - step.start) / step.duration)
}

/** Fortschritt mit Kurve (kann bei «back-out» kurz über 1 gehen) */
export function eased(step: Step, time: number) {
  return cubicBezier(step.easing)(linear(step, time))
}

export type EffectVariant = 'veil' | 'shimmer' | 'border' | 'aura'
export type Aspect = 'frei' | '16:9' | '1:1' | '4:5' | '9:16' | 'eigene'
/** Export-Auflösung nach der langen Seite: wie der Canvas, Full HD (1920), QHD (2560) oder 4K (3840) */
export type ExportResolution = 'canvas' | 'fhd' | 'qhd' | 'uhd'
export const EXPORT_LONG_EDGE: Record<Exclude<ExportResolution, 'canvas'>, number> = { fhd: 1920, qhd: 2560, uhd: 3840 }

/** Ausgabegrösse des Videos: Seitenverhältnis des Canvas, lange Seite nach der gewählten Auflösung, gerade Pixelzahl */
export function exportSize(resolution: ExportResolution, canvas: { width: number; height: number }) {
  const factor = resolution === 'canvas' ? 1 : EXPORT_LONG_EDGE[resolution] / Math.max(canvas.width, canvas.height)
  const even = (value: number) => Math.max(2, Math.round((value * factor) / 2) * 2)
  return { width: even(canvas.width), height: even(canvas.height), factor }
}

export type FlagAppear = 'fade' | 'scale' | 'slide'
export type FlagPlacement = 'tab' | 'corner' | 'inside'

export type Config = {
  effect: {
    variant: EffectVariant
    in: Step
    out: Step
    /** Dauer eines Durchlaufs (Schimmer, Umlauf des Rands, Atemzug) */
    period: number
    intensity: number
    /** Inhalt während der Analyse abschwächen (0–1) */
    dim: number
    colors: [string, string, string]
    /** Schimmer: Winkel und Breite des Lichtstreifens */
    angle: number
    band: number
    /** Rand: Breite und Glow */
    borderWidth: number
    glow: number
    /** Aura: Ausdehnung */
    spread: number
    /** Schleier: Farbe, Grundschleier während der ganzen Analyse und Breite eines Pulses */
    veilColor: string
    haze: number
    pulseWidth: number
  }
  flag: {
    in: Step
    out: Step
    twinkle: number
    /** Erscheinen: nur einblenden, mit leichtem Zoom oder aus der Kante schieben */
    appear: FlagAppear
    /** Lage: als Reiter auf der Oberkante, als Badge auf der Ecke oder innen in der Kachel */
    placement: FlagPlacement
    offsetX: number
    offsetY: number
    height: number
    paddingX: number
    radius: number
    /** Füllung: Verlauf aus den Effektfarben oder eine Farbe */
    gradient: boolean
    color: string
    iconColor: string
    iconSize: number
    /** Text neben den Sternen (leer = nur Sterne) */
    label: string
    shadow: number
  }
  /** Sprache in der Meta-Zeile wird nach der Analyse hineingeschrieben */
  language: Step
  chips: { in: Step; stagger: number; out: Step }
  chevron: { in: Step; rotate: Step }
  toc: {
    start: number
    /** Jede Zeile wächst in dieser Zeit auf ihre Höhe */
    rowGrow: number
    rowEasing: Bezier
    /** Dauer der ganzen Einblendung: Nach dieser Zeit ist die letzte Zeile fertig */
    duration: number
    /** Verteilung der Zeilen über die Dauer (linear = gleichmässig, ease-out = erst schnell, dann langsamer) */
    easing: Bezier
    /** Tippgeschwindigkeit in Zeichen pro Sekunde */
    cps: number
    /** Leitlinie, Sprache und Seiten erscheinen nach dem Titel in dieser Zeit */
    metaFade: number
  }
  /** Stapel hinter der Kachel: deutet an, dass es viele Dokumente gibt */
  stack: { count: number; offset: number; inset: number; fade: number }
  /** Einstieg: Kachel kommt mit leichtem Federn von unten, die Kacheln des Stapels etwas später */
  intro: { step: Step; distance: number; stagger: number; fade: boolean }
  /** Pause am Ende, bevor die Schleife neu beginnt */
  hold: number
  /** Ende der Animation von Hand festlegen (sonst letzter Schritt + Pause) */
  endManual: boolean
  end: number
  stage: { background: string; gradient: boolean; gradientColors: [string, string]; aspect: Aspect; canvasWidth: number; canvasHeight: number; zoom: number; width: number; top: number; paddingY: number; paddingX: number }
  /** Video-Export */
  export: { fps: number; bitrate: number; resolution: ExportResolution }
}

const step = (start: number, duration: number, easing: Bezier): Step => ({ start, duration, easing })

export const DEFAULT_CONFIG: Config = {
  effect: {
    variant: 'veil',
    in: step(600, 600, EASING_PRESETS['ease-out']),
    out: step(4600, 600, EASING_PRESETS['ease-in-out']),
    period: 2000,
    intensity: 0.4,
    dim: 0,
    // Türkis und Gelbgrün wie im Referenzvideo
    colors: ['#14afb8', '#7cc6d6', '#cdbe4d'],
    angle: 110,
    band: 45,
    borderWidth: 1.5,
    glow: 8,
    spread: 16,
    veilColor: '#e3f1f7',
    haze: 0.12,
    pulseWidth: 650,
  },
  flag: {
    in: step(700, 350, EASING_PRESETS['ease-out']),
    out: step(4700, 300, EASING_PRESETS['ease-in']),
    twinkle: 1400,
    appear: 'fade',
    placement: 'tab',
    offsetX: 16,
    offsetY: 0,
    height: 24,
    paddingX: 9,
    radius: 6,
    gradient: true,
    color: '#14afb8',
    iconColor: '#ffffff',
    iconSize: 16,
    label: '',
    shadow: 0,
  },
  language: step(4900, 300, EASING_PRESETS.linear),
  chips: { in: step(5000, 350, EASING_PRESETS['back-out']), stagger: 90, out: step(6300, 250, EASING_PRESETS['ease-in']) },
  chevron: { in: step(5100, 300, EASING_PRESETS['ease-out']), rotate: step(6300, 400, EASING_PRESETS.swissgeol) },
  toc: { start: 6350, duration: 2400, easing: EASING_PRESETS.linear, rowGrow: 280, rowEasing: EASING_PRESETS.swissgeol, cps: 70, metaFade: 220 },
  stack: { count: 2, offset: 8, inset: 14, fade: 0.25 },
  intro: { step: step(0, 700, [0.34, 1.4, 0.64, 1]), distance: 24, stagger: 90, fade: false },
  hold: 2000,
  endManual: false,
  end: 10000,
  stage: { background: '#eef0f3', gradient: false, gradientColors: ['#009db9', '#cdbe4d'], aspect: '16:9', canvasWidth: 1920, canvasHeight: 1080, zoom: 1.4, width: 496, top: 22, paddingY: 24, paddingX: 27 },
  export: { fps: 60, bitrate: 16, resolution: 'canvas' },
}

/** Zeilen des Inhaltsverzeichnisses in Lesereihenfolge */
export type TocRow = { kind: 'group'; text: string; first: boolean } | { kind: 'entry'; text: string; language?: string; pages: string }

/** Eigene Dauer einer Zeile in normalem Tempo: wachsen, tippen, Metadaten einblenden */
function rowOwnDuration(config: Config, row: TocRow) {
  const typed = (row.text.length / Math.max(1, config.toc.cps)) * 1000 + (row.kind === 'entry' ? config.toc.metaFade : 0)
  return Math.max(config.toc.rowGrow, typed)
}

export type TocLayout = {
  /** Startzeit jeder Zeile */
  starts: number[]
  /** Zeitfaktor für Wachsen, Tippen und Metadaten (< 1, wenn die Dauer kürzer ist als das normale Tempo) */
  scale: number
}

const layouts = new WeakMap<Config, TocLayout>()

/**
 * Verteilt die Zeilen so über die eingestellte Dauer, dass die letzte genau am Ende fertig ist.
 * Die Kurve bestimmt, wann welche Zeile startet; ist die Dauer zu kurz, wird alles schneller.
 */
export function tocLayout(config: Config, rows: TocRow[]): TocLayout {
  const cached = layouts.get(config)
  if (cached && cached.starts.length === rows.length) return cached
  const { start, duration, easing } = config.toc
  const curve = cubicBezier(easing)
  const own = rows.map((row) => rowOwnDuration(config, row))
  const share = rows.map((_, index) => (rows.length > 1 ? curve(index / (rows.length - 1)) : 0))
  const finish = (spread: number, scale: number) => Math.max(0, ...own.map((d, i) => spread * share[i] + d * scale))
  let layout: TocLayout
  const longest = Math.max(1, ...own)
  if (longest >= duration) {
    layout = { starts: rows.map(() => start), scale: Math.max(0.05, duration / longest) }
  } else {
    // Verteilung so weit strecken, bis die zuletzt fertige Zeile auf die Dauer fällt
    let lo = 0
    let hi = duration * 4
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2
      if (finish(mid, 1) > duration) hi = mid
      else lo = mid
    }
    layout = { starts: share.map((value) => start + lo * value), scale: 1 }
  }
  layouts.set(config, layout)
  return layout
}

export function tocEnd(config: Config) {
  return config.toc.start + config.toc.duration
}

const end = (s: Step) => s.start + s.duration

/** Gesamtdauer inklusive Pause am Ende */
export function totalDuration(config: Config, chipCount: number) {
  const ends = [
    end(config.intro.step) + config.stack.count * config.intro.stagger, end(config.effect.in), end(config.effect.out), end(config.flag.in), end(config.flag.out), end(config.language),
    end(config.chips.in) + Math.max(0, chipCount - 1) * config.chips.stagger, end(config.chips.out),
    end(config.chevron.in), end(config.chevron.rotate), tocEnd(config),
  ]
  if (config.endManual) return Math.max(100, config.end)
  return Math.max(...ends) + config.hold
}

/** Fehlende Werte (z.B. aus einem älteren Link) mit den Standardwerten auffüllen */
function merge<T>(base: T, value: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(value) && value.length === base.length ? value : base) as T
  if (base && typeof base === 'object') {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) }
    if (value && typeof value === 'object') {
      for (const key of Object.keys(result)) result[key] = merge(result[key], (value as Record<string, unknown>)[key])
    }
    return result as T
  }
  return (typeof value === typeof base ? value : base) as T
}

/** Einstellungen im Link (?cfg=…, base64url-codiertes JSON) */
export function encodeConfig(config: Config) {
  const bytes = new TextEncoder().encode(JSON.stringify(config))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeConfig(value: string | null): Config {
  if (!value) return DEFAULT_CONFIG
  try {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
    return merge(DEFAULT_CONFIG, JSON.parse(new TextDecoder().decode(bytes)))
  } catch {
    return DEFAULT_CONFIG
  }
}

export function parseConfigJson(text: string): Config | null {
  try {
    return merge(DEFAULT_CONFIG, JSON.parse(text))
  } catch {
    return null
  }
}

/** Hex-Farbe mit Deckkraft */
export function alpha(hex: string, opacity: number) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, opacity))})`
}

/** Weicher Puls (angehobener Kosinus) einmal pro Durchlauf: 0 in Ruhe, 1 auf dem Höhepunkt */
export function pulse(elapsed: number, period: number, width: number) {
  if (elapsed < 0) return 0
  const local = elapsed % Math.max(1, period)
  const half = Math.max(1, width) / 2
  const distance = Math.abs(local - half) / half
  return distance >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * distance)
}
