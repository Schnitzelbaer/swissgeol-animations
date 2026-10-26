import { useState } from 'react'
import { Button } from '../Button'
import styles from './Legend.module.css'
import changeIcon from '../../assets/icons/change.svg'
import chevronUpIcon from '../../assets/icons/chevron-up-legend.svg'
import legendPoint from '../../assets/map/legend-point.svg'
import legendLine from '../../assets/map/legend-line.svg'
import legendArea from '../../assets/map/legend-area.svg'

const items = [
  { icon: legendPoint, label: 'Asset Punkt' },
  { icon: legendLine, label: 'Asset Linie' },
  { icon: legendArea, label: 'Asset Fläche' },
]

export function Legend() {
  const [open, setOpen] = useState(true)

  return (
    <section className={`${styles.legend} ${open ? styles.open : ''}`}>
      <header className={styles.header}>
        <div className={styles.title}>
          <Button icon={changeIcon} aria-label="Legende wechseln" />
          <span className="body3-bold">Geometrie</span>
        </div>
        <Button
          icon={chevronUpIcon}
          className={styles.toggle}
          aria-label={open ? 'Legende zuklappen' : 'Legende aufklappen'}
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
