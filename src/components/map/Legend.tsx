import { useState, type ReactNode } from 'react'
import { Button } from '../Button'
import { useI18n } from '../../i18n'
import styles from './Legend.module.css'
import changeIcon from '../../assets/icons/change.svg'
import lightbulbIcon from '../../assets/icons/lightbulb.svg'
import { useMapPulse } from './mapPulse'
import chevronUpIcon from '../../assets/icons/chevron-up-legend.svg'

export type LegendItem = {
  /** Bild-URL (Assets) oder gezeichnetes Symbol (Boreholes) */
  icon: string | ReactNode
  label: string
  /** Trennlinie vor dem Eintrag (Gruppen der Bohrzweck-Legende) */
  separator?: boolean
}

type Props = {
  title: string
  items: LegendItem[]
  /** Breite aus Figma: Assets 179px; bei Boreholes die Mindestbreite der jeweiligen Legende */
  width: number
  /** Wechsel-Button (zwei Pfeile): schaltet zur nächsten Legende */
  onSwitch?: () => void
  /** Lange Listen scrollen (Platz für den Scrollbalken wie in Figma) */
  scrollable?: boolean
  /** Bedienelement im Inhalt über den Einträgen, z.B. die Segmented Control in Legende v3.1 */
  controls?: ReactNode
  /** Eigener Inhalt statt der Einträge, z.B. die Paare mit Radio Buttons in Legende v3.2 */
  content?: ReactNode
  /** Beschriftung der Glühbirne (erscheint beim Hover über der Legende): lässt alle Objekte auf der Karte aufleuchten */
  highlightLabel?: string
  /** Glühbirne immer zeigen statt nur beim Hover (Legende v4) */
  highlightAlways?: boolean
}

/** Legende oben links auf der Karte («… Legende Drawer – Integrated») */
export function Legend({ title, items, width, onSwitch, scrollable, controls, content, highlightLabel, highlightAlways }: Props) {
  const { t } = useI18n()
  const pulse = useMapPulse()
  const [open, setOpen] = useState(true)

  return (
    <section
      className={`${styles.legend} ${open ? styles.open : ''} ${scrollable ? styles.scrollable : ''}`}
      style={scrollable ? { minWidth: width } : { width }}
    >
      <header className={styles.header}>
        <div className={styles.title}>
          <Button icon={changeIcon} aria-label={t.legend.switch} tooltip={onSwitch ? t.legend.switch : undefined} onClick={onSwitch} />
          {/* key: Beim Wechsel blendet der Titel neu ein */}
          <span key={title} className={`${styles.titleText} body3-bold`}>
            {title}
          </span>
          {highlightLabel && pulse && (
            <Button icon={lightbulbIcon} className={`${styles.highlight} ${highlightAlways ? styles.highlightAlways : ''}`} aria-label={highlightLabel} tooltip={highlightLabel} onClick={pulse} />
          )}
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
        <div className={styles.body}>
          {controls && <div className={styles.controls}>{controls}</div>}
          {content ?? (
            <ul key={title} className={styles.items}>
              {items.map((item) => (
                <li key={item.label} className={`${styles.item} ${item.separator ? styles.separator : ''}`}>
                  {typeof item.icon === 'string' ? <img src={item.icon} alt="" /> : item.icon}
                  <span className="body3">{item.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
