import { useI18n } from '../../i18n'
import { CONTENT_KINDS, type ContentKind } from './boreholeLegends'
import { SymbolIcon } from './SymbolIcon'
import styles from './ContentPairs.module.css'

type Props = {
  value: ContentKind
  onChange: (kind: ContentKind) => void
}

/**
 * Legende v3.2, «Verfügbare Inhalte»: alle drei Paare vorhanden / nicht vorhanden wie in Figma «Legende v1»,
 * davor je ein Radio Button. Einer ist immer gewählt; die Karte zeigt den gewählten Inhalt.
 */
export function ContentPairs({ value, onChange }: Props) {
  const { t } = useI18n()
  return (
    <div className={styles.pairs} role="radiogroup" aria-label={t.boreholes.contentKindLabel}>
      {CONTENT_KINDS.map((kind) => (
        <label key={kind} className={styles.pair}>
          <input type="radio" name="borehole-content" className={styles.radio} checked={kind === value} onChange={() => onChange(kind)} />
          <span className={styles.entries}>
            <span className={styles.entry}>
              <SymbolIcon symbol={`Inhalt/${kind}`} />
              <span className="body3">{t.boreholes.contentPresent[kind]}</span>
            </span>
            <span className={styles.entry}>
              <SymbolIcon symbol="Inhalt/Nicht vorhanden" />
              <span className="body3">{t.boreholes.contentMissing[kind]}</span>
            </span>
          </span>
        </label>
      ))}
    </div>
  )
}
