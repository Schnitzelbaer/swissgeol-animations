import { useState } from 'react'
import { Button } from '../Button'
import { useI18n } from '../../i18n'
import styles from './Legend.module.css'
import changeIcon from '../../assets/icons/change.svg'
import chevronUpIcon from '../../assets/icons/chevron-up-legend.svg'

type Props = {
  title: string
  items: { icon: string; label: string }[]
  /** Breite aus Figma: Assets 179px, Boreholes 212px */
  width: number
}

/** Legende oben links auf der Karte («… Legende Drawer – Integrated») */
export function Legend({ title, items, width }: Props) {
  const { t } = useI18n()
  const [open, setOpen] = useState(true)

  return (
    <section className={`${styles.legend} ${open ? styles.open : ''}`} style={{ width }}>
      <header className={styles.header}>
        <div className={styles.title}>
          <Button icon={changeIcon} aria-label={t.legend.switch} />
          <span className="body3-bold">{title}</span>
        </div>
        <Button
          icon={chevronUpIcon}
          className={styles.toggle}
          aria-label={open ? t.legend.collapse : t.legend.expand}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        />
      </header>
      <div className={styles.collapse}>
        <ul className={styles.items}>
          {items.map((item) => (
            <li key={item.label} className={styles.item}>
              <img src={item.icon} alt="" />
              <span className="body3">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
