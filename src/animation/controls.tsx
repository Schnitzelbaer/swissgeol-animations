import { useRef, useState, type ReactNode } from 'react'
import { EASING_PRESETS, cubicBezier, presetName, type Bezier, type Step } from './timeline'
import styles from './controls.module.css'

/* Bausteine des Control-Panels. Werkzeug für Aufnahmen, nicht Teil der swissgeol-Oberfläche: Beschriftung deutsch. */

export function Group({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className={styles.group}>
      <button type="button" className={styles.groupHeader} onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className={styles.groupChevron} data-open={open}>
          ▸
        </span>
        {title}
      </button>
      {open && <div className={styles.groupBody}>{children}</div>}
    </section>
  )
}

export function SubTitle({ children }: { children: ReactNode }) {
  return <div className={styles.subTitle}>{children}</div>
}

type NumberProps = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  onChange: (value: number) => void
}

/** Regler mit Zahlenfeld */
export function NumberField({ label, value, min, max, step = 1, unit, onChange }: NumberProps) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input className={styles.range} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className={styles.numberWrap}>
        <input
          className={styles.number}
          type="number"
          min={min}
          step={step}
          value={Math.round(value * 1000) / 1000}
          onChange={(e) => {
            const next = Number(e.target.value)
            if (Number.isFinite(next)) onChange(next)
          }}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
    </label>
  )
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input className={styles.color} type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span className={styles.mono}>{value}</span>
    </label>
  )
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (value: T) => void }) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.segmented}>
        {options.map(([key, text]) => (
          <button key={key} type="button" className={styles.segment} data-active={key === value} onClick={() => onChange(key)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Kurve wählen: Vorlage oder eigene Bézier-Kurve mit ziehbaren Anfassern */
export function EasingField({ label = 'Kurve', value, onChange }: { label?: string; value: Bezier; onChange: (value: Bezier) => void }) {
  const [edit, setEdit] = useState(false)
  const name = presetName(value)
  return (
    <div className={styles.easing}>
      <div className={styles.field}>
        <span className={styles.label}>{label}</span>
        <select className={styles.select} value={name} onChange={(e) => e.target.value !== 'custom' && onChange([...EASING_PRESETS[e.target.value]] as Bezier)}>
          {Object.keys(EASING_PRESETS).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
          <option value="custom">eigene</option>
        </select>
        <button type="button" className={styles.curveButton} onClick={() => setEdit(!edit)} aria-expanded={edit} title="Kurve bearbeiten">
          <CurvePreview value={value} />
        </button>
      </div>
      {edit && <BezierEditor value={value} onChange={onChange} />}
    </div>
  )
}

function curvePath(value: Bezier, map: (x: number, y: number) => [number, number], samples = 40) {
  const fn = cubicBezier(value)
  const points = Array.from({ length: samples + 1 }, (_, i) => map(i / samples, fn(i / samples)))
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
}

function CurvePreview({ value }: { value: Bezier }) {
  const map = (x: number, y: number): [number, number] => [3 + x * 30, 25 - y * 18]
  return (
    <svg viewBox="0 0 36 30" width="36" height="30" aria-hidden>
      <path d={curvePath(value, map, 24)} fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

const SIZE = 200
const PAD = 16
const Y_MIN = -0.5
const Y_MAX = 1.5

function BezierEditor({ value, onChange }: { value: Bezier; onChange: (value: Bezier) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const inner = SIZE - 2 * PAD
  const toPx = (x: number, y: number): [number, number] => [PAD + x * inner, PAD + ((Y_MAX - y) / (Y_MAX - Y_MIN)) * inner]
  const fromPx = (px: number, py: number): [number, number] => [
    Math.min(1, Math.max(0, (px - PAD) / inner)),
    Math.min(Y_MAX, Math.max(Y_MIN, Y_MAX - ((py - PAD) / inner) * (Y_MAX - Y_MIN))),
  ]
  const [x1, y1, x2, y2] = value
  const p0 = toPx(0, 0)
  const p3 = toPx(1, 1)
  const h1 = toPx(x1, y1)
  const h2 = toPx(x2, y2)

  const drag = (handle: 0 | 1) => (event: React.PointerEvent) => {
    event.preventDefault()
    const svg = svgRef.current!
    const move = (e: PointerEvent) => {
      const rect = svg.getBoundingClientRect()
      const [x, y] = fromPx(((e.clientX - rect.left) / rect.width) * SIZE, ((e.clientY - rect.top) / rect.height) * SIZE)
      const next = [...value] as Bezier
      next[handle * 2] = Math.round(x * 100) / 100
      next[handle * 2 + 1] = Math.round(y * 100) / 100
      onChange(next)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div className={styles.bezier}>
      <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.bezierSvg}>
        <rect x={PAD} y={toPx(0, 1)[1]} width={inner} height={toPx(0, 0)[1] - toPx(0, 1)[1]} className={styles.bezierBox} />
        <path d={curvePath(value, toPx)} className={styles.bezierCurve} />
        <line x1={p0[0]} y1={p0[1]} x2={h1[0]} y2={h1[1]} className={styles.bezierArm} />
        <line x1={p3[0]} y1={p3[1]} x2={h2[0]} y2={h2[1]} className={styles.bezierArm} />
        <circle cx={h1[0]} cy={h1[1]} r="7" className={styles.bezierHandle} onPointerDown={drag(0)} />
        <circle cx={h2[0]} cy={h2[1]} r="7" className={styles.bezierHandle} onPointerDown={drag(1)} />
      </svg>
      <div className={styles.bezierValues}>
        {value.map((v, i) => (
          <input
            key={i}
            type="number"
            step={0.01}
            className={styles.number}
            value={v}
            onChange={(e) => {
              const next = [...value] as Bezier
              next[i] = Number(e.target.value)
              onChange(next)
            }}
          />
        ))}
      </div>
      <span className={styles.mono}>cubic-bezier({value.join(', ')})</span>
    </div>
  )
}

/** Start, Dauer und Kurve eines Schritts */
export function StepFields({ title, value, onChange, easing = true, max = 15000 }: { title: string; value: Step; onChange: (value: Step) => void; easing?: boolean; max?: number }) {
  return (
    <div className={styles.step}>
      <SubTitle>{title}</SubTitle>
      <NumberField label="Start" value={value.start} min={0} max={max} step={10} unit="ms" onChange={(start) => onChange({ ...value, start })} />
      <NumberField label="Dauer" value={value.duration} min={0} max={4000} step={10} unit="ms" onChange={(duration) => onChange({ ...value, duration })} />
      {easing && <EasingField value={value.easing} onChange={(curve) => onChange({ ...value, easing: curve })} />}
    </div>
  )
}
