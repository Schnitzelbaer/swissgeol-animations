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
import { CONTENT_KINDS, GROUP_STARTS, LEGEND_WIDTH, legendCycle, viewLabel, viewSymbol, viewValues } from '../components/map/boreholeLegends'
import { useBoreholeLegendView } from '../components/map/useBoreholeLegendView'
import { SegmentedControl } from '../components/SegmentedControl'
import { ContentPairs } from '../components/map/ContentPairs'
import { useVariant } from '../variants'
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
  const { setBoreholeLegend, boreholeContent, setBoreholeContent } = useStore()
  const view = useBoreholeLegendView()
  const topic = view.topic
  const openBorehole = useCallback((id: string) => navigate(`/boreholes/${id}/location`), [navigate])
  const stacked = useBoreholeStack(view, openBorehole)

  const groupStarts = view.content ? [] : (GROUP_STARTS[topic] ?? [])
  const items = viewValues(view).map((value) => ({
    icon: <SymbolIcon symbol={viewSymbol(view, value)} />,
    label: viewLabel(t, view, value),
    separator: groupStarts.includes(value),
  }))
  // «Verfügbare Inhalte» in Legende v3.1: Segmented Control über den Einträgen; in v3.2: alle Paare mit Radio Buttons
  const variant = useVariant('legend')
  const pairs = view.content && variant === 'v3-2'
  const content = pairs ? <ContentPairs value={boreholeContent} onChange={setBoreholeContent} /> : undefined
  const controls = view.content && !pairs ? (
    <SegmentedControl
      aria-label={t.boreholes.contentKindLabel}
      options={CONTENT_KINDS.map((kind) => ({ value: kind, label: t.boreholes.contentKinds[kind] }))}
      value={boreholeContent}
      onChange={setBoreholeContent}
    />
  ) : undefined
  const cycle = legendCycle(view)
  const switchLegend = () => setBoreholeLegend(cycle[(cycle.indexOf(topic) + 1) % cycle.length])

  return (
    <div className={styles.app}>
      <Header app="boreholes" />
      <div className={styles.body}>
        <Sidebar app="boreholes" />
        <main className={styles.main} style={{ '--panel-offset': '0px' } as CSSProperties}>
          <MapView
            createFeatures={createBoreholeFeatures}
            style={boreholeStyle(view)}
            center={BOREHOLES_CENTER}
            resolution={BOREHOLES_RESOLUTION}
            legend={<Legend title={t.boreholes.legends[topic]} width={LEGEND_WIDTH[topic]} items={items} onSwitch={switchLegend} scrollable controls={controls} content={content} highlightLabel={t.legend.highlightBoreholes} highlightAlways={variant === 'v4'} />}
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
