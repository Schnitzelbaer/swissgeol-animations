import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { initialFiles } from '../data/files'
import { AnimatedDocumentCard, useDocumentContent } from './AnimatedDocumentCard'
import { ColorField, Group, NumberField, Segmented, StepFields, SubTitle, TextField, Toggle, EasingField } from './controls'
import { Timeline, type Lane } from './Timeline'
import { DEFAULT_CONFIG, decodeConfig, encodeConfig, parseConfigJson, tocEnd, totalDuration, type Aspect, type Config, type EffectVariant, type FlagAppear, type FlagPlacement } from './timeline'
import styles from './AiAnalysisPage.module.css'

const FILE = initialFiles.find((file) => file.id === '4841')!

/* Einstellungen bleiben im Browser gespeichert und sind nach dem Neuladen wieder da; ein Link mit ?cfg= hat Vorrang */
const STORAGE_KEY = 'swissgeol-animation-ai-analysis'

type Stored = { config?: unknown; loop?: boolean; speed?: number }

function readStored(): Stored {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Stored
  } catch {
    return {}
  }
}

function writeStored(value: Stored) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Speicher nicht verfügbar (z.B. privates Fenster): Einstellungen bleiben nur im Link
  }
}

function initialConfig(): Config {
  const fromLink = new URLSearchParams(window.location.search).get('cfg')
  if (fromLink) return decodeConfig(fromLink)
  const stored = readStored().config
  return (stored ? parseConfigJson(JSON.stringify(stored)) : null) ?? DEFAULT_CONFIG
}

const ASPECTS: Record<Exclude<Aspect, 'frei'>, number> = { '16:9': 16 / 9, '1:1': 1, '4:5': 4 / 5, '9:16': 9 / 16 }
const REFERENCE_WIDTH: Record<Exclude<Aspect, 'frei'>, number> = { '16:9': 1440, '1:1': 1080, '4:5': 1080, '9:16': 1080 }

/**
 * Isolierte Ansicht für die Animation «AI-Analyse eines Dokuments» (Route /animation/ai-analysis).
 * Unabhängig vom übrigen Prototyp; alle Einstellungen stehen im Link (?cfg=…).
 */
