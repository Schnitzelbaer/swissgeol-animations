import { useMemo } from 'react'
import { getBorehole } from '../../data/boreholes'
import { useI18n } from '../../i18n'
import { legendLabel, legendValue, symbolKey, type LegendTopic } from './boreholeLegends'
import { SymbolIcon } from './SymbolIcon'
import type { StackedControls } from './MapView'
import styles from './BoreholePopover.module.css'

/** So viele Zeilen zeigt das Popover ohne Scrollen; die Vorschau zeigt bei mehr eine Zeile weniger und «+ N weitere» */
const VISIBLE_ROWS = 5

type Entry = { id: string; name: string; symbol: string; value: string }

function useEntries(ids: string[], topic: LegendTopic): Entry[] {
  const { t } = useI18n()
  return useMemo(
    () =>
      ids
        .map((id) => getBorehole(id))
        .filter((borehole) => borehole !== undefined)
        .map((borehole) => {
          const value = legendValue(borehole, topic)
          return { id: borehole.id, name: borehole.name, symbol: symbolKey(topic, value), value: legendLabel(t, topic, value) }
        }),
    [ids, topic, t],
  )
}

/** Pfeil rechts; in der Vorschau unsichtbar, aber mit Platz, damit das Popover beim Festhalten nicht breiter wird */
function Arrow({ hidden }: { hidden?: boolean }) {
  return (
    <svg className={`${styles.arrow} ${hidden ? styles.arrowHidden : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6.33 12.67 11 8 6.33 3.33" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RowContent({ entry }: { entry: Entry }) {
  return (
    <>
      <SymbolIcon symbol={entry.symbol} />
      <span className={styles.text}>
        <span className="body3 ellipsis">{entry.name}</span>
        <span className={`${styles.value} ellipsis`}>{entry.value}</span>
      </span>
    </>
  )
}

/** Vorschau beim Hover: dasselbe Popover, aber flüchtig und nicht klickbar (ohne Pfeile) */
export function BoreholePreview({ ids, topic }: { ids: string[]; topic: LegendTopic }) {
  const { t } = useI18n()
  const entries = useEntries(ids, topic)
  const shown = entries.length > VISIBLE_ROWS ? entries.slice(0, VISIBLE_ROWS - 1) : entries
  return (
    <div className={styles.popover}>
      <ul className={styles.list}>
        {shown.map((entry) => (
          <li key={entry.id} className={styles.row}>
            <RowContent entry={entry} />
            <Arrow hidden />
          </li>
        ))}
        {entries.length > shown.length && <li className={`${styles.row} ${styles.more} body3`}>{t.boreholes.tooltipMore(entries.length - shown.length)}</li>}
      </ul>
    </div>
  )
}

type Props = {
  ids: string[]
  topic: LegendTopic
  controls: StackedControls
  onOpen: (id: string) => void
}

/**
 * Popover nach Klick auf einen Haufen: bleibt stehen, die Zeilen sind klickbar (Pfeil rechts) und öffnen die Detailseite.
 * Schliesst mit Escape oder Klick auf die Karte.
 */
export function BoreholePopover({ ids, topic, controls, onOpen }: Props) {
  const { t } = useI18n()
  const entries = useEntries(ids, topic)
  return (
    <div className={`${styles.popover} ${controls.instant ? styles.instant : ''}`} role="dialog" aria-label={t.boreholes.popoverTitle(entries.length)}>
      <ul className={styles.list} onMouseLeave={() => controls.highlight(null)}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              className={`${styles.row} ${styles.button}`}
              onMouseEnter={() => controls.highlight(entry.id)}
              onFocus={() => controls.highlight(entry.id)}
              onClick={() => onOpen(entry.id)}
            >
              <RowContent entry={entry} />
              <Arrow />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
