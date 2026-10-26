import { useId, useState, type ReactNode } from 'react'
import styles from './Section.module.css'

type Props = {
  title: string
  children: ReactNode
  /** Abstand unter dem Inhalt (Figma: meist 16px, bei «Verweise» 20px) */
  paddingBottom?: number
  gap?: number
  /** Ohne seitlichen Innenabstand: Die Einträge (z.B. Dokumente) bringen ihren eigenen mit */
  flush?: boolean
}

/** Aufklappbare Karte mit grauem Titelbalken («Boreholes Legende Drawer – Integrated») */
export function Section({ title, children, paddingBottom = 16, gap, flush }: Props) {
  const [open, setOpen] = useState(true)
  const contentId = useId()

  return (
    <section className={`${styles.section} ${open ? styles.open : ''}`}>
      <button
        type="button"
        className={styles.header}
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen(!open)}
      >
        <span className="body3-bold">{title}</span>
      </button>
      <div id={contentId} className={styles.collapse}>
        <div className={styles.clip}>
          <div className={`${styles.content} ${flush ? styles.flush : ''}`} style={flush ? undefined : { paddingBottom: paddingBottom - 1, gap }}>
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
