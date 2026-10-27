import { useState } from 'react'
import { Button } from '../Button'
import { useI18n } from '../../i18n'
import styles from './Legend.module.css'
import changeIcon from '../../assets/icons/change.svg'
import chevronUpIcon from '../../assets/icons/chevron-up-legend.svg'
import legendPoint from '../../assets/map/legend-point.svg'
import legendLine from '../../assets/map/legend-line.svg'
import legendArea from '../../assets/map/legend-area.svg'

const items = [
  { icon: legendPoint, key: 'point' },
  { icon: legendLine, key: 'line' },
  { icon: legendArea, key: 'polygon' },
] as const

export function Legend() {
  const { t } = useI18n()
  const [open, setOpen] = useState(true)

  return (
    <section className={`${styles.legend} ${open ? styles.open : ''}`}>
      <header className={styles.header}>
        <div className={styles.title}>
          <Button icon={changeIcon} aria-label={t.legend.switch} />
          <span className="body3-bold">{t.legend.title}</span>
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
            <li key={item.key} className={styles.item}>
              <img src={item.icon} alt="" />
              <span className="body3">{t.legend[item.key]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
