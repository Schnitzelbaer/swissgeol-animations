import type { ReactNode } from 'react'
import styles from './SaveBar.module.css'
import unsavedIcon from '../../assets/icons/unsaved.svg'

/** Speicherleiste unten: Hinweis auf ungespeicherte Änderungen links, Aktionen rechts */
export function SaveBar({ dirty, children, className }: { dirty: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`${styles.bar} ${className ?? ''}`}>
      <div className={`${styles.status} ${dirty ? styles.dirty : ''}`} aria-live="polite">
        <img src={unsavedIcon} alt="" />
        <span className="body3 ellipsis">Ungespeicherte Änderungen</span>
      </div>
      <div className={styles.actions}>{children}</div>
    </div>
  )
}
