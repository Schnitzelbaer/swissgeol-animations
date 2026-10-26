import type { ReactNode } from 'react'
import styles from './Chip.module.css'

type Props = {
  children: ReactNode
  tone?: 'outline' | 'success' | 'neutral'
}

export function Chip({ children, tone = 'outline' }: Props) {
  return <span className={`${styles.chip} ${styles[tone]} body3-medium`}>{children}</span>
}

/** Senkrechter Trennstrich zwischen Chip-Gruppen */
export function ChipSeparator() {
  return <span className={styles.separator} aria-hidden />
}
