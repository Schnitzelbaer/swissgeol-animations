import type { CSSProperties } from 'react'
import styles from './SegmentedControl.module.css'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
}

/**
 * Segmented Control (eigene Komponente, nicht im Designsystem): graue Schiene, die gewählte Option als weisses Feld,
 * das beim Wechsel hinübergleitet. Pfeiltasten wechseln wie bei Radio-Buttons.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, 'aria-label': label }: Props<T>) {
  const index = Math.max(0, options.findIndex((option) => option.value === value))
  const move = (step: number) => onChange(options[(index + step + options.length) % options.length].value)
  return (
    <div
      className={styles.control}
      role="radiogroup"
      aria-label={label}
      style={{ '--count': options.length, '--index': index } as CSSProperties}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') move(1)
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') move(-1)
        else return
        event.preventDefault()
      }}
    >
      <span className={styles.thumb} aria-hidden="true" />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          className={`${styles.option} body3-medium`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
