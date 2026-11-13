import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../i18n'
import styles from './FormField.module.css'
import chevronIcon from '../assets/icons/chevron-down-select.svg'

type FieldProps = {
  label: string
  required?: boolean
  className?: string
  children: (id: string) => ReactNode
}

/** Feld mit Label («form / input / text v2»): Pflichtfelder mit rotem Sternchen */
function Field({ label, required, className, children }: FieldProps) {
  const { t } = useI18n()
  const id = useId()
  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <label htmlFor={id} className={styles.label}>
        <span className="body3-medium ellipsis">{label}</span>
        {required && (
          <span className={styles.required} title={t.form.required}>
            *<span className="visually-hidden"> ({t.form.required})</span>
          </span>
        )}
      </label>
      {children(id)}
    </div>
  )
}

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
}

/** Einzeiliger Text, der bei langem Inhalt in die Höhe wächst (Textarea ohne Zeilenumbruch per Enter) */
export function TextField({ label, value, onChange, placeholder, required, className }: TextFieldProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  // Höhe an den Inhalt anpassen, auch wenn sich die Breite ändert (z.B. beim Ziehen der Trennlinie)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const fit = () => {
      element.style.height = 'auto'
      element.style.height = `${element.scrollHeight + 2}px`
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(element)
    return () => observer.disconnect()
  }, [value])
  return (
    <Field label={label} required={required} className={className}>
      {(id) => (
        <textarea
          ref={ref}
          id={id}
          rows={1}
          className={`${styles.input} ${styles.grow}`}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value.replace(/\n/g, ' '))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault()
          }}
        />
      )}
    </Field>
  )
}

type SelectFieldProps<T extends string | number> = {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  required?: boolean
  className?: string
}

/** Treffer für den eingetippten Text: zuerst, was mit dem Text beginnt, dann, was ihn enthält */
function filterOptions<T>(options: { value: T; label: string }[], query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return options
  const starts = options.filter((option) => option.label.toLowerCase().startsWith(needle))
  const contains = options.filter((option) => !option.label.toLowerCase().startsWith(needle) && option.label.toLowerCase().includes(needle))
  return [...starts, ...contains]
}

/**
 * Auswahlfeld im swissgeol-Look mit Eingabe (Combobox): Tippen filtert die Liste, wählbar sind aber nur die Werte der
 * Liste. Enter oder Klick übernimmt den markierten Eintrag; verlässt man das Feld mit einem Text, der keinem Wert
 * entspricht, gilt wieder der bisherige Wert. Die Liste liegt im body, damit sie nicht von Karten abgeschnitten wird.
 */
export function SelectField<T extends string | number>({ label, value, options, onChange, required, className }: SelectFieldProps<T>) {
  const { t } = useI18n()
  const selected = options.find((option) => option.value === value)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState<string | null>(null)
  const [active, setActive] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const shown = query === null ? options : filterOptions(options, query)

  const openList = (all = query === null) => {
    const list = all ? options : shown
    const index = list.findIndex((option) => option.value === value)
    setActive(Math.max(0, index))
    setOpen(true)
  }
  const close = () => {
    setOpen(false)
    setQuery(null)
  }
  const choose = (option: { value: T; label: string } | undefined) => {
    if (option && option.value !== value) onChange(option.value)
    close()
  }

  // Lage der Liste: unter dem Feld (oder darüber, wenn unten der Platz fehlt), folgt beim Scrollen
  useLayoutEffect(() => {
    if (!open) return
    const update = () => setRect(boxRef.current?.getBoundingClientRect() ?? null)
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  // Markierten Eintrag sichtbar halten
  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) return openList()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => (shown.length ? (current + step + shown.length) % shown.length : 0))
    } else if (event.key === 'Enter') {
      if (!open) return
      event.preventDefault()
      choose(shown[active])
    } else if (event.key === 'Escape') {
      if (!open && query === null) return
      event.preventDefault()
      close()
    }
  }

  const onBlur = () => {
    if (query !== null) {
      const exact = options.find((option) => option.label.toLowerCase() === query.trim().toLowerCase())
      if (exact) choose(exact)
    }
    close()
  }

  const below = rect ? window.innerHeight - rect.bottom > 260 || rect.top < 260 : true

  return (
    <Field label={label} required={required} className={className}>
      {(id) => (
        <div ref={boxRef} className={`${styles.select} ${open ? styles.selectOpen : ''}`}>
          <input
            ref={inputRef}
            id={id}
            className={styles.selectInput}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            size={1}
            value={query ?? selected?.label ?? ''}
            onFocus={(event) => event.target.select()}
            onClick={() => (open ? undefined : openList())}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
              setOpen(true)
            }}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
          />
          <button
            type="button"
            tabIndex={-1}
            className={styles.selectChevron}
            aria-hidden="true"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              inputRef.current?.focus()
              if (open) close()
              else openList(true)
            }}
          >
            <img src={chevronIcon} alt="" />
          </button>
          {open &&
            rect &&
            createPortal(
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label={label}
                className={styles.options}
                style={{
                  left: rect.left,
                  minWidth: rect.width,
                  ...(below ? { top: rect.bottom + 4 } : { bottom: window.innerHeight - rect.top + 4 }),
                }}
                onMouseDown={(event) => event.preventDefault()}
              >
                {shown.length === 0 && <li className={styles.noMatches}>{t.form.noMatches}</li>}
                {shown.map((option, index) => (
                  <li
                    key={String(option.value)}
                    id={`${listId}-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={option.value === value}
                    className={`${styles.option} ${index === active ? styles.optionActive : ''}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(option)}
                  >
                    {option.label}
                  </li>
                ))}
              </ul>,
              document.body,
            )}
        </div>
      )}
    </Field>
  )
}
