import { useCallback, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { TableBar } from '../components/TableBar'
import { MapView } from '../components/map/MapView'
import { Legend } from '../components/map/Legend'
import { SymbolIcon } from '../components/map/SymbolIcon'
import { useBoreholeStack } from '../components/map/boreholeStack'
import { boreholeStyle } from '../components/map/boreholeStyles'
import { GROUP_STARTS, LEGEND_TOPICS, LEGEND_VALUES, LEGEND_WIDTH, legendLabel, symbolKey } from '../components/map/boreholeLegends'
import { BOREHOLE_CLUSTERS, BOREHOLES_CENTER, BOREHOLES_RESOLUTION, createBoreholeFeatures } from '../components/map/boreholeGeometries'
import { useStore } from '../data/store'
import { useI18n } from '../i18n'
import styles from './MapPage.module.css'

/** Anzahl Bohrungen wie im Figma-Screen */
const BOREHOLE_COUNT = 23000

/**
 * Startseite der Applikation Boreholes (Figma 7558:31771): Karte mit Bohrungen in der ganzen Schweiz.
 * Der Wechsel-Button der Legende schaltet durch die fünf Legenden aus Figma (Section 8269:20012).
 * Ein Klick auf eine Bohrung öffnet direkt ihre Detailseite, bei mehreren übereinander ein Popover.
 */
export function BoreholesMapPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { boreholeLegend: topic, setBoreholeLegend } = useStore()
  const openBorehole = useCallback((id: string) => navigate(`/boreholes/${id}/location`), [navigate])
  const stacked = useBoreholeStack(topic, openBorehole)

  const groupStarts = GROUP_STARTS[topic] ?? []
  const items = LEGEND_VALUES[topic].map((value) => ({
    icon: <SymbolIcon symbol={symbolKey(topic, value)} />,
    label: legendLabel(t, topic, value),
    separator: groupStarts.includes(value),
  }))
  const switchLegend = () => setBoreholeLegend(LEGEND_TOPICS[(LEGEND_TOPICS.indexOf(topic) + 1) % LEGEND_TOPICS.length])

  return (
    <div className={styles.app}>
      <Header app="boreholes" />
      <div className={styles.body}>
        <Sidebar app="boreholes" />
        <main className={styles.main} style={{ '--panel-offset': '0px' } as CSSProperties}>
          <MapView
            createFeatures={createBoreholeFeatures}
            style={boreholeStyle(topic)}
            center={BOREHOLES_CENTER}
            resolution={BOREHOLES_RESOLUTION}
            legend={<Legend title={t.boreholes.legends[topic]} width={LEGEND_WIDTH[topic]} items={items} onSwitch={switchLegend} scrollable />}
            onFeatureClick={openBorehole}
            stacked={stacked}
            clusters={BOREHOLE_CLUSTERS}
          />
          <TableBar count={t.boreholes.count(BOREHOLE_COUNT)} />
        </main>
      </div>
    </div>
  )
}
