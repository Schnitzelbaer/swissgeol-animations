import { useState, type ReactNode } from 'react'
import { Button } from '../Button'
import { useI18n } from '../../i18n'
import styles from './Legend.module.css'
import changeIcon from '../../assets/icons/change.svg'
import lightbulbIcon from '../../assets/icons/lightbulb.svg'
import { useMapPulse } from './mapPulse'
import { HEATMAP_GRADIENT } from './MapView'
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
  /**
   * Zweiter Zustand der Legende, z.B. die Dichte, solange die Karte herausgezoomt die Heatmap zeigt. Titel und Inhalt
   * blenden über, die Höhe passt sich animiert an; die Glühbirne entfällt, weil die Heatmap nicht pulsiert.
   */
  alternate?: { active: boolean; title: string; content: ReactNode }
  /** Zuklapp-Button (Pfeil rechts im Kopf); Assets ohne, ihre Legenden sind kurz genug */
  collapsible?: boolean
}

/** Legende oben links auf der Karte («… Legende Drawer – Integrated») */
export function Legend({ title: mainTitle, items, width, onSwitch, scrollable, controls, content, highlightLabel, highlightAlways, alternate, collapsible = true }: Props) {
  const { t } = useI18n()
  const pulse = useMapPulse()
  const [open, setOpen] = useState(true)
  const alternateActive = alternate?.active === true
  const title = alternateActive ? alternate.title : mainTitle

  const main = (
    <>
      {controls && <div className={styles.controls}>{controls}</div>}
      {content ?? (
        <ul key={mainTitle} className={styles.items}>
          {items.map((item) => (
            <li key={item.label} className={`${styles.item} ${item.separator ? styles.separator : ''}`}>
              {typeof item.icon === 'string' ? <img src={item.icon} alt="" /> : item.icon}
              <span className="body3">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )

  return (
    <section
      className={`${styles.legend} ${open ? styles.open : ''} ${scrollable ? styles.scrollable : ''} ${alternateActive ? styles.fitTitle : ''}`}
      style={scrollable || alternateActive ? { minWidth: width } : { width }}
    >
      <header className={styles.header}>
        <div className={styles.title}>
          <Button icon={changeIcon} aria-label={t.legend.switch} tooltip={onSwitch ? t.legend.switch : undefined} onClick={onSwitch} />
          {/* key: Beim Wechsel blendet der Titel neu ein */}
          <span key={title} className={`${styles.titleText} body3-bold`}>
            {title}
          </span>
          {highlightLabel && pulse && !alternateActive && (
            <Button icon={lightbulbIcon} className={`${styles.highlight} ${highlightAlways ? styles.highlightAlways : ''}`} aria-label={highlightLabel} tooltip={highlightLabel} onClick={pulse} />
          )}
        </div>
        {collapsible && (
          <Button
            icon={chevronUpIcon}
            className={styles.toggle}
            aria-label={open ? t.legend.collapse : t.legend.expand}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          />
        )}
      </header>
      <div className={styles.collapse}>
        <div className={styles.body}>
          {alternate ? (
            // Beide Inhalte untereinander: der eine klappt zu, während der andere aufklappt, so gleitet die Höhe
            <>
              <div className={`${styles.pane} ${alternateActive ? '' : styles.paneActive}`} aria-hidden={alternateActive} inert={alternateActive}>
                <div className={styles.paneInner}>{main}</div>
              </div>
              <div className={`${styles.pane} ${alternateActive ? styles.paneActive : ''}`} aria-hidden={!alternateActive} inert={!alternateActive}>
                <div className={styles.paneInner}>{alternate.content}</div>
              </div>
            </>
          ) : (
            main
          )}
        </div>
      </div>
    </section>
  )
}

/** Inhalt der Dichte-Legende: Farbverlauf der Heatmap (ohne den durchsichtigen Anfang), bewusst ohne Zahlen */
export function DensityLegend({ few, many }: { few: string; many: string }) {
  return (
    <div className={styles.density}>
      <div className={styles.densityBar} style={{ background: `linear-gradient(90deg, ${HEATMAP_GRADIENT.slice(1).join(', ')})` }} />
      <div className={`${styles.densityLabels} body3`}>
        <span>{few}</span>
        <span>{many}</span>
      </div>
    </div>
  )
}
