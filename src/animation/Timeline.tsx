import { useRef, useState } from 'react'
import styles from './Timeline.module.css'

export type Lane = {
  id: string
  label: string
  color: string
  start: number
  end: number
  /** Balken verschieben setzt den Start */
  onMove?: (start: number) => void
  /** Rechte Kante ziehen setzt die Dauer */
  onResize?: (duration: number) => void
}

type Props = {
  lanes: Lane[]
  /** Hinterlegter Bereich «Analyse läuft» */
  band?: { start: number; end: number; label: string }
  time: number
  total: number
  playing: boolean
  loop: boolean
  speed: number
  onSeek: (time: number) => void
  onPlay: () => void
  onRestart: () => void
  onLoop: (loop: boolean) => void
  onSpeed: (speed: number) => void
}

const SNAP = 10

export function Timeline({ lanes, band, time, total, playing, loop, speed, onSeek, onPlay, onRestart, onLoop, onSpeed }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  // Massstab bleibt während des Ziehens fest, sonst springen die Balken
  const [frozenScale, setFrozenScale] = useState<number | null>(null)
  const scaleMax = frozenScale ?? Math.ceil((total + 500) / 1000) * 1000
  const pct = (ms: number) => `${(ms / scaleMax) * 100}%`

  const msAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect()
    return Math.min(scaleMax, Math.max(0, ((clientX - rect.left) / rect.width) * scaleMax))
  }

  const scrub = (event: React.PointerEvent) => {
    if (event.button !== 0) return
    onSeek(msAt(event.clientX))
    const move = (e: PointerEvent) => onSeek(msAt(e.clientX))
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const dragBar = (lane: Lane, mode: 'move' | 'resize') => (event: React.PointerEvent) => {
    event.stopPropagation()
    event.preventDefault()
    const handler = mode === 'move' ? lane.onMove : lane.onResize
    if (!handler) return
    const origin = event.clientX
    const scale = scaleMax
    setFrozenScale(scale)
    const width = trackRef.current!.getBoundingClientRect().width
    const base = mode === 'move' ? lane.start : lane.end - lane.start
    const move = (e: PointerEvent) => {
      const delta = ((e.clientX - origin) / width) * scale
      const snap = e.shiftKey ? 100 : SNAP
      handler(Math.max(0, Math.round((base + delta) / snap) * snap))
    }
    const up = () => {
      setFrozenScale(null)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const ticks = Array.from({ length: Math.floor(scaleMax / 500) + 1 }, (_, i) => i * 500)

  return (
    <div className={styles.timeline}>
      <div className={styles.transport}>
        <button type="button" className={styles.play} onClick={onPlay} aria-label={playing ? 'Pause' : 'Abspielen'} title="Leertaste">
          {playing ? '❚❚' : '▶'}
        </button>
        <button type="button" className={styles.button} onClick={onRestart} title="R">
          ⟲ Neustart
        </button>
        <label className={styles.check}>
          <input type="checkbox" checked={loop} onChange={(e) => onLoop(e.target.checked)} /> Schleife
        </label>
        <label className={styles.check}>
          Tempo
          <select value={speed} onChange={(e) => onSpeed(Number(e.target.value))}>
            {[0.1, 0.25, 0.5, 1, 1.5, 2].map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </select>
        </label>
        <span className={styles.time}>
          {(time / 1000).toFixed(2)} s / {(total / 1000).toFixed(2)} s
        </span>
        <span className={styles.hint}>Balken ziehen: Start · rechte Kante: Dauer · Shift: 100-ms-Raster · H: Panels ausblenden</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.labels}>
          <div className={styles.rulerLabel} />
          {lanes.map((lane) => (
            <div key={lane.id} className={styles.laneLabel}>
              <span className={styles.swatch} style={{ background: lane.color }} />
              {lane.label}
            </div>
          ))}
        </div>
        <div className={styles.track} ref={trackRef} onPointerDown={scrub}>
          <div className={styles.ruler}>
            {ticks.map((tick) => (
              <span key={tick} className={tick % 1000 === 0 ? styles.tickMajor : styles.tick} style={{ left: pct(tick) }}>
                {tick % 1000 === 0 && <span className={styles.tickLabel}>{tick / 1000}s</span>}
              </span>
            ))}
          </div>
          {band && (
            <div className={styles.band} style={{ left: pct(band.start), width: pct(band.end - band.start) }}>
              <span>{band.label}</span>
            </div>
          )}
          <div className={styles.total} style={{ left: pct(total) }} title="Ende inkl. Pause" />
          {lanes.map((lane) => (
            <div key={lane.id} className={styles.lane}>
              <div
                className={`${styles.bar} ${lane.onMove ? styles.movable : ''}`}
                style={{ left: pct(lane.start), width: `max(4px, ${pct(lane.end - lane.start)})`, background: lane.color }}
                onPointerDown={dragBar(lane, 'move')}
                title={`${Math.round(lane.start)} – ${Math.round(lane.end)} ms`}
              >
                {lane.onResize && <span className={styles.handle} onPointerDown={dragBar(lane, 'resize')} />}
              </div>
            </div>
          ))}
          <div className={styles.playhead} style={{ left: pct(time) }} />
        </div>
      </div>
    </div>
  )
}
