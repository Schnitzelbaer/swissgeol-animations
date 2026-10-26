import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type Variant = 'tertiary' | 'secondary' | 'secondary-solid' | 'primary'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  icon?: string
  iconPosition?: 'left' | 'right'
  label?: string
  round?: boolean
  grow?: boolean
}

export function Button({
  variant = 'tertiary',
  icon,
  iconPosition = 'left',
  label,
  round,
  grow,
  className,
  ...rest
}: Props) {
  const classes = [
    styles.button,
    styles[variant],
    label ? styles.withLabel : styles.iconOnly,
    round && styles.round,
    grow && styles.grow,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const iconEl = icon && <img src={icon} alt="" className={styles.icon} />

  return (
    <button type="button" className={classes} {...rest}>
      {iconPosition === 'left' && iconEl}
      {label && <span className="button-text">{label}</span>}
      {iconPosition === 'right' && iconEl}
    </button>
  )
}