export function AiAnalysisPage() {
  const [config, setConfig] = useState<Config>(initialConfig)
  // ?t=<ms> zeigt ein Standbild zu diesem Zeitpunkt
  const [initialTime] = useState(() => new URLSearchParams(window.location.search).get('t'))
  const [time, setTime] = useState(() => Number(initialTime ?? 0) || 0)
  const [playing, setPlaying] = useState(initialTime === null)
  const [loop, setLoop] = useState(() => readStored().loop ?? true)
  const [speed, setSpeed] = useState(() => readStored().speed ?? 1)
  const [uiHidden, setUiHidden] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const { rows, chips } = useDocumentContent(FILE)
  const total = useMemo(() => totalDuration(config, rows, chips.length), [config, rows, chips.length])

  /** Änderung an einer Kopie der Einstellungen */
  const update = useCallback((change: (draft: Config) => void) => {
    setConfig((current) => {
      const draft = structuredClone(current)
      change(draft)
      return draft
    })
  }, [])

  // Wiedergabe: Zeit läuft mit requestAnimationFrame, Schleife oder Halt am Ende
  const totalRef = useRef(total)
  const loopRef = useRef(loop)
  const speedRef = useRef(speed)
  useEffect(() => {
    totalRef.current = total
    loopRef.current = loop
    speedRef.current = speed
  }, [total, loop, speed])
  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const delta = (now - last) * speedRef.current
      last = now
      setTime((current) => {
        const next = current + delta
        if (next < totalRef.current) return next
        if (loopRef.current) return 0
        setPlaying(false)
        return totalRef.current
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing])

  // Einstellungen im Link festhalten (verzögert, damit Regler flüssig bleiben)
  useEffect(() => {
    const id = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (JSON.stringify(config) === JSON.stringify(DEFAULT_CONFIG)) params.delete('cfg')
      else params.set('cfg', encodeConfig(config))
      const query = params.toString()
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
      writeStored({ config, loop, speed })
    }, 300)
    return () => window.clearTimeout(id)
  }, [config, loop, speed])

  const restart = useCallback(() => {
    setTime(0)
    setPlaying(true)
  }, [])

  // Tastatur: Leertaste Play/Pause, R Neustart, H Panels, Pfeile ±100 ms
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
      if (event.key === ' ') {
        event.preventDefault()
        setPlaying((value) => !value)
      } else if (event.key === 'r' || event.key === 'R') restart()
      else if (event.key === 'h' || event.key === 'H') setUiHidden((value) => !value)
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        setPlaying(false)
        const step = event.shiftKey ? 1000 : 100
        setTime((value) => Math.min(totalRef.current, Math.max(0, value + (event.key === 'ArrowLeft' ? -step : step))))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [restart])

  const seek = (value: number) => {
    setPlaying(false)
    setTime(value)
  }

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
    } catch {
      setCopied('Kopieren nicht möglich')
    }
    window.setTimeout(() => setCopied(null), 1600)
  }

  const { effect, flag, chips: chipSteps, chevron, toc, stage } = config
  const lanes: Lane[] = [
    { id: 'fx-in', label: 'Effekt ein', color: '#6366f1', start: effect.in.start, end: effect.in.start + effect.in.duration, onMove: (v) => update((d) => void (d.effect.in.start = v)), onResize: (v) => update((d) => void (d.effect.in.duration = v)) },
    { id: 'fx-out', label: 'Effekt aus', color: '#6366f1', start: effect.out.start, end: effect.out.start + effect.out.duration, onMove: (v) => update((d) => void (d.effect.out.start = v)), onResize: (v) => update((d) => void (d.effect.out.duration = v)) },
    { id: 'flag-in', label: 'Fähnchen ein', color: '#a855f7', start: flag.in.start, end: flag.in.start + flag.in.duration, onMove: (v) => update((d) => void (d.flag.in.start = v)), onResize: (v) => update((d) => void (d.flag.in.duration = v)) },
    { id: 'flag-out', label: 'Fähnchen aus', color: '#a855f7', start: flag.out.start, end: flag.out.start + flag.out.duration, onMove: (v) => update((d) => void (d.flag.out.start = v)), onResize: (v) => update((d) => void (d.flag.out.duration = v)) },
    { id: 'lang', label: 'Sprache tippen', color: '#14afb8', start: config.language.start, end: config.language.start + config.language.duration, onMove: (v) => update((d) => void (d.language.start = v)), onResize: (v) => update((d) => void (d.language.duration = v)) },
    { id: 'chips-in', label: 'Chips ein', color: '#f59e0b', start: chipSteps.in.start, end: chipSteps.in.start + chipSteps.in.duration + (chips.length - 1) * chipSteps.stagger, onMove: (v) => update((d) => void (d.chips.in.start = v)), onResize: (v) => update((d) => void (d.chips.in.duration = Math.max(0, v - (chips.length - 1) * d.chips.stagger))) },
    { id: 'chevron-in', label: 'Pfeil ein', color: '#337083', start: chevron.in.start, end: chevron.in.start + chevron.in.duration, onMove: (v) => update((d) => void (d.chevron.in.start = v)), onResize: (v) => update((d) => void (d.chevron.in.duration = v)) },
    { id: 'chips-out', label: 'Chips aus', color: '#f59e0b', start: chipSteps.out.start, end: chipSteps.out.start + chipSteps.out.duration, onMove: (v) => update((d) => void (d.chips.out.start = v)), onResize: (v) => update((d) => void (d.chips.out.duration = v)) },
    { id: 'chevron-rotate', label: 'Pfeil drehen', color: '#337083', start: chevron.rotate.start, end: chevron.rotate.start + chevron.rotate.duration, onMove: (v) => update((d) => void (d.chevron.rotate.start = v)), onResize: (v) => update((d) => void (d.chevron.rotate.duration = v)) },
    { id: 'toc', label: 'Inhaltsverzeichnis', color: '#10b981', start: toc.start, end: tocEnd(config, rows), onMove: (v) => update((d) => void (d.toc.start = v)) },
  ]

  return (
    <div className={`${styles.page} ${uiHidden ? styles.uiHidden : ''}`}>
      <Stage config={config} time={time} />

      {!uiHidden && (
        <>
          <aside className={styles.panel} aria-label="Einstellungen">
            <header className={styles.panelHeader}>
              <strong>AI-Analyse · Dokument</strong>
              <div className={styles.panelActions}>
                <button type="button" onClick={() => copy(window.location.href, 'Link kopiert')}>
                  Link kopieren
                </button>
                <button type="button" onClick={() => copy(JSON.stringify(config, null, 2), 'JSON kopiert')}>
                  JSON
                </button>
                <button type="button" onClick={() => setConfig(DEFAULT_CONFIG)}>
                  Zurücksetzen
                </button>
              </div>
              {copied && <span className={styles.copied}>{copied}</span>}
            </header>

            <div className={styles.panelScroll}>
              <Group title="Effekt während der Analyse">
                <Segmented<EffectVariant>
                  label="Variante"
                  value={effect.variant}
                  options={[['veil', 'Schleier'], ['shimmer', 'Schimmer'], ['border', 'Rand'], ['aura', 'Aura']]}
                  onChange={(v) => update((d) => void (d.effect.variant = v))}
                />
                <NumberField label="Intensität" value={effect.intensity} min={0} max={1} step={0.05} onChange={(v) => update((d) => void (d.effect.intensity = v))} />
                <NumberField label="Inhalt dimmen" value={effect.dim} min={0} max={0.6} step={0.05} onChange={(v) => update((d) => void (d.effect.dim = v))} />
                <NumberField label="Durchlauf" value={effect.period} min={300} max={6000} step={50} unit="ms" onChange={(v) => update((d) => void (d.effect.period = v))} />
                {effect.variant === 'veil' && (
                  <>
                    <NumberField label="Grundschleier" value={effect.haze} min={0} max={0.6} step={0.01} onChange={(v) => update((d) => void (d.effect.haze = v))} />
                    <NumberField label="Pulsbreite" value={effect.pulseWidth} min={100} max={3000} step={10} unit="ms" onChange={(v) => update((d) => void (d.effect.pulseWidth = v))} />
                    <ColorField label="Schleierfarbe" value={effect.veilColor} onChange={(v) => update((d) => void (d.effect.veilColor = v))} />
                  </>
                )}
                {effect.variant === 'shimmer' && (
                  <>
                    <NumberField label="Winkel" value={effect.angle} min={0} max={180} unit="°" onChange={(v) => update((d) => void (d.effect.angle = v))} />
                    <NumberField label="Breite" value={effect.band} min={5} max={80} unit="%" onChange={(v) => update((d) => void (d.effect.band = v))} />
                  </>
                )}
                {effect.variant === 'border' && (
                  <>
                    <NumberField label="Randbreite" value={effect.borderWidth} min={1} max={6} step={0.5} unit="px" onChange={(v) => update((d) => void (d.effect.borderWidth = v))} />
                    <NumberField label="Glow" value={effect.glow} min={0} max={40} unit="px" onChange={(v) => update((d) => void (d.effect.glow = v))} />
                  </>
                )}
                {effect.variant === 'aura' && <NumberField label="Ausdehnung" value={effect.spread} min={4} max={80} unit="px" onChange={(v) => update((d) => void (d.effect.spread = v))} />}
                {effect.colors.map((color, index) => (
                  <ColorField key={index} label={`Farbe ${index + 1}`} value={color} onChange={(v) => update((d) => void (d.effect.colors[index] = v))} />
                ))}
                <StepFields title="Einblenden (Analyse startet)" value={effect.in} onChange={(v) => update((d) => void (d.effect.in = v))} />
                <StepFields title="Ausblenden (Analyse fertig)" value={effect.out} onChange={(v) => update((d) => void (d.effect.out = v))} />
              </Group>

              <Group title="Fähnchen mit AI-Sternen">
                <Segmented<FlagAppear>
                  label="Erscheinen"
                  value={flag.appear}
                  options={[['fade', 'Einblenden'], ['scale', 'Zoom'], ['slide', 'Schieben']]}
                  onChange={(v) => update((d) => void (d.flag.appear = v))}
                />
                <Segmented<FlagPlacement>
                  label="Lage"
                  value={flag.placement}
                  options={[['tab', 'Reiter'], ['corner', 'Ecke'], ['inside', 'Innen']]}
                  onChange={(v) => update((d) => void (d.flag.placement = v))}
                />
                <NumberField label="Von rechts" value={flag.offsetX} min={-40} max={200} unit="px" onChange={(v) => update((d) => void (d.flag.offsetX = v))} />
                <NumberField label="Versatz Y" value={flag.offsetY} min={-40} max={40} unit="px" onChange={(v) => update((d) => void (d.flag.offsetY = v))} />
                <NumberField label="Höhe" value={flag.height} min={14} max={48} unit="px" onChange={(v) => update((d) => void (d.flag.height = v))} />
                <NumberField label="Innenabstand" value={flag.paddingX} min={0} max={24} unit="px" onChange={(v) => update((d) => void (d.flag.paddingX = v))} />
                <NumberField label="Radius" value={flag.radius} min={0} max={24} unit="px" onChange={(v) => update((d) => void (d.flag.radius = v))} />
                <Toggle label="Verlauf" value={flag.gradient} onChange={(v) => update((d) => void (d.flag.gradient = v))} />
                {!flag.gradient && <ColorField label="Farbe" value={flag.color} onChange={(v) => update((d) => void (d.flag.color = v))} />}
                <ColorField label="Sterne" value={flag.iconColor} onChange={(v) => update((d) => void (d.flag.iconColor = v))} />
                <NumberField label="Sterngrösse" value={flag.iconSize} min={8} max={32} unit="px" onChange={(v) => update((d) => void (d.flag.iconSize = v))} />
                <TextField label="Text" value={flag.label} placeholder="z.B. AI-Analyse" onChange={(v) => update((d) => void (d.flag.label = v))} />
                <NumberField label="Schatten" value={flag.shadow} min={0} max={1} step={0.05} onChange={(v) => update((d) => void (d.flag.shadow = v))} />
                <NumberField label="Funkeln" value={flag.twinkle} min={0} max={4000} step={50} unit="ms" onChange={(v) => update((d) => void (d.flag.twinkle = v))} />
                <StepFields title="Einblenden" value={flag.in} onChange={(v) => update((d) => void (d.flag.in = v))} />
                <StepFields title="Ausblenden" value={flag.out} onChange={(v) => update((d) => void (d.flag.out = v))} />
              </Group>

              <Group title="Sprache in der Meta-Zeile" defaultOpen={false}>
                <StepFields title="Tippen" value={config.language} easing={false} onChange={(v) => update((d) => void (d.language = v))} />
              </Group>

              <Group title="Chips und Pfeil" defaultOpen={false}>
                <NumberField label="Versatz" value={chipSteps.stagger} min={0} max={500} step={10} unit="ms" onChange={(v) => update((d) => void (d.chips.stagger = v))} />
                <StepFields title="Chips einblenden" value={chipSteps.in} onChange={(v) => update((d) => void (d.chips.in = v))} />
                <StepFields title="Chips ausblenden" value={chipSteps.out} onChange={(v) => update((d) => void (d.chips.out = v))} />
                <StepFields title="Pfeil einblenden" value={chevron.in} onChange={(v) => update((d) => void (d.chevron.in = v))} />
                <StepFields title="Pfeil drehen" value={chevron.rotate} onChange={(v) => update((d) => void (d.chevron.rotate = v))} />
              </Group>

              <Group title="Inhaltsverzeichnis">
                <NumberField label="Start" value={toc.start} min={0} max={15000} step={10} unit="ms" onChange={(v) => update((d) => void (d.toc.start = v))} />
                <NumberField label="Zeilenversatz" value={toc.stagger} min={0} max={1500} step={10} unit="ms" onChange={(v) => update((d) => void (d.toc.stagger = v))} />
                <NumberField label="Zeile wächst" value={toc.rowGrow} min={0} max={1500} step={10} unit="ms" onChange={(v) => update((d) => void (d.toc.rowGrow = v))} />
                <EasingField label="Kurve" value={toc.rowEasing} onChange={(v) => update((d) => void (d.toc.rowEasing = v))} />
                <NumberField label="Tippen" value={toc.cps} min={5} max={300} step={5} unit="Z/s" onChange={(v) => update((d) => void (d.toc.cps = v))} />
                <NumberField label="Seiten ein" value={toc.metaFade} min={0} max={1500} step={10} unit="ms" onChange={(v) => update((d) => void (d.toc.metaFade = v))} />
                <Toggle label="Schreibmarke" value={toc.cursor} onChange={(v) => update((d) => void (d.toc.cursor = v))} />
              </Group>

              <Group title="Bühne" defaultOpen={false}>
                <Segmented<Aspect>
                  label="Format"
                  value={stage.aspect}
                  options={[['frei', 'frei'], ['16:9', '16:9'], ['1:1', '1:1'], ['4:5', '4:5'], ['9:16', '9:16']]}
                  onChange={(v) => update((d) => void (d.stage.aspect = v))}
                />
                <ColorField label="Hintergrund" value={stage.background} onChange={(v) => update((d) => void (d.stage.background = v))} />
                <Toggle label="Verlauf" value={stage.gradient} onChange={(v) => update((d) => void (d.stage.gradient = v))} />
                {stage.gradient &&
                  stage.gradientColors.map((color, index) => (
                    <ColorField key={index} label={`Verlauf ${index + 1}`} value={color} onChange={(v) => update((d) => void (d.stage.gradientColors[index] = v))} />
                  ))}
                <NumberField label="Zoom" value={stage.zoom} min={0.5} max={3} step={0.05} unit="×" onChange={(v) => update((d) => void (d.stage.zoom = v))} />
                <NumberField label="Breite" value={stage.width} min={320} max={720} step={2} unit="px" onChange={(v) => update((d) => void (d.stage.width = v))} />
                <NumberField label="Oben" value={stage.top} min={0} max={80} unit="%" onChange={(v) => update((d) => void (d.stage.top = v))} />
                <SubTitle>Stapel</SubTitle>
                <NumberField label="Kacheln" value={config.stack.count} min={0} max={5} onChange={(v) => update((d) => void (d.stack.count = Math.round(v)))} />
                <NumberField label="Versatz" value={config.stack.offset} min={0} max={24} unit="px" onChange={(v) => update((d) => void (d.stack.offset = v))} />
                <NumberField label="Einzug" value={config.stack.inset} min={0} max={48} unit="px" onChange={(v) => update((d) => void (d.stack.inset = v))} />
                <NumberField label="Verblassen" value={config.stack.fade} min={0} max={0.5} step={0.05} onChange={(v) => update((d) => void (d.stack.fade = v))} />
                <SubTitle>Ablauf</SubTitle>
                <NumberField label="Pause am Ende" value={config.hold} min={0} max={8000} step={100} unit="ms" onChange={(v) => update((d) => void (d.hold = v))} />
              </Group>
            </div>
          </aside>

          <div className={styles.timeline}>
            <Timeline
              lanes={lanes}
              band={{ start: effect.in.start, end: effect.out.start + effect.out.duration, label: 'Analyse' }}
              time={time}
              total={total}
              playing={playing}
              loop={loop}
              speed={speed}
              onSeek={seek}
              onPlay={() => {
                if (!playing && time >= total) setTime(0)
                setPlaying(!playing)
              }}
              onRestart={restart}
              onLoop={setLoop}
              onSpeed={setSpeed}
            />
          </div>
        </>
      )}
    </div>
  )
}

