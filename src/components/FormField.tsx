import { useId, type ReactNode } from 'react'
import { useTooltip } from './Tooltip'
import { useI18n } from '../i18n'
import styles from './FormField.module.css'
import requiredIcon from '../assets/icons/required.svg'
import helpIcon from '../assets/icons/help.svg'
import chevronIcon from '../assets/icons/chevron-down-select.svg'

function LabelIcon({ kind, hint }: { kind: 'required' | 'help'; hint: string }) {
  const { handlers, tooltip } = useTooltip(hint)
  return (
    <span {...handlers} className={styles.labelIcon} tabIndex={0} aria-label={hint}>
      <img src={kind === 'required' ? requiredIcon : helpIcon} alt="" />
      {tooltip}
    </span>
  )
}

type FieldProps = {
  label: string
  required?: boolean
  help?: string
  className?: string
  children: (id: string) => ReactNode
}

/** Feld mit Label («form / input / text v2»): Pflichtfelder mit rotem «!», Hinweise mit orangem «?» */
function Field({ label, required, help, className, children }: FieldProps) {
  const { t } = useI18n()
  const id = useId()
  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <label htmlFor={id} className={styles.label}>
        <span className="body3-medium ellipsis">{label}</span>
        {help && <LabelIcon kind="help" hint={help} />}
        {required && <LabelIcon kind="required" hint={t.form.required} />}
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
  help?: string
  className?: string
}

export function TextField({ label, value, onChange, placeholder, required, help, className }: TextFieldProps) {
  return (
    <Field label={label} required={required} help={help} className={className}>
      {(id) => <input id={id} className={styles.input} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />}
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

/** Auswahlfeld im swissgeol-Look; darunter liegt ein natives Select für Tastatur und Mobile */
export function SelectField<T extends string | number>({ label, value, options, onChange, required, className }: SelectFieldProps<T>) {
  const selected = options.find((option) => option.value === value)
  return (
    <Field label={label} required={required} className={className}>
      {(id) => (
        <div className={styles.select}>
          <span className={`${styles.selectValue} ellipsis`}>{selected?.label ?? '–'}</span>
          <span className={styles.selectChevron}>
            <img src={chevronIcon} alt="" />
          </span>
          <select
            id={id}
            value={String(value)}
            onChange={(event) => {
              const option = options.find((candidate) => String(candidate.value) === event.target.value)
              if (option) onChange(option.value)
            }}
          >
            {options.map((option) => (
              <option key={String(option.value)} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </Field>
  )
}
