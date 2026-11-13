import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { useTooltip } from './Tooltip'
import styles from './Button.module.css'

type Variant = 'tertiary' | 'tertiary-dark' | 'tertiary-destructive' | 'secondary' | 'secondary-solid' | 'primary' | 'disabled'

type CommonProps = {
  variant?: Variant
  icon?: string
  iconPosition?: 'left' | 'right'
  label?: string
  round?: boolean
  grow?: boolean
  /** Kompakte 28px-Variante (Tabellenaktionen) */
  small?: boolean
  tooltip?: ReactNode
}

type Props = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>

function classesFor({ variant = 'tertiary', label, round, grow, small }: CommonProps, className?: string) {
  return [
    styles.button,
    styles[variant],
    label ? styles.withLabel : styles.iconOnly,
    small && styles.small,
    round && styles.round,
    grow && styles.grow,
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

function Content({ icon, iconPosition = 'left', label }: CommonProps) {
  const iconEl = icon && <img src={icon} alt="" className={styles.icon} />
  return (
    <>
      {iconPosition === 'left' && iconEl}
      {label && <span className="button-text">{label}</span>}
      {iconPosition === 'right' && iconEl}
    </>
  )
}

export function Button({ variant, icon, iconPosition, label, round, grow, small, tooltip, className, ...rest }: Props) {
  const { handlers, tooltip: tooltipEl } = useTooltip(tooltip)
  return (
    <button
      type="button"
      className={classesFor({ variant, label, round, grow, small }, className)}
      {...(tooltip ? handlers : {})}
      {...rest}
    >
      <Content icon={icon} iconPosition={iconPosition} label={label} />
      {tooltip && tooltipEl}
    </button>
  )
}

/** Link im Button-Look, z.B. für Downloads */
export function ButtonLink({
  variant,
  icon,
  iconPosition,
  label,
  round,
  grow,
  small,
  tooltip,
  className,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { handlers, tooltip: tooltipEl } = useTooltip(tooltip)
  return (
    <a className={classesFor({ variant, label, round, grow, small }, className)} {...(tooltip ? handlers : {})} {...rest}>
      <Content icon={icon} iconPosition={iconPosition} label={label} />
      {tooltip && tooltipEl}
    </a>
  )
}
