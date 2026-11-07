import { useEffect, useRef, useState } from 'react'
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
  /** Ende ziehen legt es von Hand fest */
  endManual: boolean
  onEnd: (end: number) => void
  onPlay: () => void
  onRestart: () => void
  onLoop: (loop: boolean) => void
  onSpeed: (speed: number) => void
}

const SNAP = 10

export function Timeline({ lanes, band, time, total, playing, loop, speed, onSeek, endManual, onEnd, onPlay, onRestart, onLoop, onSpeed }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  // Massstab bleibt während des Ziehens fest, sonst springen die Balken
  const [frozenScale, setFrozenScale] = useState<number | null>(null)
  // Massstab bis hinter das letzte Element, auch wenn das Ende von Hand früher gesetzt ist
  const contentEnd = Math.max(total, band?.end ?? 0, ...lanes.map((lane) => lane.end))
  const scaleMax = frozenScale ?? Math.ceil((contentEnd + 500) / 1000) * 1000
  const pct = (ms: number) => `${(ms / scaleMax) * 100}%`

  const msAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect()
    return Math.min(scaleMax, Math.max(0, ((clientX - rect.left) / rect.width) * scaleMax))
  }

  // Ausgewählte Balken: Klick wählt, Shift/Cmd-Klick ergänzt, Rahmen ziehen wählt mehrere, Escape hebt auf
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const barRefs = useRef(new Map<string, HTMLDivElement>())
  const lanesRef = useRef(lanes)
  useEffect(() => {
    lanesRef.current = lanes
  }, [lanes])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) return
      if (event.key === 'Escape') setSelected(new Set())
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault()
        setSelected(new Set(lanesRef.current.filter((lane) => lane.onMove).map((lane) => lane.id)))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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

  /** Leere Fläche: Klick springt an die Stelle, Ziehen zieht einen Auswahlrahmen auf */
  const onLanesPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return
    const rect = trackRef.current!.getBoundingClientRect()
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    const before = additive ? new Set(selected) : new Set<string>()
    const x1 = event.clientX - rect.left
    const y1 = event.clientY - rect.top
    let dragging = false
    const move = (e: PointerEvent) => {
      const x2 = e.clientX - rect.left
      const y2 = e.clientY - rect.top
      if (!dragging && Math.hypot(x2 - x1, y2 - y1) < 4) return
      dragging = true
      setMarquee({ x1, y1, x2, y2 })
      const left = Math.min(x1, x2) + rect.left
      const right = Math.max(x1, x2) + rect.left
      const top = Math.min(y1, y2) + rect.top
      const bottom = Math.max(y1, y2) + rect.top
      const hit = new Set(before)
      for (const [id, element] of barRefs.current) {
        const bar = element.getBoundingClientRect()
        if (bar.right >= left && bar.left <= right && bar.bottom >= top && bar.top <= bottom) hit.add(id)
      }
      setSelected(hit)
    }
    const up = (e: PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setMarquee(null)
      if (!dragging) {
        if (!additive) setSelected(new Set())
        onSeek(msAt(e.clientX))
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /** Klick auf eine Spurbezeichnung wählt die Spur (Shift/Cmd ergänzt) */
  const selectLane = (lane: Lane, additive: boolean) => {
    setSelected((current) => {
      if (!additive) return new Set([lane.id])
      const next = new Set(current)
      if (next.has(lane.id)) next.delete(lane.id)
      else next.add(lane.id)
      return next
    })
  }

  const dragBar = (lane: Lane, mode: 'move' | 'resize') => (event: React.PointerEvent) => {
    event.stopPropagation()
    event.preventDefault()
    const handler = mode === 'move' ? lane.onMove : lane.onResize
    if (!handler) return
    const additive = event.shiftKey || event.metaKey || event.ctrlKey

    // Welche Balken bewegt werden: die Auswahl, wenn der gezogene Balken dazugehört
    let group = selected
    if (mode === 'move') {
      if (additive) {
        group = new Set(selected)
        if (group.has(lane.id)) {
          group.delete(lane.id)
          setSelected(group)
          return
        }
        group.add(lane.id)
      } else if (!selected.has(lane.id)) {
        group = new Set([lane.id])
      }
      setSelected(group)
    }
    const moving = mode === 'move' ? lanes.filter((l) => group.has(l.id) && l.onMove) : [lane]

    const origin = event.clientX
    const scale = scaleMax
    setFrozenScale(scale)
    const width = trackRef.current!.getBoundingClientRect().width
    const bases = moving.map((l) => (mode === 'move' ? l.start : l.end - l.start))
    const minBase = Math.min(...bases)
    const move = (e: PointerEvent) => {
      const delta = ((e.clientX - origin) / width) * scale
      const snap = e.shiftKey && !additive ? 100 : SNAP
      if (mode === 'resize' || moving.length === 1) {
        handler(Math.max(0, Math.round((bases[0] + delta) / snap) * snap))
        return
      }
      // Mehrere Balken: alle um denselben Betrag, keiner vor 0
      const step = Math.max(-minBase, Math.round(delta / snap) * snap)
      moving.forEach((l, index) => l.onMove!(bases[index] + step))
    }
    const up = () => {
      setFrozenScale(null)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  /** Ende-Linie ziehen: Ende von Hand, im 10-ms-Raster (Shift: 100 ms) */
  const dragEnd = (event: React.PointerEvent) => {
    event.stopPropagation()
    event.preventDefault()
    const scale = scaleMax
    setFrozenScale(scale)
    const move = (e: PointerEvent) => {
      const snap = e.shiftKey ? 100 : SNAP
      onEnd(Math.round(msAt(e.clientX) / snap) * snap)
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
        {selected.size > 1 && (
          <span className={styles.selection}>
            {selected.size} ausgewählt
            <button type="button" onClick={() => setSelected(new Set())}>
              aufheben
            </button>
          </span>
        )}
        <span className={styles.hint}>Balken ziehen: Start · rechte Kante: Dauer · Shift/Cmd-Klick oder Rahmen ziehen: mehrere wählen · ⌘A: alle · Esc: Auswahl aufheben · H: Panels aus</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.labels}>
          <div className={styles.rulerLabel} />
          {lanes.map((lane) => (
            <div
              key={lane.id}
              className={`${styles.laneLabel} ${selected.has(lane.id) ? styles.laneLabelSelected : ''}`}
              onClick={(e) => selectLane(lane, e.shiftKey || e.metaKey || e.ctrlKey)}
            >
              <span className={styles.swatch} style={{ background: lane.color }} />
              {lane.label}
            </div>
          ))}
        </div>
        <div className={styles.track} ref={trackRef} onPointerDown={onLanesPointerDown}>
          <div className={styles.ruler} onPointerDown={(e) => (e.stopPropagation(), scrub(e))}>
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
          <div
            className={`${styles.total} ${endManual ? styles.totalManual : ''}`}
            style={{ left: pct(total) }}
            title={endManual ? `Ende von Hand: ${Math.round(total)} ms (ziehen)` : 'Ende inkl. Pause (ziehen, um es von Hand festzulegen)'}
            onPointerDown={dragEnd}
          >
            <span className={styles.endLabel}>Ende</span>
          </div>
          {lanes.map((lane) => (
            <div key={lane.id} className={styles.lane}>
              <div
                ref={(element) => {
                  if (element) barRefs.current.set(lane.id, element)
                  else barRefs.current.delete(lane.id)
                }}
                className={`${styles.bar} ${lane.onMove ? styles.movable : ''} ${selected.has(lane.id) ? styles.selected : ''}`}
                style={{ left: pct(lane.start), width: `max(4px, ${pct(lane.end - lane.start)})`, background: lane.color }}
                onPointerDown={dragBar(lane, 'move')}
                title={`${Math.round(lane.start)} – ${Math.round(lane.end)} ms`}
              >
                {lane.onResize && <span className={styles.handle} onPointerDown={dragBar(lane, 'resize')} />}
              </div>
            </div>
          ))}
          <div className={styles.playhead} style={{ left: pct(time) }} />
          {marquee && (
            <div
              className={styles.marquee}
              style={{
                left: Math.min(marquee.x1, marquee.x2),
                top: Math.min(marquee.y1, marquee.y2),
                width: Math.abs(marquee.x2 - marquee.x1),
                height: Math.abs(marquee.y2 - marquee.y1),
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