/** Bühne im gewählten Format; die Kachel steht oben fest und wächst nach unten */
function Stage({ config, time }: { config: Config; time: number }) {
  const areaRef = useRef<HTMLDivElement>(null)
  const [area, setArea] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = areaRef.current!
    const observer = new ResizeObserver(([entry]) => setArea({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const { stage } = config
  let frame = { width: area.width, height: area.height }
  if (stage.aspect !== 'frei') {
    const ratio = ASPECTS[stage.aspect]
    const width = Math.min(area.width, area.height * ratio)
    frame = { width, height: width / ratio }
  }
  // Zoom bezieht sich auf eine Referenzbühne (16:9 = 1440 px breit, sonst 1080 px), damit Aufnahmen in jedem Fenster gleich aussehen
  const scale = stage.aspect === 'frei' ? stage.zoom : (frame.width / REFERENCE_WIDTH[stage.aspect]) * stage.zoom

  return (
    <div className={styles.stageArea} ref={areaRef}>
      <div
        className={styles.frame}
        style={{
          width: frame.width,
          height: frame.height,
          // Verlauf wie im Referenzvideo: Türkis links oben, Gelbgrün rechts unten
          background: stage.gradient
            ? `radial-gradient(90% 80% at 100% 75%, ${stage.gradientColors[1]} 0%, transparent 60%), linear-gradient(135deg, ${stage.gradientColors[0]} 0%, ${stage.gradientColors[0]} 45%, ${stage.gradientColors[1]} 120%)`
            : stage.background,
        } as CSSProperties}
      >
        <div className={styles.cardAnchor} style={{ top: `${stage.top}%`, transform: `translateX(-50%) scale(${scale})` }}>
          <AnimatedDocumentCard file={FILE} config={config} time={time} />
        </div>
      </div>
    </div>
  )
}
