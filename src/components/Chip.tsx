import type { ReactNode } from 'react'
import styles from './Chip.module.css'

type Props = {
  children: ReactNode
  tone?: 'outline' | 'success' | 'neutral' | 'review' | 'white'
  size?: 'default' | 'small'
}

export function Chip({ children, tone = 'outline', size = 'default' }: Props) {
  return <span className={`${styles.chip} ${styles[tone]} ${size === 'small' ? styles.small : 'body3-medium'}`}>{children}</span>
}

/** Senkrechter Trennstrich zwischen Chip-Gruppen */
export function ChipSeparator() {
  return <span className={styles.separator} aria-hidden />
}
