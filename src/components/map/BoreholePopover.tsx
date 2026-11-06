import { useMemo } from 'react'
import { getBorehole } from '../../data/boreholes'
import { useI18n } from '../../i18n'
import { legendValue, symbolKey, type LegendTopic } from './boreholeLegends'
import { SymbolIcon } from './SymbolIcon'
import type { StackedControls } from './MapView'
import styles from './BoreholePopover.module.css'

/** Höchstens so viele Namen im Tooltip, danach «+ N weitere» */
const TOOLTIP_LIMIT = 8

/** Tooltip beim Hover: Name der Bohrung bzw. aller getroffenen Bohrungen */
export function BoreholeTooltip({ ids }: { ids: string[] }) {
  const { t } = useI18n()
  const names = ids.map((id) => getBorehole(id)?.name ?? id)
  return (
    <>
      {names.slice(0, TOOLTIP_LIMIT).map((name, index) => (
        <div key={`${name}-${index}`}>{name}</div>
      ))}
      {names.length > TOOLTIP_LIMIT && <div className={styles.more}>{t.boreholes.tooltipMore(names.length - TOOLTIP_LIMIT)}</div>}
    </>
  )
}

type Props = {
  ids: string[]
  topic: LegendTopic
  controls: StackedControls
  onOpen: (id: string) => void
}

/** Popover nach Klick auf einen Haufen: Liste der Bohrungen, ein Klick öffnet die Detailseite. Schliesst mit Escape oder Klick auf die Karte. */
export function BoreholePopover({ ids, topic, controls, onOpen }: Props) {
  const { t } = useI18n()
  const entries = useMemo(
    () =>
      ids
        .map((id) => getBorehole(id))
        .filter((borehole) => borehole !== undefined)
        .map((borehole) => ({ id: borehole.id, name: borehole.name, symbol: symbolKey(topic, legendValue(borehole, topic)) })),
    [ids, topic],
  )

  return (
    <div className={styles.popover} role="dialog" aria-label={t.boreholes.popoverTitle(entries.length)}>
      <ul className={styles.list} onMouseLeave={() => controls.highlight(null)}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <button type="button" className={styles.row} onMouseEnter={() => controls.highlight(entry.id)} onFocus={() => controls.highlight(entry.id)} onClick={() => onOpen(entry.id)}>
              <SymbolIcon symbol={entry.symbol} />
              <span className="body3 ellipsis">{entry.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
